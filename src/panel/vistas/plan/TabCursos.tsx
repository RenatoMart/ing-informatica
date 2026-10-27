import { useRef, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { erroresDeCampos } from '../../../lib/api';
import { Boton } from '../../componentes/Boton';
import { DialogoConfirmar } from '../../componentes/DialogoConfirmar';
import { Vacio } from '../../componentes/Estados';
import {
  AccionesFormulario,
  AlertaFormulario,
  CampoAreaTexto,
  CampoSelect,
  CampoTexto,
  Formulario,
  combinarErrores,
  errorDe,
} from '../../componentes/Formulario';
import { Insignia } from '../../componentes/Insignia';
import { Modal } from '../../componentes/Modal';
import { useToast } from '../../componentes/Toast';
import { Tarjeta } from '../../componentes/EncabezadoPagina';
import {
  useEliminarCurso,
  useGuardarCurso,
  useImportarCursos,
} from '../../controladores/GestionarPlanEstudiosController';
import {
  AREAS_FORMACION,
  CURSO_VACIO,
  ETIQUETA_AREA,
  MAX_IMPORTAR,
  TIPOS_CURSO,
  datosDeForm,
  formDeCurso,
  interpretarImportacion,
  resumenPorCiclo,
  romano,
  validarCurso,
  type Curso,
  type FormCurso,
  type PlanDetalle,
  type ResultadoImportacion,
} from '../../modelos/planes';

/** Pestaña «Cursos»: tabla por ciclo con alta/edición en modal e importación JSON/CSV. */
export function TabCursos({ plan, editable }: { plan: PlanDetalle; editable: boolean }) {
  const toast = useToast();
  const guardar = useGuardarCurso(plan.id_plan);
  const eliminar = useEliminarCurso(plan.id_plan);
  const importar = useImportarCursos(plan.id_plan);

  const [edicion, setEdicion] = useState<{ id?: number; form: FormCurso } | null>(null);
  const [errLocal, setErrLocal] = useState<Record<string, string>>({});
  const [aEliminar, setAEliminar] = useState<Curso | null>(null);
  const [verImportar, setVerImportar] = useState(false);
  const [textoImp, setTextoImp] = useState('');
  const [previa, setPrevia] = useState<ResultadoImportacion | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const grupos = resumenPorCiclo(plan.cursos);

  const abrir = (c?: Curso) => {
    guardar.reset();
    setErrLocal({});
    setEdicion(c ? { id: c.id_curso, form: formDeCurso(c) } : { form: { ...CURSO_VACIO } });
  };

  const enviar = () => {
    if (!edicion) return;
    const otros = plan.cursos.filter((c) => c.id_curso !== edicion.id);
    const e = validarCurso(edicion.form, otros);
    setErrLocal(e);
    if (Object.keys(e).length) return;
    guardar.mutate(
      { idCurso: edicion.id, datos: datosDeForm(edicion.form) },
      {
        onSuccess: () => {
          toast.exito(edicion.id ? 'Curso actualizado.' : 'Curso agregado.');
          setEdicion(null);
        },
      },
    );
  };

  const leerArchivo = async (f: File | undefined) => {
    if (!f) return;
    const t = await f.text();
    setTextoImp(t);
    setPrevia(interpretarImportacion(t));
  };

  const confirmarImportacion = () => {
    if (!previa || previa.errores.length || !previa.cursos.length) return;
    importar.mutate(previa.cursos, {
      onSuccess: (r) => {
        toast.exito(`Se importaron ${r?.importados ?? previa.cursos.length} cursos.`);
        setVerImportar(false);
        setTextoImp('');
        setPrevia(null);
      },
    });
  };

  const f = edicion?.form;
  const set = <K extends keyof FormCurso>(k: K, v: FormCurso[K]) => edicion && setEdicion({ ...edicion, form: { ...edicion.form, [k]: v } });
  const err = combinarErrores(errLocal, erroresDeCampos(guardar.error));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {plan.cursos.length} cursos · {plan.cursos.reduce((s, c) => s + c.creditos, 0)} créditos en {grupos.length} ciclos.
        </p>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Boton
              variante="secundario"
              icono={<Upload aria-hidden="true" className="h-4 w-4" />}
              onClick={() => {
                importar.reset();
                setPrevia(null);
                setTextoImp('');
                setVerImportar(true);
              }}
            >
              Importar JSON/CSV
            </Boton>
            <Boton icono={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={() => abrir()}>
              Agregar curso
            </Boton>
          </div>
        )}
      </div>

      {!editable && (
        <p role="note" className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
          Esta versión no está en borrador, por lo que sus cursos no se pueden modificar. Duplíquela para hacer cambios.
        </p>
      )}

      {grupos.length === 0 ? (
        <Tarjeta>
          <Vacio titulo="Aún no hay cursos" descripcion={editable ? 'Agregue cursos uno a uno o impórtelos desde un archivo JSON/CSV.' : undefined} />
        </Tarjeta>
      ) : (
        grupos.map((g) => (
          <section key={g.ciclo} aria-labelledby={`ciclo-${g.ciclo}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <h3 id={`ciclo-${g.ciclo}`} className="flex items-center justify-between bg-gray-50 px-4 py-2.5 text-sm font-bold text-ink">
              <span>Ciclo {romano(g.ciclo)}</span>
              <span className={`text-xs font-semibold tabular-nums ${g.creditos < 18 || g.creditos > 26 ? 'text-yellow-800' : 'text-gray-600'}`}>
                {g.creditos} créditos{g.creditos < 18 || g.creditos > 26 ? ' · fuera de 18–26' : ''}
              </span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <caption className="sr-only">Cursos del ciclo {romano(g.ciclo)}</caption>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th scope="col" className="px-4 py-2">Código</th>
                    <th scope="col" className="px-4 py-2">Nombre</th>
                    <th scope="col" className="px-4 py-2 text-right">Cr.</th>
                    <th scope="col" className="px-4 py-2 text-right">HT/HP</th>
                    <th scope="col" className="px-4 py-2">Tipo</th>
                    <th scope="col" className="px-4 py-2">Área</th>
                    {editable && <th scope="col" className="px-4 py-2"><span className="sr-only">Acciones</span></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {g.cursos.map((c) => (
                    <tr key={c.id_curso}>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{c.codigo}</td>
                      <td className="px-4 py-2">{c.nombre}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{c.creditos}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{c.horas_teoria}/{c.horas_practica}</td>
                      <td className="px-4 py-2">
                        <Insignia tono={c.tipo === 'electivo' ? 'info' : 'neutro'} punto={false}>{c.tipo === 'electivo' ? 'Electivo' : 'Obligatorio'}</Insignia>
                      </td>
                      <td className="px-4 py-2">{ETIQUETA_AREA[String(c.area_formacion)] ?? c.area_formacion ?? '—'}</td>
                      {editable && (
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          <Boton tamano="sm" variante="fantasma" onClick={() => abrir(c)} icono={<Pencil aria-hidden="true" className="h-4 w-4" />}>
                            <span className="sr-only">Editar {c.codigo}</span>
                          </Boton>
                          <Boton
                            tamano="sm"
                            variante="fantasma"
                            className="text-danger hover:bg-red-50"
                            onClick={() => {
                              eliminar.reset();
                              setAEliminar(c);
                            }}
                            icono={<Trash2 aria-hidden="true" className="h-4 w-4" />}
                          >
                            <span className="sr-only">Eliminar {c.codigo}</span>
                          </Boton>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      <Modal abierto={!!edicion} onCerrar={() => !guardar.isPending && setEdicion(null)} titulo={edicion?.id ? 'Editar curso' : 'Agregar curso'} tamano="lg">
        {edicion && f && (
          <Formulario onEnviar={enviar} error={guardar.error}>
            <div className="grid gap-4 sm:grid-cols-3">
              <CampoTexto etiqueta="Código" requerido maxLength={20} value={f.codigo} onChange={(e) => set('codigo', e.target.value)} error={errorDe(err, 'codigo')} />
              <CampoTexto className="sm:col-span-2" etiqueta="Nombre" requerido maxLength={150} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} error={errorDe(err, 'nombre')} />
              <CampoTexto etiqueta="Créditos (1–10)" type="number" inputMode="numeric" min={1} max={10} requerido value={f.creditos} onChange={(e) => set('creditos', e.target.value)} error={errorDe(err, 'creditos')} />
              <CampoTexto etiqueta="Ciclo (1–10)" type="number" inputMode="numeric" min={1} max={10} requerido value={f.ciclo} onChange={(e) => set('ciclo', e.target.value)} error={errorDe(err, 'ciclo')} />
              <CampoSelect etiqueta="Tipo" opciones={TIPOS_CURSO.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))} value={f.tipo} onChange={(e) => set('tipo', e.target.value as FormCurso['tipo'])} error={errorDe(err, 'tipo')} />
              <CampoSelect className="sm:col-span-3" etiqueta="Área de formación" requerido placeholder="Seleccione…" opciones={AREAS_FORMACION.map((a) => ({ valor: a.valor, etiqueta: a.etiqueta }))} value={f.area_formacion} onChange={(e) => set('area_formacion', e.target.value)} error={errorDe(err, 'area_formacion')} />
              <CampoTexto etiqueta="Horas de teoría (0–10)" type="number" inputMode="numeric" min={0} max={10} value={f.horas_teoria} onChange={(e) => set('horas_teoria', e.target.value)} error={errorDe(err, 'horas_teoria')} />
              <CampoTexto etiqueta="Horas de práctica (0–10)" type="number" inputMode="numeric" min={0} max={10} value={f.horas_practica} onChange={(e) => set('horas_practica', e.target.value)} error={errorDe(err, 'horas_practica')} />
            </div>
            <CampoAreaTexto etiqueta="Descripción (opcional)" rows={3} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} error={errorDe(err, 'descripcion')} />
            <AccionesFormulario>
              <Boton variante="secundario" onClick={() => setEdicion(null)} disabled={guardar.isPending}>Cancelar</Boton>
              <Boton type="submit" cargando={guardar.isPending}>Guardar curso</Boton>
            </AccionesFormulario>
          </Formulario>
        )}
      </Modal>

      <DialogoConfirmar
        abierto={!!aEliminar}
        peligro
        titulo="Eliminar curso"
        mensaje={aEliminar && `Se eliminará ${aEliminar.codigo} · ${aEliminar.nombre} y los prerrequisitos donde aparece.`}
        textoConfirmar="Eliminar"
        cargando={eliminar.isPending}
        error={eliminar.error}
        onCancelar={() => setAEliminar(null)}
        onConfirmar={() =>
          aEliminar &&
          eliminar.mutate(aEliminar.id_curso, {
            onSuccess: () => {
              toast.exito('Curso eliminado.');
              setAEliminar(null);
            },
          })
        }
      />

      <Modal abierto={verImportar} onCerrar={() => !importar.isPending && setVerImportar(false)} titulo="Importar cursos" descripcion={`JSON (arreglo de cursos) o CSV con cabecera: codigo, nombre, creditos, tipo, ciclo, area_formacion, horas_teoria, horas_practica, descripcion. Máximo ${MAX_IMPORTAR}. Los códigos existentes se actualizan.`} tamano="xl">
        <div className="space-y-4">
          {importar.error ? <AlertaFormulario error={importar.error} /> : null}
          <div>
            <input ref={inputArchivo} type="file" accept=".json,.csv,.txt,application/json,text/csv" className="sr-only" id="imp-archivo" onChange={(e) => void leerArchivo(e.target.files?.[0])} />
            <label htmlFor="imp-archivo" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-ink hover:bg-gray-50 focus-within:ring-2 focus-within:ring-gold">
              <Upload aria-hidden="true" className="h-4 w-4" /> Elegir archivo…
            </label>
          </div>
          <CampoAreaTexto etiqueta="O pegue el contenido" rows={8} className="font-mono" value={textoImp} onChange={(e) => { setTextoImp(e.target.value); setPrevia(null); }} />
          {previa && (
            <div role="status" className="text-sm">
              {previa.errores.length ? (
                <ul className="max-h-40 list-disc space-y-1 overflow-y-auto rounded-md bg-red-50 py-2 pl-7 pr-3 text-red-800">
                  {previa.errores.map((m) => <li key={m}>{m}</li>)}
                </ul>
              ) : (
                <p className="rounded-md bg-green-50 px-3 py-2 text-green-800">{previa.cursos.length} cursos válidos listos para importar.</p>
              )}
            </div>
          )}
          <AccionesFormulario>
            <Boton variante="secundario" onClick={() => setVerImportar(false)} disabled={importar.isPending}>Cancelar</Boton>
            {!previa || previa.errores.length ? (
              <Boton onClick={() => setPrevia(interpretarImportacion(textoImp))} disabled={!textoImp.trim()}>Revisar contenido</Boton>
            ) : (
              <Boton onClick={confirmarImportacion} cargando={importar.isPending}>Importar {previa.cursos.length} cursos</Boton>
            )}
          </AccionesFormulario>
        </div>
      </Modal>
    </div>
  );
}
