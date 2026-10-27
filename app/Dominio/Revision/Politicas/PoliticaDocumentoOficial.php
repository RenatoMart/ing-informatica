<?php

namespace App\Dominio\Revision\Politicas;

use App\Dominio\Revision\AccionRevision as A;
use App\Dominio\Revision\ActorRevision as Actor;
use App\Dominio\Revision\EntidadRevisable;

/**
 * Documento oficial: `en_revision, vigente, historico, vencido, no_publicado`.
 * No hay borrador: el registro nuevo entra directamente en revisión (sección 2.2).
 */
final class PoliticaDocumentoOficial extends PoliticaBase
{
    public function entidad(): EntidadRevisable
    {
        return EntidadRevisable::Documento;
    }

    public function estados(): array
    {
        return ['en_revision', 'vigente', 'historico', 'vencido', 'no_publicado'];
    }

    public function estadosPublicos(): array
    {
        return ['vigente', 'historico'];
    }

    public function transiciones(): array
    {
        return [
            self::t(null, null, A::Guardar, 'en_revision', null, Actor::Editor),
            self::t('en_revision', null, A::Aprobar, 'vigente', null, Actor::Revisor),
            self::t('en_revision', null, A::Observar, 'no_publicado', null, Actor::Revisor),
            self::t('en_revision', null, A::Descartar, 'no_publicado', null, Actor::Revisor),
            self::t('no_publicado', null, A::Guardar, 'no_publicado', null, Actor::Editor),
            self::t('no_publicado', null, A::Reenviar, 'en_revision', null, Actor::Editor),
            self::t('vigente', null, A::Vencer, 'vencido', null, Actor::Sistema),
            self::t('vigente', null, A::ReemplazarVigente, 'historico', null, Actor::Sistema),
            self::t('vencido', null, A::ReemplazarVigente, 'historico', null, Actor::Sistema),
        ];
    }
}
