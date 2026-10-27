/** Cliente HTTP de documentos oficiales (docs/DISENO_BACKEND.md §5.2). */
import { apiPanel, aFormData } from '../../lib/api';
import type { Paginado } from '../modelos/comunes';
import type { DocumentoDetalle, DocumentoResumen, FiltrosDocumentos, VersionDocumento } from '../modelos/documentosAdmision';

const desenvolver = <T>(r: unknown): T =>
  (r && typeof r === 'object' && 'data' in (r as object) && !('meta' in (r as object)) ? (r as { data: T }).data : r) as T;

export interface DatosDocumentoEnvio {
  tipo: string;
  numero: string;
  titulo: string;
  fecha_emision: string;
  id_departamento_emisor: string;
  fecha_vigencia: string;
  id_version_anterior?: string;
  archivo?: File | null;
}

const aCampos = (d: DatosDocumentoEnvio) =>
  aFormData({
    tipo: d.tipo,
    numero: d.numero.trim(),
    titulo: d.titulo.trim(),
    fecha_emision: d.fecha_emision,
    id_departamento_emisor: d.id_departamento_emisor,
    fecha_vigencia: d.fecha_vigencia,
    id_version_anterior: d.id_version_anterior || undefined,
    archivo: d.archivo ?? undefined,
  });

function normalizar(r: Record<string, unknown>): DocumentoDetalle {
  const lista = (v: unknown) => (Array.isArray(v) ? (v as VersionDocumento[]) : []);
  const ver = (r.versiones ?? r.cadena ?? {}) as Record<string, unknown>;
  const todas = Array.isArray(ver) ? (ver as (VersionDocumento & { relacion?: string })[]) : [];
  return {
    ...(r as unknown as DocumentoDetalle),
    anteriores: lista(r.versiones_anteriores ?? r.anteriores ?? ver.anteriores ?? todas.filter((v) => v.relacion === 'anterior')),
    posteriores: lista(r.versiones_posteriores ?? r.posteriores ?? ver.posteriores ?? todas.filter((v) => v.relacion === 'posterior')),
  };
}

export const apiDocumentos = {
  listar: async (f: FiltrosDocumentos & { por_pagina?: number }) =>
    (await apiPanel.get<Paginado<DocumentoResumen>>('/documentos', { params: { ...f } })),
  obtener: async (id: number) => normalizar(desenvolver<Record<string, unknown>>(await apiPanel.get(`/documentos/${id}`))),
  crear: (d: DatosDocumentoEnvio) => apiPanel.subir('/documentos', aCampos(d)),
  actualizar: (id: number, d: DatosDocumentoEnvio) =>
    apiPanel.subir(`/documentos/${id}`, aCampos({ ...d, id_version_anterior: undefined }), { metodo: 'PUT' }),
  reenviar: (id: number) => apiPanel.post(`/documentos/${id}/reenviar`),
  departamentos: async () =>
    desenvolver<{ id_departamento: number; nombre: string }[]>(await apiPanel.get('/departamentos')) ?? [],
};
