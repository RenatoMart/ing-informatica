import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
} from 'reactflow';
import { Download, BookOpen, Clock, Award, X, HelpCircle } from 'lucide-react';

import 'reactflow/dist/style.css';

import {
  type AreaType,
  type CourseData,
  CURRICULUM_DATA,
  PREREQUISITES_EDGES,
  CYCLE_COLUMNS,
} from '@profile/content/malla';


// ── Nodo de curso (colores por área, definidos por el usuario) ───────────────
// El área se codifica con una franja lateral de color; el fondo es blanco en
// reposo y se tiñe con el color del área al pasar el puntero.
const AREA_STYLES: Record<AreaType, string> = {
  general: 'border-l-emerald-500 bg-white text-emerald-950 hover:bg-emerald-100/70',
  especifico: 'border-l-orange-400 bg-white text-orange-950 hover:bg-orange-100/70',
  especialidad: 'border-l-sky-400 bg-white text-sky-950 hover:bg-sky-100/70',
};

// El nodo lleva un callback `onOpen` para abrir su detalle por clic o teclado.
type CourseNodeData = CourseData & { onOpen: (course: CourseData) => void };

function CourseNode({ data }: NodeProps<CourseNodeData>) {
  const open = () => data.onOpen(data);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver detalle del curso ${data.name} (${data.cycle}, ${data.credits} créditos)`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className={`w-64 p-3 shadow-md rounded border border-slate-200 border-l-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${AREA_STYLES[data.type]}`}
    >
      <Handle type="target" position={Position.Left} className="opacity-40 !bg-slate-400" />

      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[9px] font-bold tracking-wider uppercase opacity-60">{data.cycle}</span>
        <div className="flex gap-1">
          {data.isElective && (
            <span className="bg-purple-100 text-purple-800 text-[8px] px-1 font-bold rounded">ELECTIVO</span>
          )}
          <span className="bg-white/90 border border-slate-200 text-slate-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
            {data.credits} CR
          </span>
        </div>
      </div>

      <h3 className="text-xs font-bold leading-tight line-clamp-2 select-none h-8 flex items-center">
        {data.name}
      </h3>

      <div className="mt-2 pt-1.5 border-t border-slate-200/50 text-[9px] opacity-80 flex justify-between items-center">
        <span>HT: {data.hoursT}h | HP: {data.hoursP}h</span>
        <span className="font-semibold underline">Detalles</span>
      </div>

      <Handle type="source" position={Position.Right} className="opacity-40 !bg-slate-400" />
    </div>
  );
}

const nodeTypes: NodeTypes = { courseNode: CourseNode };

const PLAN_PDF = `${import.meta.env.BASE_URL}Plan_de_Estudios_2025.pdf`;

export interface MallaFlowProps {
  /** Cursos del plan (por defecto, la malla estática del perfil). */
  cursos?: CourseData[];
  /** Aristas de prerrequisitos `{ id, source, target }` (por defecto, las estáticas). */
  aristas?: Edge[];
  /** Posición X de cada columna de ciclo ("Ciclo I" → px). Por defecto, las estáticas. */
  columnas?: Record<string, number>;
  /** URL del PDF del plan; `null` oculta los botones de descarga. */
  pdfUrl?: string | null;
}

/**
 * Malla curricular interactiva. Sin props muestra el contenido estático del
 * perfil (`@profile/content/malla`); el sitio integrado con la API (B18) y el
 * panel (vista previa de prerrequisitos) le pasan los datos por props.
 */
export default function MallaFlow({
  cursos = CURRICULUM_DATA,
  aristas = PREREQUISITES_EDGES,
  columnas = CYCLE_COLUMNS,
  pdfUrl = PLAN_PDF,
}: MallaFlowProps = {}) {
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const modalCloseRef = useRef<HTMLButtonElement>(null);

  // ≥1024px (lg): panel lateral. Por debajo: modal (no hay ancho para el panel).
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // La ayuda se autooculta a los 6s; queda el botón "?" para volver a mostrarla.
  useEffect(() => {
    const t = setTimeout(() => setShowHelp(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Resumen de la malla para el estado por defecto del panel.
  const stats = useMemo(() => ({
    cycles: new Set(cursos.map((c) => c.cycle)).size,
    courses: cursos.length,
    credits: cursos.reduce((sum, c) => sum + c.credits, 0),
  }), [cursos]);

  // Orden de ciclos por primera aparición (para la vista de texto accesible).
  const cyclesOrdered = useMemo(() => {
    const seen: string[] = [];
    cursos.forEach((c) => {
      if (!seen.includes(c.cycle)) seen.push(c.cycle);
    });
    return seen;
  }, [cursos]);

  // Cierra el modal de detalle con Escape.
  useEffect(() => {
    if (!selectedCourse) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedCourse(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedCourse]);

  // Al abrir el modal (móvil), lleva el foco a su botón de cierre (gestión de foco en diálogos).
  useEffect(() => {
    if (selectedCourse && !isDesktop) modalCloseRef.current?.focus();
  }, [selectedCourse, isDesktop]);

  // Las aristas animadas se desactivan si el sistema pide menos movimiento.
  const openCourse = useCallback((course: CourseData) => setSelectedCourse(course), []);

  const initialNodes = useMemo<Node<CourseNodeData>[]>(() => {
    return cursos.map((course) => {
      const sameCycle = cursos.filter((c) => c.cycle === course.cycle);
      const orderInCycle = sameCycle.indexOf(course);
      return {
        id: course.id,
        type: 'courseNode',
        position: { x: columnas[course.cycle] ?? 0, y: orderInCycle * 110 },
        data: { ...course, onOpen: openCourse },
      };
    });
  }, [cursos, columnas, openCourse]);

  const initialEdges = useMemo<Edge[]>(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return aristas.map((e) => ({ ...e, animated: !reduce }));
  }, [aristas]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Si llegan datos nuevos por props (otro plan), se reemplaza el grafo
  // (patrón "ajustar estado al cambiar props"). Con los valores por defecto la
  // referencia no cambia y no hay render extra.
  const [prevNodes, setPrevNodes] = useState(initialNodes);
  const [prevEdges, setPrevEdges] = useState(initialEdges);
  if (prevNodes !== initialNodes) {
    setPrevNodes(initialNodes);
    setNodes(initialNodes);
  }
  if (prevEdges !== initialEdges) {
    setPrevEdges(initialEdges);
    setEdges(initialEdges);
  }

  // Detalle de un curso (se reutiliza en el panel lateral y en el modal móvil).
  const detail = (course: CourseData) => (
    <>
      <div className="flex gap-2 items-center flex-wrap mb-2">
        <span className="text-[9px] bg-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {course.cycle}
        </span>
        {course.isElective && (
          <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Curso Electivo
          </span>
        )}
      </div>
      <h3 className="text-base font-bold text-slate-900 leading-tight mb-3">{course.name}</h3>

      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
        <BookOpen size={12} /> Descripción de la asignatura
      </h4>
      <p className="text-xs text-slate-600 leading-relaxed mb-4">{course.description}</p>

      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs mb-4">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-slate-600 shrink-0" />
          <div>
            <p className="text-[9px] text-slate-400 font-medium">Valor Académico</p>
            <p className="font-bold text-slate-700">{course.credits} Créditos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-600 shrink-0" />
          <div>
            <p className="text-[9px] text-slate-400 font-medium">Carga Horaria</p>
            <p className="font-bold text-slate-700">HT {course.hoursT}h · HP {course.hoursP}h</p>
          </div>
        </div>
      </div>

      {pdfUrl && (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
      >
        <Download size={14} /> Descargar Plan de Estudios
      </a>
      )}
    </>
  );

  // Estado por defecto del panel: resumen de la malla.
  const overview = (
    <>
      <h3 className="font-display font-black text-primary text-lg leading-tight mb-2">Malla curricular</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">
        Mapa interactivo del plan de estudios por ciclos. Selecciona un curso para ver sus créditos,
        horas y descripción. Las líneas conectan los prerrequisitos.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { n: stats.cycles, l: 'Ciclos' },
          { n: stats.courses, l: 'Cursos' },
          { n: stats.credits, l: 'Créditos' },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
            <div className="text-xl font-display font-black text-primary">{s.n}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{s.l}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Áreas curriculares</p>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-400 rounded shrink-0" /><span className="text-slate-700">Estudios Generales</span></div>
        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-orange-50 border border-orange-400 rounded shrink-0" /><span className="text-slate-700">Estudios Específicos</span></div>
        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 bg-sky-50 border border-sky-400 rounded shrink-0" /><span className="text-slate-700">Estudios de Especialidad</span></div>
      </div>

      {pdfUrl && (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
      >
        <Download size={14} /> Descargar Plan de Estudios
      </a>
      )}
    </>
  );

  return (
    <div>
      {/* Vista de texto accesible del plan (lector de pantalla). El grafo de abajo
          es la versión interactiva equivalente; para impresión está el PDF.
          Se envuelve en un <div sr-only>: aplicar `sr-only` directamente a un
          <table> no lo colapsa (las tablas tratan height como mínimo e ignoran
          el recorte), lo que en Chrome extendía el scroll del documento. */}
      <div className="sr-only">
      <table>
        <caption>
          Plan de estudios por ciclos: {stats.cycles} ciclos, {stats.courses} cursos, {stats.credits} créditos.
        </caption>
        <thead>
          <tr>
            <th scope="col">Ciclo</th>
            <th scope="col">Curso</th>
            <th scope="col">Créditos</th>
            <th scope="col">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {cyclesOrdered.map((cycle) =>
            cursos.filter((c) => c.cycle === cycle).map((c) => (
              <tr key={c.id}>
                <td>{cycle}</td>
                <td>{c.name}</td>
                <td>{c.credits}</td>
                <td>{c.isElective ? 'Electivo' : 'Obligatorio'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <div className="lg:flex lg:items-stretch rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        {/* Grafo */}
        <div className="relative w-full lg:flex-1 h-[70svh] min-h-[460px] md:h-[720px] bg-slate-50 overflow-hidden lg:border-r lg:border-slate-200">
          {/* Ayuda: se autooculta; el botón "?" la vuelve a mostrar/ocultar */}
          <div className="absolute bottom-3 right-3 z-10 flex items-end gap-2">
            {showHelp && (
              <div className="bg-slate-900/90 text-white text-[10px] sm:text-[11px] px-2.5 py-1.5 rounded-lg shadow-md max-w-[230px]">
                Arrastra para mover{isDesktop ? ' · Ctrl + rueda para acercar/alejar' : ' · pellizca para zoom'}. {isDesktop ? 'Haz clic en' : 'Toca'} un curso para ver su detalle.
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              aria-label={showHelp ? 'Ocultar ayuda' : 'Mostrar ayuda'}
              aria-expanded={showHelp}
              className="shrink-0 h-11 w-11 flex items-center justify-center bg-slate-900/90 hover:bg-slate-900 text-sky-300 rounded-full shadow-md transition-colors"
            >
              <HelpCircle size={16} />
            </button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => openCourse(node.data as CourseNodeData)}
            nodeTypes={nodeTypes}
            fitView={isDesktop}
            defaultViewport={isDesktop ? undefined : { x: 16, y: 16, zoom: 0.85 }}
            minZoom={0.3}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            nodesFocusable={false}
            elementsSelectable={false}
            zoomOnScroll={true}
            zoomActivationKeyCode="Control"
            panOnScroll={false}
            preventScrolling={false}
            translateExtent={[[-500, -300], [3400, 1300]]}
            attributionPosition="bottom-right"
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls
              className="!bg-white !shadow-lg !border-slate-100 !rounded-lg [&_.react-flow__controls-button]:!w-10 [&_.react-flow__controls-button]:!h-10"
              showInteractive={false}
            />
          </ReactFlow>
        </div>

        {/* Panel lateral (solo escritorio ≥1024px): resumen o detalle */}
        <aside className="hidden lg:block w-[360px] shrink-0 h-[720px] bg-white overflow-y-auto">
          <div className="p-5">
            {selectedCourse ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-primary mb-3 inline-flex items-center gap-1"
                >
                  ← Volver al resumen
                </button>
                {detail(selectedCourse)}
              </>
            ) : (
              overview
            )}
          </div>
        </aside>
      </div>

      {/* Leyenda fuera del bloque, debajo. Solo en móvil/tablet: en escritorio
          el panel de resumen ya muestra las áreas, así no se duplica. */}
      <div className="lg:hidden mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Áreas</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-400 rounded" /> Estudios Generales</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-orange-50 border border-orange-400 rounded" /> Estudios Específicos</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-sky-50 border border-sky-400 rounded" /> Estudios de Especialidad</span>
      </div>

      {/* Modal solo en móvil/tablet (sin panel lateral) */}
      {!isDesktop && selectedCourse && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Detalle del curso: ${selectedCourse.name}`}>
          <button
            type="button"
            aria-label="Cerrar detalle"
            onClick={() => setSelectedCourse(null)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-default"
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-5 max-h-[85svh] overflow-y-auto">
            <button
              type="button"
              ref={modalCloseRef}
              onClick={() => setSelectedCourse(null)}
              aria-label="Cerrar"
              className="absolute top-3 right-3 z-10 h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
            {detail(selectedCourse)}
          </div>
        </div>
      )}
    </div>
  );
}
