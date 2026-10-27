import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { Cargando, EncabezadoPagina, ErrorEstado, Tarjeta } from '../componentes';
import { useDashboard } from '../controladores/DashboardController';
import { ETIQUETA_ENTIDAD, type EntidadRevisable } from '../modelos/comunes';
import { useSesion } from '../sesion/SesionContext';

function Kpi({ etiqueta, valor, a, alerta, nota }: { etiqueta: string; valor: ReactNode; a?: string; alerta?: boolean; nota?: ReactNode }) {
  const cuerpo = (
    <>
      <p className="text-sm font-semibold text-gray-600">{etiqueta}</p>
      <p className={clsx('mt-1 font-display text-3xl font-bold tabular-nums', alerta ? 'text-danger' : 'text-primary')}>{valor}</p>
      {nota && <p className="mt-1 text-xs text-gray-500">{nota}</p>}
    </>
  );
  const base = 'block rounded-lg border bg-white p-4 shadow-sm';
  return a ? (
    <Link to={a} className={clsx(base, 'transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-gold', alerta ? 'border-danger/40' : 'border-gray-200')}>
      {cuerpo}
    </Link>
  ) : (
    <div className={clsx(base, alerta ? 'border-danger/40' : 'border-gray-200')}>{cuerpo}</div>
  );
}

const fecha = (f: string) => new Date(f.length <= 10 ? `${f}T00:00:00` : f).toLocaleDateString('es-PE', { dateStyle: 'long' });

/** `/panel` — KPIs y pendientes según el rol (Editor/Revisor o Administrador). */
export default function PaginaDashboard() {
  const { usuario, rol } = useSesion();
  const q = useDashboard();
  const d = q.data;
  const esAdmin = rol === 'Administrador';

  return (
    <>
      <EncabezadoPagina
        titulo="Inicio"
        descripcion={usuario ? `Bienvenido, ${usuario.nombres}. Este es el resumen de hoy.` : undefined}
      />
      {q.isLoading && <Cargando etiqueta="Cargando resumen…" />}
      {q.isError && <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} />}
      {d && esAdmin && (
        <section aria-label="Resumen de cuentas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Kpi etiqueta="Usuarios activos" valor={d.usuarios_activos ?? 0} a="/panel/usuarios?pestana=usuarios" />
          <Kpi etiqueta="Usuarios inactivos" valor={d.usuarios_inactivos ?? 0} a="/panel/usuarios?pestana=usuarios" />
          <Kpi etiqueta="Solicitudes pendientes" valor={d.solicitudes_pendientes ?? 0} a="/panel/usuarios?pestana=solicitudes" nota="Esperan autorización del Revisor" />
          <Kpi etiqueta="Autorizadas sin ejecutar" valor={d.solicitudes_autorizadas_sin_ejecutar ?? 0} a="/panel/usuarios?pestana=solicitudes" alerta={(d.solicitudes_autorizadas_sin_ejecutar ?? 0) > 0} nota="Pendientes de ejecución por el Administrador" />
          <Kpi etiqueta="Accesos fallidos (7 días)" valor={d.accesos_fallidos_7d ?? 0} a="/panel/usuarios?pestana=bitacora" alerta={(d.accesos_fallidos_7d ?? 0) >= 10} />
        </section>
      )}
      {d && !esAdmin && d.pendientes_revision && <ResumenEditor d={d} esRevisor={rol === 'Revisor'} />}
    </>
  );
}

function ResumenEditor({ d, esRevisor }: { d: NonNullable<ReturnType<typeof useDashboard>['data']>; esRevisor: boolean }) {
  const pend = d.pendientes_revision!;
  const totalPend = Object.values(pend).reduce((a, b) => a + b, 0);
  const cons = d.consultas ?? { recibidas: 0, en_atencion: 0, vencidas: 0 };
  const porVencer = d.documentos_por_vencer_30d ?? 0;
  return (
    <div className="space-y-6">
      {(cons.vencidas > 0 || (d.mis_observados ?? 0) > 0 || porVencer > 0) && (
        <section aria-label="Atención requerida" className="rounded-lg border border-gold/50 bg-gold/10 p-4">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <AlertTriangle aria-hidden="true" className="h-5 w-5 text-gold-deep" /> Requiere su atención
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-800">
            {cons.vencidas > 0 && (
              <li>
                <Link className="font-semibold text-primary hover:underline" to="/panel/consultas?vencidas=1">{cons.vencidas} consulta(s) con plazo vencido</Link>
              </li>
            )}
            {(d.mis_observados ?? 0) > 0 && (
              <li>
                <Link className="font-semibold text-primary hover:underline" to="/panel/publicaciones?estado=borrador">{d.mis_observados} contenido(s) observado(s) por corregir</Link>
              </li>
            )}
            {porVencer > 0 && (
              <li>
                <Link className="font-semibold text-primary hover:underline" to="/panel/documentos-admision?pestana=documentos">{porVencer} documento(s) vencen en 30 días o menos</Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {esRevisor && <Kpi etiqueta="Pendientes de revisión" valor={totalPend} a="/panel/revision" alerta={totalPend > 0} />}
        <Kpi etiqueta="Consultas recibidas" valor={cons.recibidas} a="/panel/consultas" nota="Por clasificar (plazo: 2 días hábiles)" />
        <Kpi etiqueta="Consultas en atención" valor={cons.en_atencion} a="/panel/consultas" nota="Por responder (plazo: 5 días hábiles)" />
        <Kpi etiqueta="Consultas vencidas" valor={cons.vencidas} a="/panel/consultas?vencidas=1" alerta={cons.vencidas > 0} />
        <Kpi etiqueta="Visitas (7 días)" valor={(d.visitas_7d ?? 0).toLocaleString('es-PE')} a="/panel/estadisticas" />
        <Kpi etiqueta="Documentos por vencer (30 días)" valor={porVencer} a="/panel/documentos-admision?pestana=documentos" alerta={porVencer > 0} />
        <Kpi etiqueta="Mis contenidos observados" valor={d.mis_observados ?? 0} />
        <Kpi etiqueta="Plan predeterminado" valor={d.plan_predeterminado ? d.plan_predeterminado.anio : '—'} a="/panel/plan" nota={d.plan_predeterminado ? `Versión ${d.plan_predeterminado.version}` : 'Sin plan predeterminado'} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Campaña de admisión vigente">
          {d.campana_vigente ? (
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-ink">{d.campana_vigente.anio} · {d.campana_vigente.proceso}</p>
              <p className="mt-1">Cierra el {fecha(d.campana_vigente.fecha_fin)}.</p>
              <Link to="/panel/documentos-admision?pestana=admision" className="mt-3 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                Ver campañas <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No hay una campaña vigente. Los postulantes verán el aviso de admisión cerrada.</p>
          )}
        </Tarjeta>
        {esRevisor && (
          <Tarjeta titulo="Pendientes de revisión por tipo" acciones={<Link to="/panel/revision" className="text-sm font-semibold text-primary hover:underline">Abrir bandeja</Link>}>
            <ul className="divide-y divide-gray-100 text-sm">
              {(Object.keys(pend) as EntidadRevisable[]).map((e) => (
                <li key={e} className="flex items-center justify-between py-2">
                  <span>{ETIQUETA_ENTIDAD[e]}</span>
                  <span className="font-semibold tabular-nums text-ink">{pend[e]}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}
      </div>
    </div>
  );
}
