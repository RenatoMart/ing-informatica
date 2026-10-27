<?php

namespace App\Dominio\Revision\Politicas;

use App\Dominio\Revision\AccionRevision as A;
use App\Dominio\Revision\ActorRevision as Actor;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\MaquinaEstadosRevision;

/**
 * Plan de estudios: `borrador, en_revision, vigente, historico, descartado` (sección 2.2).
 *
 * `aprobar` lleva a `vigente` (caso `como_vigente = true`). Con `como_vigente = false` el destino es
 * `historico`: lo resuelve {@see MaquinaEstadosRevision::siguiente()} y,
 * en SQL, `sp_plan_decidir` (sp_rev_transicion devuelve `vigente`).
 * `reemplazar_vigente` es el efecto sobre el vigente anterior al aprobar otro como vigente.
 */
final class PoliticaPlanEstudios extends PoliticaBase
{
    public const ESTADO_APROBADO_CONSULTABLE = 'historico';

    public function entidad(): EntidadRevisable
    {
        return EntidadRevisable::Plan;
    }

    public function estados(): array
    {
        return ['borrador', 'en_revision', 'vigente', 'historico', 'descartado'];
    }

    public function estadosPublicos(): array
    {
        return ['vigente', 'historico'];
    }

    public function transiciones(): array
    {
        return [
            self::t(null, null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::EnviarRevision, 'en_revision', null, Actor::Editor),
            self::t('en_revision', null, A::Aprobar, 'vigente', null, Actor::Revisor),
            self::t('en_revision', null, A::Observar, 'borrador', null, Actor::Revisor),
            self::t('en_revision', null, A::Descartar, 'descartado', null, Actor::Revisor),
            self::t('vigente', null, A::ReemplazarVigente, 'historico', null, Actor::Sistema),
        ];
    }
}
