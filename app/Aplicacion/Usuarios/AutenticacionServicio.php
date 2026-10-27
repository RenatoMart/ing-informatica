<?php

namespace App\Aplicacion\Usuarios;

use App\Aplicacion\Usuarios\Correos\RecuperacionContrasenaMail;
use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Usuarios\AccionBitacora;
use App\Dominio\Usuarios\CuentaBloqueadaException;
use App\Dominio\Usuarios\PoliticaBloqueoAcceso;
use App\Dominio\Usuarios\PoliticaContrasena;
use App\Dominio\Usuarios\TokenRecuperacion;
use App\Persistencia\Usuarios\BitacoraRepositorio;
use App\Persistencia\Usuarios\TokenRecuperacionRepositorio;
use App\Persistencia\Usuarios\UsuarioAutenticable;
use App\Persistencia\Usuarios\UsuarioRepositorio;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Session;
use Throwable;

/**
 * HU1: inicio y cierre de sesión, perfil, cambio de contraseña y recuperación (3.1 y 3.4).
 * No usa `Auth::attempt` para poder registrar en la bitácora cada denegación.
 */
class AutenticacionServicio
{
    /** Hash con el que se compara cuando el correo no existe (iguala el tiempo de respuesta). */
    private const HASH_SENUELO = '$2y$12$gYsplUOThvput38V/b1ehOASA/APtj8ve4ueuKC5kx2sqONbHtoSK';

    public function __construct(
        private readonly UsuarioRepositorio $usuarios,
        private readonly BitacoraRepositorio $bitacora,
        private readonly TokenRecuperacionRepositorio $tokens,
    ) {}

    /**
     * @return array<string, mixed> Perfil del usuario ({@see perfil()}).
     *
     * @throws ReglaNegocioException `CREDENCIALES_INVALIDAS` (mensaje genérico)
     * @throws AccesoDenegadoException `CUENTA_INACTIVA`
     * @throws CuentaBloqueadaException
     */
    public function iniciarSesion(string $correo, string $contrasena, ?string $ip): array
    {
        $claveBloqueo = PoliticaBloqueoAcceso::clave($correo);

        if (RateLimiter::tooManyAttempts($claveBloqueo, PoliticaBloqueoAcceso::MAXIMO_FALLOS)) {
            throw new CuentaBloqueadaException(RateLimiter::availableIn($claveBloqueo));
        }

        $usuario = $this->usuarios->buscarPorCorreo($correo);
        $hash = $usuario === null ? null : $this->usuarios->hashContrasena($usuario->idUsuario);
        $valida = Hash::check($contrasena, $hash ?? self::HASH_SENUELO) && $hash !== null;

        if ($usuario === null || ! $valida) {
            RateLimiter::hit($claveBloqueo, PoliticaBloqueoAcceso::SEGUNDOS_BLOQUEO);

            if ($usuario !== null) {
                $this->bitacora->registrar($usuario->idUsuario, AccionBitacora::AccesoFallido, 'Contraseña incorrecta', $ip, null);
            }

            throw new ReglaNegocioException('Correo o contraseña incorrectos.', null, 'CREDENCIALES_INVALIDAS');
        }

        if (! $usuario->estaActivo()) {
            $this->bitacora->registrar($usuario->idUsuario, AccionBitacora::Denegado, 'Inicio de sesión con cuenta inactiva', $ip, null);

            throw new AccesoDenegadoException('Su cuenta está inactiva. Comuníquese con la Dirección de Escuela.', null, 'CUENTA_INACTIVA');
        }

        RateLimiter::clear($claveBloqueo);

        Auth::guard('web')->login(UsuarioAutenticable::query()->findOrFail($usuario->idUsuario));
        Session::regenerate();

        $this->bitacora->registrar($usuario->idUsuario, AccionBitacora::InicioSesion, null, $ip, $usuario->idUsuario);

        return $usuario->perfil();
    }

    public function cerrarSesion(int $idUsuario, ?string $ip): void
    {
        $this->bitacora->registrar($idUsuario, AccionBitacora::CierreSesion, null, $ip, $idUsuario);

        Auth::guard('web')->logout();
        Session::invalidate();
        Session::regenerateToken();
    }

    /**
     * @return array<string, mixed>
     */
    public function perfil(int $idUsuario): array
    {
        return $this->usuarios->buscar($idUsuario)->perfil();
    }

    /**
     * @throws ReglaNegocioException
     */
    public function cambiarContrasena(int $idUsuario, string $actual, string $nueva, ?string $ip): void
    {
        $usuario = $this->usuarios->buscar($idUsuario);
        $hash = (string) $this->usuarios->hashContrasena($idUsuario);

        if (! Hash::check($actual, $hash)) {
            throw new ReglaNegocioException('La contraseña actual no es correcta.', 'contrasena_actual');
        }

        PoliticaContrasena::validar($nueva, $usuario->correo, Hash::check($nueva, $hash));

        $this->usuarios->cambiarContrasena($idUsuario, Hash::make($nueva), $ip);

        Session::regenerate();
    }

    /**
     * Siempre termina sin error (202) para no revelar si el correo existe.
     */
    public function solicitarRecuperacion(string $correo, ?string $ip): void
    {
        $token = TokenRecuperacion::generar();
        $minutos = (int) config('portal.minutos_token', 60);
        $correo = mb_strtolower(trim($correo));

        if ($this->tokens->crear($correo, $token->hash(), $minutos, $ip) === null) {
            return;
        }

        $enlace = config('portal.url_panel').'/restablecer?'.http_build_query(['token' => $token->valor, 'correo' => $correo]);

        try {
            Mail::to($correo)->send(new RecuperacionContrasenaMail($enlace, $minutos));
        } catch (Throwable $error) {
            Log::warning('No se pudo enviar el correo de recuperación.', ['error' => $error->getMessage()]);
        }
    }

    /**
     * Consume el token (uso único), fija la nueva contraseña y revoca las sesiones abiertas.
     *
     * @throws ReglaNegocioException
     */
    public function restablecer(string $correo, string $token, string $nueva, ?string $ip): void
    {
        $tokenRecuperacion = TokenRecuperacion::desde($token);
        $usuario = $this->usuarios->buscarPorCorreo($correo);
        $hashActual = $usuario === null ? null : $this->usuarios->hashContrasena($usuario->idUsuario);

        PoliticaContrasena::validar($nueva, $correo, $hashActual !== null && Hash::check($nueva, $hashActual));

        $this->tokens->consumir($correo, $tokenRecuperacion->hash(), Hash::make($nueva), $ip);

        RateLimiter::clear(PoliticaBloqueoAcceso::clave($correo));
    }
}
