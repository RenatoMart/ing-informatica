import { useState } from 'react';
import { Upload } from 'lucide-react';
import { erroresDeCampos } from '../../../lib/api';
import { Boton } from '../../componentes/Boton';
import { AlertaFormulario, errorDe } from '../../componentes/Formulario';
import { SubirArchivo } from '../../componentes/SubirArchivo';
import { Tarjeta } from '../../componentes/EncabezadoPagina';
import { useToast } from '../../componentes/Toast';
import { useSubirPdfPlan } from '../../controladores/GestionarPlanEstudiosController';
import type { PlanDetalle, TipoPdfPlan } from '../../modelos/planes';

const PDFS: { tipo: TipoPdfPlan; etiqueta: string; url: (p: PlanDetalle) => string | null }[] = [
  { tipo: 'plan', etiqueta: 'PDF del plan de estudios', url: (p) => p.pdf_plan_url },
  { tipo: 'resolucion', etiqueta: 'PDF de la resolución', url: (p) => p.pdf_resolucion_url },
];

function TarjetaPdf({ plan, tipo, etiqueta, urlActual, editable }: { plan: PlanDetalle; tipo: TipoPdfPlan; etiqueta: string; urlActual: string | null; editable: boolean }) {
  const toast = useToast();
  const subir = useSubirPdfPlan(plan.id_plan);
  const [archivo, setArchivo] = useState<File | null>(null);
  const err = errorDe(erroresDeCampos(subir.error), 'archivo');
  return (
    <Tarjeta titulo={etiqueta}>
      <div className="space-y-3">
        <SubirArchivo
          etiqueta={etiqueta}
          aceptar="application/pdf"
          maxMB={10}
          archivo={archivo}
          onSeleccionar={(f) => {
            subir.reset();
            setArchivo(f);
          }}
          urlActual={urlActual}
          deshabilitado={!editable}
          error={err}
          ayuda="Solo PDF, hasta 10 MB. Es obligatorio para enviar a revisión."
        />
        {subir.error && !err ? <AlertaFormulario error={subir.error} /> : null}
        {editable && (
          <Boton
            disabled={!archivo}
            cargando={subir.isPending}
            icono={<Upload aria-hidden="true" className="h-4 w-4" />}
            onClick={() =>
              archivo &&
              subir.mutate(
                { tipo, archivo },
                {
                  onSuccess: () => {
                    toast.exito('PDF subido correctamente.');
                    setArchivo(null);
                  },
                },
              )
            }
          >
            Subir PDF
          </Boton>
        )}
      </div>
    </Tarjeta>
  );
}

/** Pestaña «Documentos»: PDF del plan y de la resolución. */
export function TabDocumentosPlan({ plan, editable }: { plan: PlanDetalle; editable: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {PDFS.map((p) => (
        <TarjetaPdf key={p.tipo} plan={plan} tipo={p.tipo} etiqueta={p.etiqueta} urlActual={p.url(plan)} editable={editable} />
      ))}
    </div>
  );
}
