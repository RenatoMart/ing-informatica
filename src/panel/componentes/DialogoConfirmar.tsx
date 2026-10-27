import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Boton } from './Boton';
import { AlertaFormulario } from './Formulario';

export interface DialogoConfirmarProps {
  abierto: boolean;
  titulo: ReactNode;
  mensaje?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Botón de confirmación en rojo (acciones destructivas). */
  peligro?: boolean;
  cargando?: boolean;
  /** Error de la acción (se muestra dentro del diálogo). */
  error?: unknown;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Confirmación de una acción (descartar, solicitar baja, desactivar…). */
export function DialogoConfirmar({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligro = false,
  cargando = false,
  error,
  onConfirmar,
  onCancelar,
}: DialogoConfirmarProps) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={() => !cargando && onCancelar()}
      titulo={titulo}
      tamano="sm"
      pie={
        <>
          <Boton variante="secundario" onClick={onCancelar} disabled={cargando}>
            {textoCancelar}
          </Boton>
          <Boton variante={peligro ? 'peligro' : 'primario'} onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Boton>
        </>
      }
    >
      <div className="space-y-3 text-sm text-gray-700">
        {error ? <AlertaFormulario error={error} /> : null}
        {mensaje}
      </div>
    </Modal>
  );
}

/** Alias corto. */
export const Confirmar = DialogoConfirmar;
