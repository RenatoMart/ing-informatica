import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
} from 'reactflow';
import dagre from '@dagrejs/dagre';

import 'reactflow/dist/style.css';

import { organigrama } from '@profile/content/autoridades';

/**
 * Organigrama como grafo interactivo (ReactFlow), con auto‑layout por dagre.
 *
 * Se alimenta del MISMO árbol `organigrama` del perfil (nombre/cargo/hijos): no
 * hay coordenadas que mantener a mano, dagre las calcula. Editar el perfil =
 * el grafo se redibuja solo. Por eso sirve como plantilla.
 */

interface NodoOrg {
  nombre: string;
  cargo?: string;
  hijos?: NodoOrg[];
}

interface OrgData {
  nombre: string;
  cargo?: string;
  level: number;
}

const NODE_W = 240;
const NODE_H = 96;

// ReactFlow exige color literal en JS (no acepta clases de Tailwind). Estas
// constantes son el espejo de los tokens: `primary` de tailwind.config.js y el
// gris de cuadrícula de la malla. Excepción documentada, igual criterio que MallaFlow.
const EDGE_COLOR = 'rgba(18,55,123,0.25)'; // primary @ 25%
const GRID_COLOR = '#cbd5e1'; // slate-300

// ── Nodo on‑brand: raíz en azul (cargo dorado); resto blanco con franja superior ──
function OrgNode({ data }: NodeProps<OrgData>) {
  const isRoot = data.level === 0;
  return (
    <div
      className={`relative w-60 px-4 py-3 rounded-xl shadow-lg border text-center overflow-hidden ${
        isRoot ? 'bg-primary text-white border-transparent ring-4 ring-primary/10' : 'bg-white border-gray-100'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      {!isRoot && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-gold" />}

      <h4 className={`font-display font-bold leading-tight ${isRoot ? 'text-white text-base' : 'text-primary text-sm'}`}>
        {data.nombre}
      </h4>
      {data.cargo && (
        <p className={`text-[11px] mt-1.5 font-semibold uppercase tracking-wide ${isRoot ? 'text-gold' : 'text-gray-500'}`}>
          {data.cargo}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

const nodeTypes: NodeTypes = { orgNode: OrgNode };

// Aplana el árbol a nodos + aristas (ids estables generados por recorrido).
function buildGraph(root: NodoOrg) {
  const nodes: Node<OrgData>[] = [];
  const edges: Edge[] = [];
  let counter = 0;

  const walk = (nodo: NodoOrg, level: number, parentId: string | null) => {
    const id = `org-${counter++}`;
    nodes.push({ id, type: 'orgNode', position: { x: 0, y: 0 }, data: { nombre: nodo.nombre, cargo: nodo.cargo, level } });
    if (parentId) {
      edges.push({
        id: `${parentId}->${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
      });
    }
    nodo.hijos?.forEach((h) => walk(h, level + 1, id));
  };

  walk(root, 0, null);
  return { nodes, edges };
}

// dagre posiciona (TB, de arriba‑abajo) y devuelve centros: los paso a top‑left.
function layout(nodes: Node<OrgData>[], edges: Edge[]): Node<OrgData>[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 70, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return {
      ...n,
      position: { x: x - NODE_W / 2, y: y - NODE_H / 2 },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });
}

// Esquema accesible para lectores de pantalla (el lienzo de ReactFlow no lo es).
function OrgOutline({ nodo }: { nodo: NodoOrg }) {
  return (
    <li>
      {nodo.nombre}
      {nodo.cargo ? ` — ${nodo.cargo}` : ''}
      {nodo.hijos && nodo.hijos.length > 0 && (
        <ul>
          {nodo.hijos.map((h, i) => (
            <OrgOutline key={i} nodo={h} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrganigramaFlow() {
  const { nodes: rawNodes, edges } = useMemo(() => buildGraph(organigrama as NodoOrg), []);
  const layouted = useMemo(() => layout(rawNodes, edges), [rawNodes, edges]);
  const [nodes, , onNodesChange] = useNodesState(layouted);

  return (
    <>
      {/* Equivalente textual accesible del organigrama */}
      <ul className="sr-only">
        <OrgOutline nodo={organigrama as NodoOrg} />
      </ul>

      <div
        aria-hidden="true"
        className="relative w-full h-[60svh] min-h-[420px] md:h-[560px] rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-slate-50"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          nodesConnectable={false}
          elementsSelectable={false}
          // El grafo es decorativo: su equivalente accesible es la lista `sr-only`
          // de arriba. Por eso el lienzo va `aria-hidden` y aquí se quita todo
          // tab‑stop (nodos, aristas y atribución), para no enfocar contenido oculto.
          nodesFocusable={false}
          edgesFocusable={false}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={1.5}
          zoomOnScroll
          zoomActivationKeyCode="Control"
          panOnScroll={false}
          preventScrolling={false}
        >
          <Background color={GRID_COLOR} gap={20} size={1} />
          <Controls
            className="!bg-white !shadow-lg !border-slate-100 !rounded-lg [&_.react-flow__controls-button]:!w-10 [&_.react-flow__controls-button]:!h-10"
            showInteractive={false}
          />
        </ReactFlow>
      </div>

      <p className="text-center text-xs text-slate-500 mt-3">
        Arrastra los nodos para reorganizar · Ctrl + rueda del ratón para acercar/alejar.
      </p>
    </>
  );
}
