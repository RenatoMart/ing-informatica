/**
 * Aplica el perfil que llega de la API (o un borrador de la vista previa) sobre los datos que las
 * páginas ya importan de `@profile/...`: los objetos y listas se reemplazan EN SITIO, así los
 * componentes ven los datos nuevos sin cambiar sus imports. Los archivos de `profiles/` quedan
 * como respaldo estático si la API no responde.
 */
import type { Edge } from 'reactflow';
import * as siteMod from '@profile/config/site';
import * as brandingMod from '@profile/config/branding';
import * as seoMod from '@profile/config/seo';
import * as navMod from '@profile/config/navigation';
import * as academicoMod from '@profile/content/academico';
import * as admisionMod from '@profile/content/admision';
import * as autoridadesMod from '@profile/content/autoridades';
import * as avisosMod from '@profile/content/avisos';
import * as contactoMod from '@profile/content/contacto';
import * as docentesMod from '@profile/content/docentes';
import * as homeMod from '@profile/content/home';
import * as identidadMod from '@profile/content/identidad';
import * as investigacionMod from '@profile/content/investigacion';
import * as mallaMod from '@profile/content/malla';
import * as noticiasMod from '@profile/content/noticias';
import * as laboratoriosMod from '@profile/content/laboratorios';
import * as estadisticasMod from '@profile/content/estadisticas';
import * as comitesMod from '@profile/content/comites';
import * as administrativosMod from '@profile/content/administrativos';
import { actualizarSiteName } from '@/profile';
import { ICONOS } from './iconos';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Mod = Record<string, any>;
const esObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Misma regla que el backend: los objetos se mezclan; listas y textos de «sobre» reemplazan. */
function fusion(base: any, sobre: any): any {
  if (!esObj(base) || !esObj(sobre)) return sobre === undefined ? base : sobre;
  const r: Record<string, any> = { ...base };
  for (const k of Object.keys(sobre)) r[k] = fusion(base[k], sobre[k]);
  return r;
}

const clonar = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

// Copia del valor estático original de cada objeto, para completar campos que la API no defina.
const originales = new WeakMap<object, any>();

/** Reemplaza en sitio una lista exportada. */
function lista(ns: Mod, nombre: string, valor: unknown) {
  const destino = ns[nombre];
  if (!Array.isArray(destino) || !Array.isArray(valor)) return;
  destino.splice(0, destino.length, ...clonar(valor));
}

/** Reemplaza en sitio un objeto exportado, completando con el original lo que la API no traiga. */
function objeto(ns: Mod, nombre: string, valor: unknown) {
  const destino = ns[nombre];
  if (!esObj(destino) || !esObj(valor)) return;
  if (!originales.has(destino)) originales.set(destino, clonar(destino));
  const nuevo = fusion(originales.get(destino), clonar(valor));
  for (const k of Object.keys(destino)) delete destino[k];
  Object.assign(destino, nuevo);
}

const COLOR_ARISTA: Record<string, string> = { especialidad: '#38bdf8', especifico: '#f97316', general: '#f97316' };
const COLUMNA_CICLO = 320;

/** Reconstruye CURRICULUM_DATA, PREREQUISITES_EDGES y CYCLE_COLUMNS a partir del plan vigente. */
function malla(m: any) {
  if (!esObj(m) || !Array.isArray(m.cursos)) return;
  const tipoPorId = new Map<string, string>(m.cursos.map((c: any) => [c.id, c.type]));
  const aristas: Edge[] = (m.prerrequisitos ?? []).map((e: any, i: number) => ({
    id: `e-${i + 1}`, source: e.source, target: e.target,
    style: { stroke: COLOR_ARISTA[tipoPorId.get(e.target) ?? 'especialidad'] ?? '#38bdf8', strokeWidth: 2 },
  }));
  const ciclos = [...new Set<string>(m.cursos.map((c: any) => c.cycle))];
  const romano = (s: string) => ({ I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14 } as Record<string, number>)[s.replace('Ciclo ', '')] ?? 99;
  ciclos.sort((a, b) => romano(a) - romano(b));
  const columnas = mallaMod.CYCLE_COLUMNS as Record<string, number>;
  for (const k of Object.keys(columnas)) delete columnas[k];
  ciclos.forEach((c, i) => { columnas[c] = i * COLUMNA_CICLO; });
  lista(mallaMod, 'CURRICULUM_DATA', m.cursos);
  lista(mallaMod, 'PREREQUISITES_EDGES', aristas);
}

/** Aplica una sección del perfil (clave de la API) sobre los datos del sitio. */
export function aplicarClave(clave: string, d: any): void {
  if (d === null || d === undefined) return;
  switch (clave) {
    case 'site': objeto(siteMod, 'site', d); break;
    case 'branding': objeto(brandingMod, 'branding', d); break;
    case 'seo': objeto(seoMod, 'seo', d); break;
    case 'navegacion':
      lista(navMod, 'NAV_LINKS', d.menu);
      lista(navMod, 'ADMISION_GROUPS', d.admision);
      break;
    case 'avisos': lista(avisosMod, 'avisos', d.items); break;
    case 'home':
      // `lista` clona con JSON (destruiría los componentes): los íconos se asignan después del clonado.
      lista(homeMod, 'accesosRapidos', d.accesosRapidos);
      if (Array.isArray(d.accesosRapidos)) {
        homeMod.accesosRapidos.forEach((a: any) => { a.icono = ICONOS[a.icono] ?? ICONOS.Star; });
      }
      lista(homeMod, 'ambientes', d.ambientes);
      break;
    case 'identidad':
      (identidadMod as Mod).__aplicar?.({ mision: d.mision, vision: d.vision, misionUnt: d.misionUnt, visionUnt: d.visionUnt });
      lista(identidadMod, 'valores', d.valores);
      lista(identidadMod, 'objetivosEducacionales', d.objetivosEducacionales);
      lista(identidadMod, 'objetivosEducacionalesUnt', d.objetivosEducacionalesUnt);
      objeto(identidadMod, 'historia', d.historia);
      objeto(identidadMod, 'objetivosAcademicos', d.objetivosAcademicos);
      break;
    case 'autoridades':
      objeto(autoridadesMod, 'director', d.director);
      objeto(autoridadesMod, 'directorDepartamento', d.directorDepartamento);
      objeto(autoridadesMod, 'decano', d.decano);
      objeto(autoridadesMod, 'organigrama', d.organigrama);
      lista(autoridadesMod, 'coordinadores', d.coordinadores);
      break;
    case 'academico':
      (academicoMod as Mod).__aplicar?.({ gradoAcademico: d.gradoAcademico, tituloProfesional: d.tituloProfesional });
      for (const n of ['perfilIngresante', 'perfilEgresado', 'titulacion', 'tramites', 'movilidad', 'perspectivasOcupacionales']) lista(academicoMod, n, d[n]);
      break;
    case 'investigacion':
      for (const n of ['lineasInvestigacion', 'proyectos', 'publicaciones', 'revistas', 'convenios']) lista(investigacionMod, n, d[n]);
      objeto(investigacionMod, 'conveniosOrni', d.conveniosOrni);
      break;
    case 'admision':
      lista(admisionMod, 'modalidadesAdmision', d.modalidades);
      lista(admisionMod, 'infoUtilAdmision', d.infoUtil);
      objeto(admisionMod, 'portalAdmision', d.portal);
      break;
    case 'contacto':
      objeto(contactoMod, 'informacionContacto', d.informacion);
      objeto(contactoMod, 'redesSociales', d.redes);
      break;
    case 'docentes': lista(docentesMod, 'docentes', d); break;
    case 'noticias': lista(noticiasMod, 'noticias', d); break;
    case 'malla': malla(d); break;
    case 'laboratorios':
      lista(laboratoriosMod, 'laboratoriosFotos', (d.fotos ?? []).filter((f: any) => f?.imagen).map((f: any) => ({ src: f.imagen, alt: f.alt ?? '', position: f.posicion || undefined })));
      lista(laboratoriosMod, 'laboratorios', (d.items ?? []).filter((i: any) => i?.nombre).map((i: any) => ({
        nombre: i.nombre, tipo: i.tipo === 'Taller' ? 'Taller' : 'Laboratorio', descripcion: i.descripcion ?? '', imagen: i.imagen || null,
      })));
      objeto(laboratoriosMod, 'laboratoriosPortada', { pie: d.pie ?? '' });
      break;
    case 'estadisticas': {
      const num = (v: any): number | null => { const n = parseInt(String(v ?? '').trim(), 10); return Number.isFinite(n) ? n : null; };
      lista(estadisticasMod, 'estadisticasAnuales', (d.anuales ?? []).filter((a: any) => a?.anio).map((a: any) => {
        const porCiclo = Array.from({ length: 10 }, (_, i) => num((a.porCiclo ?? [])[i]));
        return { anio: String(a.anio), porCiclo, total: num(a.total) ?? porCiclo.reduce<number>((t, n) => t + (n ?? 0), 0), egresados: num(a.egresados), bachilleres: num(a.bachilleres), nota: a.nota || undefined };
      }));
      objeto(estadisticasMod, 'fuenteEstadisticas', { label: d.fuente?.label ?? '', url: d.fuente?.url ?? '' });
      break;
    }
    case 'comites':
      lista(comitesMod, 'comites', (d.items ?? []).filter((c: any) => c?.titulo).map((c: any) => ({
        id: c.id || String(c.titulo).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        titulo: c.titulo, descripcion: c.descripcion || undefined, resolucion: c.resolucion || undefined,
        miembros: (c.miembros ?? []).filter((m: any) => m?.nombre).map((m: any) => ({ nombre: m.nombre, rol: m.rol || 'Miembro', grado: m.grado || undefined })),
      })));
      break;
    case 'administrativos':
      lista(administrativosMod, 'administrativos', (d.items ?? []).filter((p: any) => p?.nombre).map((p: any) => ({ nombre: p.nombre, cargo: p.cargo || '', area: p.area || '', foto: p.foto || null, fotoPosicion: p.fotoPosicion || undefined })));
      break;
    default: return; // escuela, paginas: no las usa el sitio
  }
  actualizarSiteName();
}

/** Aplica el perfil completo que devuelve la API. */
export function aplicarPerfil(perfil: Record<string, any>): void {
  for (const clave of Object.keys(perfil)) aplicarClave(clave, perfil[clave]);
}
