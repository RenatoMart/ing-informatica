<?php

namespace Tests\Concerns;

use App\Dominio\Compartido\UsuarioAutenticado;
use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Auth\GenericUser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Datos de las pruebas del módulo DocumentosAdmision (HU5), siempre creados con las funciones `sp_`.
 * Se usa junto a {@see CreaDatosPortal}.
 */
trait DatosDocumentosAdmision
{
    /** Asegura los tres roles del portal en el schema de pruebas. */
    protected function asegurarRoles(): void
    {
        DB::statement("INSERT INTO rol (nombre, descripcion) VALUES ('Editor', 'E'), ('Revisor', 'R'), ('Administrador', 'A') ON CONFLICT (nombre) DO NOTHING");
    }

    /**
     * Abre sesión en el guard del panel con un usuario ya creado (sin depender del modelo Eloquent de B4).
     */
    protected function actuarComo(int $idUsuario, string $rol): int
    {
        $this->actingAs(new class(['id' => $idUsuario, 'rol' => $rol]) extends GenericUser implements UsuarioAutenticado
        {
            public function idUsuario(): int
            {
                return (int) $this->attributes['id'];
            }

            public function nombreRol(): string
            {
                return (string) $this->attributes['rol'];
            }

            public function estaActivo(): bool
            {
                return true;
            }

            public function debeCambiarContrasena(): bool
            {
                return false;
            }
        });

        return $idUsuario;
    }

    /** Crea un departamento con correo y devuelve su `id_departamento`. */
    protected function crearDepartamentoEmisor(?string $correo = 'area.emisora@unitru.edu.pe'): int
    {
        return (int) DB::table('departamento')->insertGetId([
            'nombre' => 'Departamento de prueba '.fake()->unique()->numerify('######'),
            'correo' => $correo,
        ], 'id_departamento');
    }

    protected function pdfDePrueba(string $nombre = 'resolucion.pdf', int $kb = 120): UploadedFile
    {
        return UploadedFile::fake()->create($nombre, $kb, 'application/pdf');
    }

    /**
     * Datos de formulario de un documento (fechas relativas a hoy).
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    protected function datosDocumento(int $idDepartamento, array $extra = []): array
    {
        return array_merge([
            'tipo' => 'resolucion',
            'numero' => 'RES-'.fake()->unique()->numerify('####'),
            'titulo' => 'Resolución de prueba',
            'fecha_emision' => now()->subMonth()->toDateString(),
            'id_departamento_emisor' => $idDepartamento,
            'fecha_vigencia' => now()->addYear()->toDateString(),
        ], $extra);
    }

    /**
     * Registra un documento con `sp_documento_registrar` (queda `en_revision`).
     *
     * @param  array<string, mixed>  $extra
     */
    protected function crearDocumentoEnRevision(int $idEditor, int $idDepartamento, array $extra = [], ?int $idVersionAnterior = null): int
    {
        $d = $this->datosDocumento($idDepartamento, $extra);

        return (int) app(EjecutorProcedimientos::class)->escalar('sp_documento_registrar', [
            $idEditor, $d['tipo'], $d['numero'], $d['titulo'], $d['fecha_emision'],
            $d['id_departamento_emisor'], $d['fecha_vigencia'], 'documentos/'.fake()->uuid().'.pdf', $idVersionAnterior,
        ]);
    }

    /**
     * Registra y aprueba un documento (queda `vigente`).
     *
     * @param  array<string, mixed>  $extra
     */
    protected function crearDocumentoVigente(int $idEditor, int $idRevisor, int $idDepartamento, array $extra = [], ?int $idVersionAnterior = null): int
    {
        $id = $this->crearDocumentoEnRevision($idEditor, $idDepartamento, $extra, $idVersionAnterior);
        app(EjecutorProcedimientos::class)->escalar('sp_documento_decidir', [$idRevisor, $id, 'aprobar', null]);

        return $id;
    }

    /**
     * Datos de formulario de una campaña (ventana de hoy + 60 días).
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    protected function datosCampana(array $extra = []): array
    {
        return array_merge([
            'anio' => (int) now()->format('Y') + 1,
            'proceso' => 'I',
            'fecha_inicio' => now()->toDateString(),
            'fecha_fin' => now()->addDays(60)->toDateString(),
            'url_portal' => 'https://admision.unitru.edu.pe/portal',
            'url_estadisticas' => 'https://admision.unitru.edu.pe/estadisticas',
        ], $extra);
    }

    /**
     * Campaña en borrador con una modalidad y un hito (válida para enviar a revisión).
     *
     * @param  array<string, mixed>  $extra
     */
    protected function crearCampanaBorrador(int $idEditor, array $extra = []): int
    {
        $sp = app(EjecutorProcedimientos::class);
        $d = $this->datosCampana($extra);

        $id = (int) $sp->escalar('sp_campana_crear', [
            $idEditor, $d['anio'], $d['proceso'], $d['fecha_inicio'], $d['fecha_fin'], $d['url_portal'], $d['url_estadisticas'],
        ]);
        $sp->escalar('sp_modalidad_guardar', [$idEditor, $id, null, 'Ordinario', 'Egresados de secundaria', 30, null]);
        $sp->escalar('sp_hito_guardar', [$idEditor, $id, null, 'Inscripciones', $d['fecha_inicio']]);

        return $id;
    }

    /**
     * Campaña aprobada (`vigente`).
     *
     * @param  array<string, mixed>  $extra
     */
    protected function crearCampanaAprobada(int $idEditor, int $idRevisor, array $extra = []): int
    {
        $sp = app(EjecutorProcedimientos::class);
        $id = $this->crearCampanaBorrador($idEditor, $extra);
        $sp->ejecutar('sp_campana_enviar_revision', [$idEditor, $id, true]);
        $sp->escalar('sp_campana_decidir', [$idRevisor, $id, 'aprobar', null]);

        return $id;
    }
}
