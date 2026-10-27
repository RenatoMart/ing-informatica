<?php

namespace App\Dominio\Revision\Politicas;

use App\Dominio\Revision\AccionRevision as A;
use App\Dominio\Revision\ActorRevision as Actor;
use App\Dominio\Revision\EntidadRevisable;

/**
 * Campaña de admisión: `borrador, en_revision, vigente, cerrada, archivada`.
 * `descartar` no está permitido (409). Al aprobar una campaña, la vigente o cerrada pasa a `archivada`.
 */
final class PoliticaCampanaAdmision extends PoliticaBase
{
    public function entidad(): EntidadRevisable
    {
        return EntidadRevisable::Campana;
    }

    public function estados(): array
    {
        return ['borrador', 'en_revision', 'vigente', 'cerrada', 'archivada'];
    }

    public function estadosPublicos(): array
    {
        return ['vigente'];
    }

    public function transiciones(): array
    {
        return [
            self::t(null, null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::EnviarRevision, 'en_revision', null, Actor::Editor),
            self::t('en_revision', null, A::Aprobar, 'vigente', null, Actor::Revisor),
            self::t('en_revision', null, A::Observar, 'borrador', null, Actor::Revisor),
            self::t('vigente', null, A::Cerrar, 'cerrada', null, Actor::Sistema),
            self::t('vigente', null, A::ReemplazarVigente, 'archivada', null, Actor::Sistema),
            self::t('cerrada', null, A::ReemplazarVigente, 'archivada', null, Actor::Sistema),
        ];
    }
}
