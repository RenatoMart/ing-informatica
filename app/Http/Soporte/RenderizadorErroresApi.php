<?php

namespace App\Http\Soporte;

use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Convierte cualquier excepción de una petición `api/*` al formato de error de la sección 5.1.
 * Se registra en `bootstrap/app.php` con `$exceptions->render(...)`.
 */
final class RenderizadorErroresApi
{
    /** Indica si la petición debe recibir errores JSON del portal. */
    public static function aplica(Request $request): bool
    {
        return $request->is('api', 'api/*');
    }

    public function __invoke(Throwable $error, Request $request): ?JsonResponse
    {
        if (! self::aplica($request)) {
            return null;
        }

        return $this->renderizar($error);
    }

    public function renderizar(Throwable $error): JsonResponse
    {
        return match (true) {
            $error instanceof ValidationException => RespuestaError::json(
                422,
                'VALIDACION',
                'Revise los campos marcados.',
                $error->errors(),
            ),
            $error instanceof ExcepcionDominio => RespuestaError::json(
                $error->estadoHttp(),
                $error->codigo(),
                $error->getMessage(),
                $error->campos(),
            ),
            $error instanceof AuthenticationException => RespuestaError::json(401, 'NO_AUTENTICADO', 'Debe iniciar sesión.'),
            $error instanceof AuthorizationException => RespuestaError::json(403, 'ROL_NO_AUTORIZADO', 'No tiene permiso para esta acción.'),
            $error instanceof TokenMismatchException => $this->csrfVencido(),
            $error instanceof HttpExceptionInterface => $this->desdeHttp($error),
            default => $this->interno($error),
        };
    }

    private function desdeHttp(HttpExceptionInterface&Throwable $error): JsonResponse
    {
        $estado = $error->getStatusCode();
        $cabeceras = $error->getHeaders();

        if ($error->getPrevious() instanceof TokenMismatchException || $estado === 419) {
            return $this->csrfVencido();
        }

        return match ($estado) {
            401 => RespuestaError::json(401, 'NO_AUTENTICADO', 'Debe iniciar sesión.', [], $cabeceras),
            403 => RespuestaError::json(403, 'ROL_NO_AUTORIZADO', 'No tiene permiso para esta acción.', [], $cabeceras),
            404 => RespuestaError::json(404, 'NO_ENCONTRADO', 'Recurso no encontrado.', [], $cabeceras),
            405 => RespuestaError::json(405, 'METODO_NO_PERMITIDO', 'Método no permitido para esta ruta.', [], $cabeceras),
            413 => RespuestaError::json(413, 'ARCHIVO_DEMASIADO_GRANDE', 'El archivo o la petición superan el tamaño permitido.', [], $cabeceras),
            429 => RespuestaError::json(429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos. Intente nuevamente más tarde.', [], $cabeceras),
            503 => RespuestaError::json(503, 'SERVICIO_NO_DISPONIBLE', 'El servicio no está disponible en este momento.', [], $cabeceras),
            default => $estado >= 500
                ? $this->interno($error)
                : RespuestaError::json($estado, 'ERROR_HTTP', $error->getMessage() !== '' ? $error->getMessage() : 'La petición no se pudo procesar.', [], $cabeceras),
        };
    }

    private function csrfVencido(): JsonResponse
    {
        return RespuestaError::json(419, 'CSRF_VENCIDO', 'La sesión de seguridad expiró. Recargue e intente de nuevo.');
    }

    private function interno(Throwable $error): JsonResponse
    {
        $mensaje = config('app.debug')
            ? 'Error interno: '.$error->getMessage()
            : 'Ocurrió un error inesperado. Intente nuevamente más tarde.';

        return RespuestaError::json(500, 'ERROR_INTERNO', $mensaje);
    }
}
