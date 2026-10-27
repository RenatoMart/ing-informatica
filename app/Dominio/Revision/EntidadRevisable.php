<?php

namespace App\Dominio\Revision;

use App\Dominio\Revision\Politicas\PoliticaCampanaAdmision;
use App\Dominio\Revision\Politicas\PoliticaDocente;
use App\Dominio\Revision\Politicas\PoliticaDocumentoOficial;
use App\Dominio\Revision\Politicas\PoliticaPlanEstudios;
use App\Dominio\Revision\Politicas\PoliticaPublicacion;

/**
 * Las cinco entidades que pasan por la revisión del Director (sección 2).
 * El valor es el que viaja en la URL (`/revision/{entidad}/...`), en `historial_revision.entidad`
 * y en el primer argumento de `sp_rev_transicion`.
 */
enum EntidadRevisable: string
{
    case Publicacion = 'publicacion';
    case Docente = 'docente';
    case Plan = 'plan';
    case Documento = 'documento';
    case Campana = 'campana';

    /** Tabla del diccionario. */
    public function tabla(): string
    {
        return match ($this) {
            self::Publicacion => 'publicacion',
            self::Docente => 'docente',
            self::Plan => 'plan_estudios',
            self::Documento => 'documento_oficial',
            self::Campana => 'campana_admision',
        };
    }

    /** Clave primaria de la tabla. */
    public function clavePrimaria(): string
    {
        return match ($this) {
            self::Publicacion => 'id_publicacion',
            self::Docente => 'id_docente',
            self::Plan => 'id_plan',
            self::Documento => 'id_documento',
            self::Campana => 'id_campana',
        };
    }

    /** Función PL/pgSQL que aplica la decisión del revisor. */
    public function funcionDecidir(): string
    {
        return 'sp_'.$this->value.'_decidir';
    }

    /** Solo publicación y docente usan `operacion_pendiente` / `cambios_pendientes` (2.1, punto 4). */
    public function admiteOperacionPendiente(): bool
    {
        return $this === self::Publicacion || $this === self::Docente;
    }

    /** Nombre legible para correos y mensajes. */
    public function etiqueta(): string
    {
        return match ($this) {
            self::Publicacion => 'Publicación',
            self::Docente => 'Docente',
            self::Plan => 'Plan de estudios',
            self::Documento => 'Documento oficial',
            self::Campana => 'Campaña de admisión',
        };
    }

    public function politica(): PoliticaRevision
    {
        return match ($this) {
            self::Publicacion => new PoliticaPublicacion,
            self::Docente => new PoliticaDocente,
            self::Plan => new PoliticaPlanEstudios,
            self::Documento => new PoliticaDocumentoOficial,
            self::Campana => new PoliticaCampanaAdmision,
        };
    }
}
