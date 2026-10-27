import { useEffect, useState } from 'react';
import { Boton } from './Boton';
import { CampoTexto, Formulario, combinarErrores, errorDe } from './Formulario';
import { Modal } from './Modal';
import { useGuardarDepartamento } from '../controladores/GestionarDocentesController';
import { validarDepartamento, type Departamento } from '../modelos/docentes';

/** Alta/edición de un departamento (modal dentro de Docentes). */
export default function ModalDepartamento({
  abierto,
  departamento,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  /** `null` = alta. */
  departamento: Departamento | null;
  onCerrar: () => void;
  onGuardado?: (id: number) => void;
}) {
  const guardar = useGuardarDepartamento();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [errCliente, setErrCliente] = useState<Record<string, string>>({});

  useEffect(() => {
    if (abierto) {
      setNombre(departamento?.nombre ?? '');
      setCorreo(departamento?.correo ?? '');
      setErrCliente({});
      guardar.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, departamento]);

  const enviar = () => {
    const e = validarDepartamento({ nombre, correo });
    setErrCliente(e);
    if (Object.keys(e).length) return;
    guardar.mutate(
      { id: departamento?.id_departamento, datos: { nombre: nombre.trim(), correo: correo.trim() || null } },
      {
        onSuccess: (id) => {
          onGuardado?.(id);
          onCerrar();
        },
      },
    );
  };

  const errores = combinarErrores((guardar.error as { campos?: Record<string, string[]> } | null)?.campos, errCliente);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={departamento ? 'Editar departamento' : 'Nuevo departamento'}
      tamano="sm"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton cargando={guardar.isPending} onClick={enviar}>
            Guardar
          </Boton>
        </>
      }
    >
      <Formulario aria-label="Datos del departamento" onEnviar={enviar} error={guardar.error}>
        <CampoTexto etiqueta="Nombre" requerido value={nombre} maxLength={150} onChange={(e) => setNombre(e.target.value)} error={errorDe(errores, 'nombre')} />
        <CampoTexto etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errorDe(errores, 'correo')} ayuda="Opcional." />
      </Formulario>
    </Modal>
  );
}
