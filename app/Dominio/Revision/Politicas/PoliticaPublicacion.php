<?php

namespace App\Dominio\Revision\Politicas;

use App\Dominio\Revision\AccionRevision as A;
use App\Dominio\Revision\ActorRevision as Actor;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\OperacionPendiente as Op;

/**
 * Publicación: `borrador, en_revision, publicada, descartada, despublicada` (sección 2.2).
 */
final class PoliticaPublicacion extends PoliticaBase
{
    public function entidad(): EntidadRevisable
    {
        return EntidadRevisable::Publicacion;
    }

    public function estados(): array
    {
        return ['borrador', 'en_revision', 'publicada', 'descartada', 'despublicada'];
    }

    public function estadosPublicos(): array
    {
        return ['publicada'];
    }

    public function transiciones(): array
    {
        return [
            self::t(null, null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::Guardar, 'borrador', null, Actor::Editor),
            self::t('borrador', null, A::EnviarRevision, 'en_revision', null, Actor::Editor),
            self::t('borrador', null, A::Descartar, 'descartada', null, Actor::Editor),
            self::t('en_revision', null, A::Aprobar, 'publicada', null, Actor::Revisor),
            self::t('en_revision', null, A::Observar, 'borrador', null, Actor::Revisor),
            self::t('en_revision', null, A::Descartar, 'descartada', null, Actor::Revisor),
            self::t('publicada', null, A::ProponerCambio, 'publicada', Op::Cambio, Actor::Editor),
            self::t('publicada', Op::Cambio, A::ProponerCambio, 'publicada', Op::Cambio, Actor::Editor),
            self::t('publicada', null, A::SolicitarBaja, 'publicada', Op::Baja, Actor::Editor),
            self::t('publicada', Op::Cambio, A::Aprobar, 'publicada', null, Actor::Revisor),
            self::t('publicada', Op::Baja, A::Aprobar, 'despublicada', null, Actor::Revisor),
            self::t('publicada', Op::Cambio, A::Observar, 'publicada', null, Actor::Revisor),
            self::t('publicada', Op::Cambio, A::Descartar, 'publicada', null, Actor::Revisor),
            self::t('publicada', Op::Baja, A::Observar, 'publicada', null, Actor::Revisor),
            self::t('publicada', Op::Baja, A::Descartar, 'publicada', null, Actor::Revisor),
        ];
    }
}
