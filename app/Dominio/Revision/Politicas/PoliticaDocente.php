<?php

namespace App\Dominio\Revision\Politicas;

use App\Dominio\Revision\AccionRevision as A;
use App\Dominio\Revision\ActorRevision as Actor;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\OperacionPendiente as Op;

/**
 * Docente: `borrador, en_revision, publicado, inactivo`. Como la publicación, pero sin `descartar`,
 * la baja aprobada deja el registro `inactivo` y existe `reactivar` (sección 2.2).
 */
final class PoliticaDocente extends PoliticaBase
{
    public function entidad(): EntidadRevisable
    {
        return EntidadRevisable::Docente;
    }

    public function estados(): array
    {
        return ['borrador', 'en_revision', 'publicado', 'inactivo'];
    }

    public function estadosPublicos(): array
    {
        return ['publicado'];
    }

    public function transiciones(): array
    {
        return [
            self::t(null, null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::EnviarRevision, 'en_revision', null, Actor::Editor),
            self::t('en_revision', null, A::Aprobar, 'publicado', null, Actor::Revisor),
            self::t('en_revision', null, A::Observar, 'borrador', null, Actor::Revisor),
            self::t('publicado', null, A::ProponerCambio, 'publicado', Op::Cambio, Actor::Editor),
            self::t('publicado', Op::Cambio, A::ProponerCambio, 'publicado', Op::Cambio, Actor::Editor),
            self::t('publicado', null, A::SolicitarBaja, 'publicado', Op::Baja, Actor::Editor),
            self::t('publicado', Op::Cambio, A::Aprobar, 'publicado', null, Actor::Revisor),
            self::t('publicado', Op::Baja, A::Aprobar, 'inactivo', null, Actor::Revisor),
            self::t('publicado', Op::Cambio, A::Observar, 'publicado', null, Actor::Revisor),
            self::t('publicado', Op::Baja, A::Observar, 'publicado', null, Actor::Revisor),
            self::t('inactivo', null, A::Reactivar, 'borrador', null, Actor::Editor),
        ];
    }
}
