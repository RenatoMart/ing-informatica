import { useMemo, useState } from 'react';
import { Check, Pencil, Plus, UserCheck, UserMinus, UserPlus, X } from 'lucide-react';
import { erroresDeCampos } from '../../lib/api';
import {
  AccionesFormulario,
  Boton,
  CampoAreaTexto,
  CampoSelect,
  CampoTexto,
  DialogoConfirmar,
  EncabezadoPagina,
  EstadoInsignia,
  FiltroBarra,
  Formulario,
  Modal,
  PanelPestana,
  Paginacion,
  Pestanas,
  Tabla,
  usePestanaUrl,
  useToast,
  errorDe,
  type ColumnaTabla,
} from '../componentes';
import { useSesion } from '../sesion/SesionContext';
import {
  dominioDe,
  esEjecutada,
  useAccionesUsuarios,
  useBitacora,
  usePermisosUsuarios,
  useRoles,
  useSolicitudes,
  useSolicitudesEjecutables,
  useUsuarios,
  validarDatosUsuario,
  validarObservacionDenegar,
  validarSolicitud,
} from '../controladores/GestionarUsuariosController';
import {
  ACCIONES_BITACORA,
  ETIQUETA_TIPO_SOLICITUD,
  TIPOS_SOLICITUD,
  etiquetaAccion,
  type EntradaBitacora,
  type SolicitudFila,
  type TipoSolicitud,
  type UsuarioFila,
} from '../modelos/usuarios';

const PESTANAS = ['usuarios', 'solicitudes', 'bitacora'] as const;

const fechaHora = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/** `/panel/usuarios` — Usuarios | Solicitudes de acceso | Bitácora (?pestana=). */
export default function PaginaGestionarUsuarios() {
  const [activa, cambiar] = usePestanaUrl(PESTANAS, 'usuarios');
  const { puedeEjecutar } = usePermisosUsuarios();
  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion={
          puedeEjecutar
            ? 'Cuentas del panel, solicitudes de acceso y bitácora. Toda alta, cambio de rol o baja requiere una solicitud autorizada por el Revisor.'
            : 'Consulta de cuentas y bitácora; registre solicitudes de acceso y autorícelas o deniéguelas.'
        }
      />
      <Pestanas
        etiqueta="Secciones de usuarios"
        activa={activa}
        onCambiar={cambiar}
        pestanas={[
          { id: 'usuarios', etiqueta: 'Usuarios' },
          { id: 'solicitudes', etiqueta: 'Solicitudes de acceso' },
          { id: 'bitacora', etiqueta: 'Bitácora de accesos' },
        ]}
      />
      <PanelPestana id="usuarios" activa={activa}>
        <TabUsuarios />
      </PanelPestana>
      <PanelPestana id="solicitudes" activa={activa}>
        <TabSolicitudes />
      </PanelPestana>
      <PanelPestana id="bitacora" activa={activa}>
        <TabBitacora />
      </PanelPestana>
    </>
  );
}

// ── Pestaña Usuarios ────────────────────────────────────────────────────────

type AccionUsuario = { tipo: 'crear' } | { tipo: 'editar' | 'rol' | 'baja'; usuario: UsuarioFila };

function TabUsuarios() {
  const { puedeEjecutar } = usePermisosUsuarios();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [rol, setRol] = useState('');
  const [pagina, setPagina] = useState(1);
  const [accion, setAccion] = useState<AccionUsuario | null>(null);
  const roles = useRoles();
  const consulta = useUsuarios({ q, estado, rol, pagina });

  const columnas: ColumnaTabla<UsuarioFila>[] = [
    {
      clave: 'nombre',
      encabezado: 'Usuario',
      celda: (u) => (
        <div>
          <p className="font-semibold text-ink">
            {u.nombres} {u.apellidos}
          </p>
          <p className="text-xs text-gray-500">{u.correo_institucional}</p>
        </div>
      ),
    },
    { clave: 'rol', encabezado: 'Rol', celda: (u) => u.rol },
    { clave: 'cargo', encabezado: 'Cargo', className: 'hidden md:table-cell', celda: (u) => u.cargo || '—' },
    {
      clave: 'estado',
      encabezado: 'Estado',
      celda: (u) => (
        <span className="inline-flex flex-wrap gap-1">
          <EstadoInsignia estado={u.estado} />
          {u.debe_cambiar_contrasena && <span className="text-xs text-gray-500">Contraseña temporal</span>}
        </span>
      ),
    },
    { clave: 'fecha', encabezado: 'Creado', className: 'hidden lg:table-cell', celda: (u) => fechaHora(u.fecha_creacion) },
  ];
  if (puedeEjecutar) {
    columnas.push({
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      alinear: 'derecha',
      celda: (u) => (
        <span className="inline-flex flex-wrap justify-end gap-1">
          <Boton tamano="sm" variante="fantasma" icono={<Pencil className="h-4 w-4" />} onClick={() => setAccion({ tipo: 'editar', usuario: u })}>
            Editar<span className="sr-only"> a {u.nombres} {u.apellidos}</span>
          </Boton>
          {u.estado === 'activo' && (
            <>
              <Boton tamano="sm" variante="fantasma" icono={<UserCheck className="h-4 w-4" />} onClick={() => setAccion({ tipo: 'rol', usuario: u })}>
                Cambiar rol<span className="sr-only"> de {u.nombres} {u.apellidos}</span>
              </Boton>
              <Boton tamano="sm" variante="fantasma" className="text-danger hover:bg-red-50" icono={<UserMinus className="h-4 w-4" />} onClick={() => setAccion({ tipo: 'baja', usuario: u })}>
                Dar de baja<span className="sr-only"> a {u.nombres} {u.apellidos}</span>
              </Boton>
            </>
          )}
        </span>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <FiltroBarra
        busqueda={q}
        onBusqueda={(v) => {
          setQ(v);
          setPagina(1);
        }}
        placeholder="Buscar por nombre o correo"
        acciones={
          puedeEjecutar ? (
            <Boton icono={<UserPlus className="h-4 w-4" />} onClick={() => setAccion({ tipo: 'crear' })}>
              Crear desde solicitud
            </Boton>
          ) : undefined
        }
      >
        <CampoSelect
          etiqueta="Estado"
          etiquetaOculta
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPagina(1);
          }}
          placeholder="Todos los estados"
          opciones={[
            { valor: 'activo', etiqueta: 'Activos' },
            { valor: 'inactivo', etiqueta: 'Inactivos' },
          ]}
        />
        <CampoSelect
          etiqueta="Rol"
          etiquetaOculta
          value={rol}
          onChange={(e) => {
            setRol(e.target.value);
            setPagina(1);
          }}
          placeholder="Todos los roles"
          opciones={(roles.data ?? []).map((r) => ({ valor: r.nombre, etiqueta: r.nombre }))}
        />
      </FiltroBarra>
      <Tabla
        titulo="Usuarios del panel"
        columnas={columnas}
        filas={consulta.data?.data}
        claveFila={(u) => u.id_usuario}
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
      <Paginacion meta={consulta.data?.meta} onCambiar={setPagina} />
      <p className="text-xs text-gray-500">
        Las cuentas no se eliminan: la baja desactiva el acceso y conserva la bitácora.
      </p>

      {accion?.tipo === 'crear' && <DialogoCrearUsuario onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'editar' && <DialogoEditarUsuario usuario={accion.usuario} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'rol' && <DialogoEjecutar tipo="cambio_rol" usuario={accion.usuario} onCerrar={() => setAccion(null)} />}
      {accion?.tipo === 'baja' && <DialogoEjecutar tipo="baja" usuario={accion.usuario} onCerrar={() => setAccion(null)} />}
    </div>
  );
}

function etiquetaSolicitud(s: SolicitudFila) {
  return `#${s.id_solicitud} · ${s.solicitante_nombre}${s.correo_solicitado ? ` (${s.correo_solicitado})` : ''}${s.rol_solicitado ? ` → ${s.rol_solicitado}` : ''}`;
}

function DialogoCrearUsuario({ onCerrar }: { onCerrar: () => void }) {
  const toast = useToast();
  const { crearUsuario } = useAccionesUsuarios();
  const solicitudes = useSolicitudesEjecutables('alta', true);
  const [idSolicitud, setIdSolicitud] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cargo, setCargo] = useState('');
  const [local, setLocal] = useState<Record<string, string>>({});
  const srv = erroresDeCampos(crearUsuario.error);

  const elegir = (id: string) => {
    setIdSolicitud(id);
    const s = solicitudes.data?.find((x) => String(x.id_solicitud) === id);
    if (s && !nombres && !apellidos) {
      const partes = s.solicitante_nombre.trim().split(/\s+/);
      if (partes.length >= 2) {
        setNombres(partes.slice(0, Math.ceil(partes.length / 2)).join(' '));
        setApellidos(partes.slice(Math.ceil(partes.length / 2)).join(' '));
      }
    }
  };

  const enviar = () => {
    const e = validarDatosUsuario({ nombres, apellidos, cargo });
    if (!idSolicitud) e.id_solicitud = 'Seleccione una solicitud de alta autorizada.';
    setLocal(e);
    if (Object.keys(e).length) return;
    crearUsuario
      .mutateAsync({ id_solicitud: Number(idSolicitud), nombres: nombres.trim(), apellidos: apellidos.trim(), cargo: cargo.trim() || undefined })
      .then(() => {
        toast.exito('Usuario creado. Se envió la contraseña temporal a su correo institucional.');
        onCerrar();
      })
      .catch(() => undefined);
  };

  return (
    <Modal
      abierto
      onCerrar={() => !crearUsuario.isPending && onCerrar()}
      titulo="Crear usuario desde solicitud"
      descripcion="El correo y el rol se toman de la solicitud autorizada."
    >
      <Formulario onEnviar={enviar} error={crearUsuario.error} aria-label="Crear usuario" className="space-y-4">
        <CampoSelect
          etiqueta="Solicitud de alta autorizada"
          requerido
          value={idSolicitud}
          onChange={(e) => elegir(e.target.value)}
          placeholder={solicitudes.isLoading ? 'Cargando…' : 'Seleccione una solicitud'}
          opciones={(solicitudes.data ?? []).map((s) => ({ valor: s.id_solicitud, etiqueta: etiquetaSolicitud(s) }))}
          error={local.id_solicitud ?? errorDe(srv, 'id_solicitud')}
          ayuda={solicitudes.data?.length === 0 ? 'No hay solicitudes de alta autorizadas pendientes de ejecutar.' : undefined}
        />
        <CampoTexto etiqueta="Nombres" requerido value={nombres} onChange={(e) => setNombres(e.target.value)} maxLength={100} error={local.nombres ?? errorDe(srv, 'nombres')} />
        <CampoTexto etiqueta="Apellidos" requerido value={apellidos} onChange={(e) => setApellidos(e.target.value)} maxLength={100} error={local.apellidos ?? errorDe(srv, 'apellidos')} />
        <CampoTexto etiqueta="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} maxLength={100} error={local.cargo ?? errorDe(srv, 'cargo')} />
        <AccionesFormulario>
          <Boton variante="secundario" onClick={onCerrar} disabled={crearUsuario.isPending}>Cancelar</Boton>
          <Boton type="submit" cargando={crearUsuario.isPending}>Crear usuario</Boton>
        </AccionesFormulario>
      </Formulario>
    </Modal>
  );
}

function DialogoEditarUsuario({ usuario, onCerrar }: { usuario: UsuarioFila; onCerrar: () => void }) {
  const toast = useToast();
  const { editarUsuario } = useAccionesUsuarios();
  const [nombres, setNombres] = useState(usuario.nombres);
  const [apellidos, setApellidos] = useState(usuario.apellidos);
  const [cargo, setCargo] = useState(usuario.cargo ?? '');
  const [local, setLocal] = useState<Record<string, string>>({});
  const srv = erroresDeCampos(editarUsuario.error);

  const enviar = () => {
    const e = validarDatosUsuario({ nombres, apellidos, cargo });
    setLocal(e);
    if (Object.keys(e).length) return;
    editarUsuario
      .mutateAsync({ id: usuario.id_usuario, datos: { nombres: nombres.trim(), apellidos: apellidos.trim(), cargo: cargo.trim() } })
      .then(() => {
        toast.exito('Datos del usuario actualizados.');
        onCerrar();
      })
      .catch(() => undefined);
  };

  return (
    <Modal abierto onCerrar={() => !editarUsuario.isPending && onCerrar()} titulo="Editar datos del usuario" descripcion={usuario.correo_institucional}>
      <Formulario onEnviar={enviar} error={editarUsuario.error} aria-label="Editar usuario" className="space-y-4">
        <CampoTexto etiqueta="Nombres" requerido value={nombres} onChange={(e) => setNombres(e.target.value)} maxLength={100} error={local.nombres ?? errorDe(srv, 'nombres')} />
        <CampoTexto etiqueta="Apellidos" requerido value={apellidos} onChange={(e) => setApellidos(e.target.value)} maxLength={100} error={local.apellidos ?? errorDe(srv, 'apellidos')} />
        <CampoTexto etiqueta="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} maxLength={100} error={local.cargo ?? errorDe(srv, 'cargo')} />
        <AccionesFormulario>
          <Boton variante="secundario" onClick={onCerrar} disabled={editarUsuario.isPending}>Cancelar</Boton>
          <Boton type="submit" cargando={editarUsuario.isPending}>Guardar cambios</Boton>
        </AccionesFormulario>
      </Formulario>
    </Modal>
  );
}

/** Cambio de rol o baja: pide elegir la solicitud autorizada y confirma. */
function DialogoEjecutar({ tipo, usuario, onCerrar }: { tipo: 'cambio_rol' | 'baja'; usuario: UsuarioFila; onCerrar: () => void }) {
  const toast = useToast();
  const { cambiarRol, desactivar } = useAccionesUsuarios();
  const mut = tipo === 'baja' ? desactivar : cambiarRol;
  const solicitudes = useSolicitudesEjecutables(tipo, true, usuario.id_usuario);
  const [idSolicitud, setIdSolicitud] = useState('');
  const [local, setLocal] = useState('');
  const nombre = `${usuario.nombres} ${usuario.apellidos}`;
  const esBaja = tipo === 'baja';

  const enviar = () => {
    if (!idSolicitud) {
      setLocal(`Seleccione una solicitud de ${esBaja ? 'baja' : 'cambio de rol'} autorizada.`);
      return;
    }
    setLocal('');
    mut
      .mutateAsync({ id: usuario.id_usuario, id_solicitud: Number(idSolicitud) })
      .then(() => {
        toast.exito(esBaja ? `Se desactivó la cuenta de ${nombre}.` : `Se cambió el rol de ${nombre}.`);
        onCerrar();
      })
      .catch(() => undefined);
  };

  return (
    <Modal
      abierto
      onCerrar={() => !mut.isPending && onCerrar()}
      titulo={esBaja ? 'Dar de baja al usuario' : 'Cambiar rol del usuario'}
      descripcion={`${nombre} · ${usuario.rol}`}
    >
      <Formulario onEnviar={enviar} error={mut.error} aria-label={esBaja ? 'Dar de baja' : 'Cambiar rol'} className="space-y-4">
        {esBaja && (
          <p className="text-sm text-gray-700">
            La cuenta quedará inactiva, se cerrarán sus sesiones y no podrá ingresar. El historial se conserva.
          </p>
        )}
        <CampoSelect
          etiqueta="Solicitud autorizada"
          requerido
          value={idSolicitud}
          onChange={(e) => setIdSolicitud(e.target.value)}
          placeholder={solicitudes.isLoading ? 'Cargando…' : 'Seleccione una solicitud'}
          opciones={(solicitudes.data ?? []).map((s) => ({ valor: s.id_solicitud, etiqueta: etiquetaSolicitud(s) }))}
          error={local || undefined}
          ayuda={solicitudes.data?.length === 0 ? 'No hay una solicitud autorizada para este usuario. Regístrela en la pestaña Solicitudes y espere la autorización del Revisor.' : undefined}
        />
        <AccionesFormulario>
          <Boton variante="secundario" onClick={onCerrar} disabled={mut.isPending}>Cancelar</Boton>
          <Boton type="submit" variante={esBaja ? 'peligro' : 'primario'} cargando={mut.isPending}>
            {esBaja ? 'Confirmar baja' : 'Cambiar rol'}
          </Boton>
        </AccionesFormulario>
      </Formulario>
    </Modal>
  );
}

// ── Pestaña Solicitudes ─────────────────────────────────────────────────────

function TabSolicitudes() {
  const { puedeAutorizar, puedeRegistrar } = usePermisosUsuarios();
  const toast = useToast();
  const { autorizar } = useAccionesUsuarios();
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [nueva, setNueva] = useState(false);
  const [aAutorizar, setAAutorizar] = useState<SolicitudFila | null>(null);
  const [aDenegar, setADenegar] = useState<SolicitudFila | null>(null);
  const consulta = useSolicitudes({ estado, tipo, pagina });

  const columnas: ColumnaTabla<SolicitudFila>[] = [
    { clave: 'id', encabezado: 'N.º', celda: (s) => `#${s.id_solicitud}` },
    {
      clave: 'solicitante',
      encabezado: 'Solicitante',
      celda: (s) => (
        <div>
          <p className="font-semibold text-ink">{s.solicitante_nombre}</p>
          <p className="text-xs text-gray-500">{s.correo_solicitado ?? s.usuario_objetivo ?? ''}</p>
        </div>
      ),
    },
    { clave: 'tipo', encabezado: 'Tipo', celda: (s) => ETIQUETA_TIPO_SOLICITUD[s.tipo_solicitud] ?? s.tipo_solicitud },
    { clave: 'rol', encabezado: 'Rol solicitado', className: 'hidden md:table-cell', celda: (s) => s.rol_solicitado ?? '—' },
    { clave: 'motivo', encabezado: 'Motivo', className: 'hidden lg:table-cell max-w-xs', celda: (s) => <span className="line-clamp-2">{s.motivo}</span> },
    {
      clave: 'estado',
      encabezado: 'Estado',
      celda: (s) => (
        <span className="inline-flex flex-col gap-1">
          <EstadoInsignia estado={esEjecutada(s) ? 'ejecutada' : s.estado} />
          {s.observacion && <span className="max-w-[16rem] text-xs text-gray-500">{s.observacion}</span>}
        </span>
      ),
    },
    { clave: 'fecha', encabezado: 'Registrada', className: 'hidden lg:table-cell', celda: (s) => fechaHora(s.fecha_solicitud) },
  ];
  if (puedeAutorizar) {
    columnas.push({
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      alinear: 'derecha',
      celda: (s) =>
        s.estado === 'pendiente' ? (
          <span className="inline-flex flex-wrap justify-end gap-1">
            <Boton tamano="sm" variante="secundario" icono={<Check className="h-4 w-4" />} onClick={() => setAAutorizar(s)}>
              Autorizar<span className="sr-only"> solicitud #{s.id_solicitud}</span>
            </Boton>
            <Boton tamano="sm" variante="fantasma" className="text-danger hover:bg-red-50" icono={<X className="h-4 w-4" />} onClick={() => setADenegar(s)}>
              Denegar<span className="sr-only"> solicitud #{s.id_solicitud}</span>
            </Boton>
          </span>
        ) : null,
    });
  }

  return (
    <div className="space-y-4">
      <FiltroBarra
        acciones={
          puedeRegistrar ? (
            <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setNueva(true)}>
              Registrar solicitud
            </Boton>
          ) : undefined
        }
      >
        <CampoSelect
          etiqueta="Estado"
          etiquetaOculta
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPagina(1);
          }}
          placeholder="Todos los estados"
          opciones={[
            { valor: 'pendiente', etiqueta: 'Pendientes' },
            { valor: 'autorizada', etiqueta: 'Autorizadas' },
            { valor: 'denegada', etiqueta: 'Denegadas' },
          ]}
        />
        <CampoSelect
          etiqueta="Tipo"
          etiquetaOculta
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setPagina(1);
          }}
          placeholder="Todos los tipos"
          opciones={TIPOS_SOLICITUD.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))}
        />
      </FiltroBarra>
      <Tabla
        titulo="Solicitudes de acceso"
        columnas={columnas}
        filas={consulta.data?.data}
        claveFila={(s) => s.id_solicitud}
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
      <Paginacion meta={consulta.data?.meta} onCambiar={setPagina} />

      {nueva && <DialogoNuevaSolicitud onCerrar={() => setNueva(false)} />}
      <DialogoConfirmar
        abierto={!!aAutorizar}
        titulo="Autorizar solicitud"
        mensaje={aAutorizar && <>Se autorizará la solicitud #{aAutorizar.id_solicitud} de {aAutorizar.solicitante_nombre} ({ETIQUETA_TIPO_SOLICITUD[aAutorizar.tipo_solicitud] ?? aAutorizar.tipo_solicitud}). El Administrador podrá ejecutarla.</>}
        textoConfirmar="Autorizar"
        cargando={autorizar.isPending}
        error={autorizar.error}
        onCancelar={() => {
          setAAutorizar(null);
          autorizar.reset();
        }}
        onConfirmar={() =>
          aAutorizar &&
          autorizar
            .mutateAsync({ id: aAutorizar.id_solicitud })
            .then(() => {
              toast.exito('Solicitud autorizada.');
              setAAutorizar(null);
            })
            .catch(() => undefined)
        }
      />
      {aDenegar && <DialogoDenegar solicitud={aDenegar} onCerrar={() => setADenegar(null)} />}
    </div>
  );
}

function DialogoDenegar({ solicitud, onCerrar }: { solicitud: SolicitudFila; onCerrar: () => void }) {
  const toast = useToast();
  const { denegar } = useAccionesUsuarios();
  const [obs, setObs] = useState('');
  const [local, setLocal] = useState<string | null>(null);
  const srv = erroresDeCampos(denegar.error);
  const enviar = () => {
    const e = validarObservacionDenegar(obs);
    setLocal(e);
    if (e) return;
    denegar
      .mutateAsync({ id: solicitud.id_solicitud, observacion: obs.trim() })
      .then(() => {
        toast.exito('Solicitud denegada.');
        onCerrar();
      })
      .catch(() => undefined);
  };
  return (
    <Modal abierto onCerrar={() => !denegar.isPending && onCerrar()} titulo="Denegar solicitud" descripcion={`#${solicitud.id_solicitud} · ${solicitud.solicitante_nombre}`}>
      <Formulario onEnviar={enviar} error={denegar.error} aria-label="Denegar solicitud" className="space-y-4">
        <CampoAreaTexto etiqueta="Observación" requerido contador maxLength={500} value={obs} onChange={(e) => setObs(e.target.value)} error={local ?? errorDe(srv, 'observacion')} ayuda="Explique el motivo de la denegación." />
        <AccionesFormulario>
          <Boton variante="secundario" onClick={onCerrar} disabled={denegar.isPending}>Cancelar</Boton>
          <Boton type="submit" variante="peligro" cargando={denegar.isPending}>Denegar solicitud</Boton>
        </AccionesFormulario>
      </Formulario>
    </Modal>
  );
}

function DialogoNuevaSolicitud({ onCerrar }: { onCerrar: () => void }) {
  const toast = useToast();
  const { usuario } = useSesion();
  const dominio = dominioDe(usuario?.correo_institucional);
  const { registrarSolicitud } = useAccionesUsuarios();
  const roles = useRoles();
  const activos = useUsuarios({ estado: 'activo', pagina: 1, por_pagina: 100 });
  const [f, setF] = useState({
    solicitante_nombre: '',
    tipo_solicitud: '' as TipoSolicitud | '',
    id_rol_solicitado: '',
    motivo: '',
    correo_solicitado: '',
    id_usuario_objetivo: '',
  });
  const [local, setLocal] = useState<Record<string, string>>({});
  const srv = erroresDeCampos(registrarSolicitud.error);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const objetivo = useMemo(
    () => activos.data?.data.find((u) => String(u.id_usuario) === f.id_usuario_objetivo),
    [activos.data, f.id_usuario_objetivo],
  );

  const enviar = () => {
    const e = validarSolicitud(f, dominio);
    setLocal(e);
    if (Object.keys(e).length) return;
    // La baja usa el rol actual del objetivo (sp_solicitud_registrar).
    const idRol =
      f.tipo_solicitud === 'baja'
        ? roles.data?.find((r) => r.nombre.toLowerCase() === objetivo?.rol.toLowerCase())?.id_rol
        : Number(f.id_rol_solicitado);
    if (!idRol) {
      setLocal({ id_usuario_objetivo: 'No se pudo determinar el rol actual del usuario. Intente de nuevo.' });
      return;
    }
    registrarSolicitud
      .mutateAsync({
        solicitante_nombre: f.solicitante_nombre.trim(),
        tipo_solicitud: f.tipo_solicitud as TipoSolicitud,
        id_rol_solicitado: idRol,
        motivo: f.motivo.trim(),
        correo_solicitado: f.tipo_solicitud === 'alta' ? f.correo_solicitado.trim().toLowerCase() : undefined,
        id_usuario_objetivo: f.tipo_solicitud !== 'alta' ? Number(f.id_usuario_objetivo) : undefined,
      })
      .then(() => {
        toast.exito('Solicitud registrada. Queda pendiente de autorización del Revisor.');
        onCerrar();
      })
      .catch(() => undefined);
  };

  const opcionesRol = (roles.data ?? []).map((r) => ({ valor: r.id_rol, etiqueta: r.nombre }));

  return (
    <Modal abierto onCerrar={() => !registrarSolicitud.isPending && onCerrar()} titulo="Registrar solicitud de acceso" tamano="lg">
      <Formulario onEnviar={enviar} error={registrarSolicitud.error} aria-label="Registrar solicitud" className="space-y-4">
        <CampoSelect
          etiqueta="Tipo de solicitud"
          requerido
          value={f.tipo_solicitud}
          onChange={(e) => set('tipo_solicitud', e.target.value)}
          placeholder="Seleccione el tipo"
          opciones={TIPOS_SOLICITUD.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))}
          error={local.tipo_solicitud ?? errorDe(srv, 'tipo_solicitud')}
        />
        <CampoTexto etiqueta="Nombre del solicitante" requerido value={f.solicitante_nombre} onChange={(e) => set('solicitante_nombre', e.target.value)} maxLength={150} error={local.solicitante_nombre ?? errorDe(srv, 'solicitante_nombre')} />
        {f.tipo_solicitud === 'alta' && (
          <CampoTexto
            etiqueta="Correo institucional"
            type="email"
            requerido
            value={f.correo_solicitado}
            onChange={(e) => set('correo_solicitado', e.target.value)}
            maxLength={150}
            ayuda={dominio ? `Debe terminar en @${dominio}` : undefined}
            error={local.correo_solicitado ?? errorDe(srv, 'correo_solicitado')}
          />
        )}
        {(f.tipo_solicitud === 'cambio_rol' || f.tipo_solicitud === 'baja') && (
          <CampoSelect
            etiqueta="Usuario afectado"
            requerido
            value={f.id_usuario_objetivo}
            onChange={(e) => set('id_usuario_objetivo', e.target.value)}
            placeholder={activos.isLoading ? 'Cargando…' : 'Seleccione un usuario'}
            opciones={(activos.data?.data ?? []).map((u) => ({ valor: u.id_usuario, etiqueta: `${u.nombres} ${u.apellidos} · ${u.rol}` }))}
            error={local.id_usuario_objetivo ?? errorDe(srv, 'id_usuario_objetivo')}
          />
        )}
        {f.tipo_solicitud !== 'baja' && (
          <CampoSelect
            etiqueta="Rol solicitado"
            requerido
            value={f.id_rol_solicitado}
            onChange={(e) => set('id_rol_solicitado', e.target.value)}
            placeholder="Seleccione el rol"
            opciones={opcionesRol}
            error={local.id_rol_solicitado ?? errorDe(srv, 'id_rol_solicitado')}
          />
        )}
        <CampoAreaTexto etiqueta="Motivo" requerido contador maxLength={500} value={f.motivo} onChange={(e) => set('motivo', e.target.value)} error={local.motivo ?? errorDe(srv, 'motivo')} />
        <AccionesFormulario>
          <Boton variante="secundario" onClick={onCerrar} disabled={registrarSolicitud.isPending}>Cancelar</Boton>
          <Boton type="submit" cargando={registrarSolicitud.isPending}>Registrar solicitud</Boton>
        </AccionesFormulario>
      </Formulario>
    </Modal>
  );
}

// ── Pestaña Bitácora ────────────────────────────────────────────────────────

function TabBitacora() {
  const [accion, setAccion] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);
  const rangoInvalido = !!desde && !!hasta && desde > hasta;
  const consulta = useBitacora({ accion, desde, hasta: rangoInvalido ? '' : hasta, pagina });

  const columnas: ColumnaTabla<EntradaBitacora>[] = [
    { clave: 'fecha', encabezado: 'Fecha', celda: (b) => fechaHora(b.fecha) },
    { clave: 'accion', encabezado: 'Acción', celda: (b) => <span className={b.accion === 'acceso_fallido' ? 'font-semibold text-danger' : ''}>{etiquetaAccion(b.accion)}</span> },
    { clave: 'usuario', encabezado: 'Usuario afectado', celda: (b) => b.usuario ?? '—' },
    { clave: 'actor', encabezado: 'Realizada por', className: 'hidden md:table-cell', celda: (b) => b.actor ?? 'Sistema' },
    { clave: 'detalle', encabezado: 'Detalle', className: 'hidden lg:table-cell', celda: (b) => b.detalle ?? '—' },
    { clave: 'ip', encabezado: 'IP', className: 'hidden lg:table-cell', celda: (b) => b.ip ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <FiltroBarra>
        <CampoSelect
          etiqueta="Acción"
          etiquetaOculta
          value={accion}
          onChange={(e) => {
            setAccion(e.target.value);
            setPagina(1);
          }}
          placeholder="Todas las acciones"
          opciones={ACCIONES_BITACORA.map((a) => ({ valor: a.valor, etiqueta: a.etiqueta }))}
        />
        <CampoTexto etiqueta="Desde" type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPagina(1); }} />
        <CampoTexto etiqueta="Hasta" type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPagina(1); }} error={rangoInvalido ? 'La fecha final debe ser igual o posterior a la inicial.' : undefined} />
      </FiltroBarra>
      <Tabla
        titulo="Bitácora de accesos"
        columnas={columnas}
        filas={consulta.data?.data}
        claveFila={(b) => b.id_bitacora}
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
      <Paginacion meta={consulta.data?.meta} onCambiar={setPagina} />
    </div>
  );
}
