import React, { useEffect } from 'react';
import clsx from 'clsx';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHero from '../../components/layout/PageHero';
import { siteName } from '@/profile';
import { ClipboardList } from 'lucide-react';

// Nivel 3 opcional: algunas filas de Nivel 2 (p.ej. Gestión Curricular) no se subdividen más.
interface Fila {
  nivel3?: string;
}

interface GrupoNivel2 {
  nivel2: string;
  filas: Fila[];
}

const NIVEL1 = 'M01.01 Gestión de la Formación en pregrado';

const GRUPOS: GrupoNivel2[] = [
  {
    nivel2: 'M01.01.01 Gestión Curricular',
    filas: [{}],
  },
  {
    nivel2: 'M01.01.02 Gestión del Ingreso',
    filas: [
      { nivel3: 'M01.01.02.01 Admisión' },
      { nivel3: 'M01.01.02.02 Matrícula' },
    ],
  },
  {
    nivel2: 'M01.01.03 Enseñanza Aprendizaje',
    filas: [
      { nivel3: 'M01.01.03.01 Ejecución del Plan Curricular' },
      { nivel3: 'M01.01.03.02 Evaluación del Estudiante' },
      { nivel3: 'M01.01.03.03 Movilidad y Becas' },
      { nivel3: 'M01.01.03.04 Investigación Formativa' },
      { nivel3: 'M01.01.03.05 Seguimiento al Desempeño de los Estudiantes' },
    ],
  },
  {
    nivel2: 'M01.01.04 Resultados de la Formación',
    filas: [
      { nivel3: 'M01.01.04.01 Certificación' },
      { nivel3: 'M01.01.04.02 Graduación' },
      { nivel3: 'M01.01.04.03 Titulación' },
      { nivel3: 'M01.01.04.04 Seguimiento al Egresados' },
    ],
  },
];

const TOTAL_FILAS = GRUPOS.reduce((sum, g) => sum + g.filas.length, 0);
const TOTAL_SUBPROCESOS = GRUPOS.reduce((sum, g) => sum + g.filas.filter((f) => f.nivel3).length, 0);

// Separa el código de proceso ("M01.01.02") de su nombre ("Gestión del Ingreso").
function splitCodigo(texto: string): [string, string] {
  const i = texto.indexOf(' ');
  return i === -1 ? [texto, ''] : [texto.slice(0, i), texto.slice(i + 1)];
}

export default function GestionFormacionPregrado() {
  useEffect(() => {
    document.title = `Gestión de la Formación en Pregrado | Admisión | ${siteName}`;
  }, []);

  const [n1cod, n1nom] = splitCodigo(NIVEL1);

  return (
    <PageWrapper>
      <PageHero
        title="Gestión de la Formación en Pregrado"
        subtitle="M01.01 · Mapa de procesos de la Oficina de Gestión de la Calidad."
        icon={ClipboardList}
        breadcrumbs={[{ label: 'Admisión' }, { label: 'Gestión de la Formación en Pregrado' }]}
      />

      <div className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Meta derivada de los datos */}
            <p className="mb-5 text-sm text-gray-500">
              <strong className="font-semibold text-gray-700">{GRUPOS.length}</strong> procesos
              <span className="mx-1.5 text-gray-300" aria-hidden="true">·</span>
              <strong className="font-semibold text-gray-700">{TOTAL_SUBPROCESOS}</strong> subprocesos
            </p>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full border-collapse text-sm min-w-[720px]">
                <caption className="sr-only">
                  M01.01 Gestión de la Formación en Pregrado: niveles 1, 2 y 3 del proceso.
                </caption>
                <thead>
                  <tr className="bg-primary text-white">
                    <th scope="col" className="py-3.5 px-5 text-left font-display font-bold uppercase tracking-wider text-[11px] w-[24%]">Nivel 1</th>
                    <th scope="col" className="py-3.5 px-5 text-left font-display font-bold uppercase tracking-wider text-[11px] w-[28%]">Nivel 2</th>
                    <th scope="col" className="py-3.5 px-5 text-left font-display font-bold uppercase tracking-wider text-[11px]">Nivel 3</th>
                  </tr>
                </thead>
                <tbody>
                  {GRUPOS.map((grupo, gIdx) => {
                    const [n2cod, n2nom] = splitCodigo(grupo.nivel2);
                    return grupo.filas.map((fila, fIdx) => {
                      const [n3cod, n3nom] = fila.nivel3 ? splitCodigo(fila.nivel3) : ['', ''];
                      const nuevoGrupo = fIdx === 0 && gIdx > 0;
                      return (
                        <tr
                          key={`${grupo.nivel2}-${fIdx}`}
                          className={clsx(
                            'transition-colors hover:bg-gray-50',
                            nuevoGrupo && 'border-t-2 border-gray-200',
                          )}
                        >
                          {/* Nivel 1 — macroproceso (una sola celda, centrada verticalmente) */}
                          {gIdx === 0 && fIdx === 0 && (
                            <td
                              rowSpan={TOTAL_FILAS}
                              className="relative align-middle text-center bg-primary text-white p-6 overflow-hidden"
                            >
                              <div
                                className="absolute inset-0 opacity-[0.06]"
                                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                                aria-hidden="true"
                              />
                              <div className="relative flex flex-col items-center">
                                <span className="inline-block rounded-md bg-gold/20 border border-gold/30 text-gold px-2.5 py-1 text-xs font-bold">
                                  {n1cod}
                                </span>
                                <p className="mt-3 font-display font-black text-base leading-snug">{n1nom}</p>
                                <div className="mt-4 h-0.5 w-10 bg-gold/60 rounded-full" aria-hidden="true" />
                              </div>
                            </td>
                          )}

                          {/* Nivel 2 — proceso (celda que agrupa sus subprocesos) */}
                          {fIdx === 0 && (
                            <td
                              rowSpan={grupo.filas.length}
                              className="align-middle border-l border-gray-100 bg-gray-50/40 p-5"
                            >
                              <span className="block text-[11px] font-medium text-gray-500">{n2cod}</span>
                              <span className="mt-1 block font-display font-bold text-primary leading-snug">{n2nom}</span>
                            </td>
                          )}

                          {/* Nivel 3 — subproceso */}
                          <td
                            className={clsx(
                              'align-middle border-l border-gray-100 px-5 py-4',
                              fIdx > 0 && 'border-t border-gray-100',
                            )}
                          >
                            {n3nom ? (
                              <>
                                <span className="block text-[11px] font-medium text-gray-500">{n3cod}</span>
                                <span className="mt-0.5 block text-gray-800 font-medium leading-snug">{n3nom}</span>
                              </>
                            ) : (
                              <span className="text-xs italic text-gray-500">Sin subprocesos definidos</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
