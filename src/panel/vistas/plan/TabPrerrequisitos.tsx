import { useMemo, useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { erroresDeCampos } from '../../../lib/api';
import { Boton } from '../../componentes/Boton';
import { Vacio } from '../../componentes/Estados';
import { AlertaFormulario, CampoSelect, CampoTexto, errorDe } from '../../componentes/Formulario';
import { Tarjeta } from '../../componentes/EncabezadoPagina';
import { useToast } from '../../componentes/Toast';
import { useGuardarPrerrequisitos } from '../../controladores/GestionarPlanEstudiosController';
import { cicloAlAsignar, mapaRequisitos, romano, type PlanDetalle } from '../../modelos/planes';

/**
 * Pestaña «Prerrequisitos»: por curso, multiselección de cursos del mismo plan.
 * Detecta el ciclo (DFS) en el cliente y muestra su ruta antes de llamar a la API,
 * que también valida y responde 422 `campos.prerrequisitos`.
 */
export function TabPrerrequisitos({ plan, editable }: { plan: PlanDetalle; editable: boolean }) {
  const toast = useToast();
  const guardar = useGuardarPrerrequisitos(plan.id_plan);
  const [idCurso, setIdCurso] = useState<number | ''>('');
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [filtro, setFiltro] = useState('');

  const cursos = useMemo(
    () => [...plan.cursos].sort((a, b) => a.ciclo - b.ciclo || a.codigo.localeCompare(b.codigo)),
    [plan.cursos],
  );
  const actuales = useMemo(() => mapaRequisitos(plan.prerrequisitos), [plan.prerrequisitos]);
  const curso = cursos.find((c) => c.id_curso === idCurso);

  const elegir = (id: number | '') => {
    guardar.reset();
    setIdCurso(id);
    setSeleccion(id === '' ? [] : [...(actuales.get(id) ?? [])]);
  };

  const rutaCiclo = useMemo(
    () => (curso ? cicloAlAsignar(plan.prerrequisitos, curso.id_curso, seleccion, plan.cursos) : null),
    [curso, seleccion, plan.prerrequisitos, plan.cursos],
  );
  const adelantados = curso
    ? cursos.filter((c) => seleccion.includes(c.id_curso) && c.ciclo >= curso.ciclo)
    : [];
  const original = curso ? [...(actuales.get(curso.id_curso) ?? [])].sort().join(',') : '';
  const sinCambios = curso ? original === [...seleccion].sort().join(',') : true;

  const candidatos = cursos.filter(
    (c) =>
      c.id_curso !== idCurso &&
      (!filtro.trim() || `${c.codigo} ${c.nombre}`.toLowerCase().includes(filtro.trim().toLowerCase())),
  );

  const alternar = (id: number) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const enviar = () => {
    if (!curso || rutaCiclo) return;
    guardar.mutate(
      { idCurso: curso.id_curso, requeridos: seleccion },
      { onSuccess: () => toast.exito('Prerrequisitos guardados.') },
    );
  };

  const errServidor = errorDe(erroresDeCampos(guardar.error), 'prerrequisitos');

  if (cursos.length === 0) {
    return (
      <Tarjeta>
        <Vacio titulo="Primero agregue cursos" descripcion="Los prerrequisitos se definen entre cursos del mismo plan." />
      </Tarjeta>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Tarjeta titulo="Editar prerrequisitos de un curso">
        <div className="space-y-4">
          <CampoSelect
            etiqueta="Curso"
            placeholder="Seleccione un curso…"
            value={idCurso === '' ? '' : String(idCurso)}
            onChange={(e) => elegir(e.target.value ? Number(e.target.value) : '')}
            opciones={cursos.map((c) => ({ valor: c.id_curso, etiqueta: `Ciclo ${romano(c.ciclo)} · ${c.codigo} · ${c.nombre}` }))}
          />
          {curso && (
            <>
              <CampoTexto etiqueta="Buscar entre los cursos requeribles" type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
              <fieldset disabled={!editable} className="min-w-0">
                <legend className="mb-1 text-sm font-semibold text-ink">
                  Requiere haber aprobado ({seleccion.length} seleccionados)
                </legend>
                <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
                  {candidatos.map((c) => (
                    <li key={c.id_curso}>
                      <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-gold">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 accent-primary"
                          checked={seleccion.includes(c.id_curso)}
                          onChange={() => alternar(c.id_curso)}
                        />
                        <span>
                          <span className="font-mono text-xs">{c.codigo}</span> {c.nombre}
                          <span className="ml-1 text-xs text-gray-500">(ciclo {romano(c.ciclo)})</span>
                        </span>
                      </label>
                    </li>
                  ))}
                  {candidatos.length === 0 && <li className="px-3 py-4 text-sm text-gray-600">Sin coincidencias.</li>}
                </ul>
              </fieldset>

              {rutaCiclo && (
                <div role="alert" className="flex gap-2 rounded-md border border-danger/30 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Prerrequisito circular: <strong className="font-mono">{rutaCiclo}</strong>. Quite alguno de los cursos de la ruta.
                  </span>
                </div>
              )}
              {!rutaCiclo && adelantados.length > 0 && (
                <p role="status" className="rounded-md bg-gold/10 px-3 py-2 text-sm text-yellow-950">
                  Advertencia: {adelantados.map((c) => c.codigo).join(', ')} está en un ciclo igual o posterior al de {curso.codigo}.
                </p>
              )}
              {guardar.error && !errServidor ? <AlertaFormulario error={guardar.error} /> : null}
              {errServidor && (
                <p role="alert" className="rounded-md border border-danger/30 bg-red-50 px-3 py-2.5 text-sm text-red-800">{errServidor}</p>
              )}
              {editable && (
                <div className="flex justify-end">
                  <Boton onClick={enviar} cargando={guardar.isPending} disabled={!!rutaCiclo || sinCambios} icono={<Save aria-hidden="true" className="h-4 w-4" />}>
                    Guardar prerrequisitos
                  </Boton>
                </div>
              )}
            </>
          )}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Prerrequisitos actuales">
        <div className="max-h-[32rem] overflow-y-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">Prerrequisitos registrados por curso</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="py-1.5 pr-3">Curso</th>
                <th scope="col" className="py-1.5">Requiere</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cursos.map((c) => {
                const req = actuales.get(c.id_curso) ?? [];
                return (
                  <tr key={c.id_curso}>
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                      <button type="button" className="text-left text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold" onClick={() => elegir(c.id_curso)}>
                        <span className="font-mono text-xs">{c.codigo}</span> {c.nombre}
                      </button>
                    </th>
                    <td className="py-1.5 font-mono text-xs text-gray-700">
                      {req.length ? req.map((r) => cursos.find((x) => x.id_curso === r)?.codigo ?? `#${r}`).join(', ') : <span className="font-sans text-gray-400">Sin prerrequisitos</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </div>
  );
}
