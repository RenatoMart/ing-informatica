import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { validarFormularioContacto, type ContactoFormData, type ContactoErrores } from '../../utils/validators';
import { enviarConsulta } from '@/data/perfilRemoto';
import { informacionContacto } from '@profile/content/contacto';

export default function FormContacto() {
  const [formData, setFormData] = useState<ContactoFormData>({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [errores, setErrores] = useState<ContactoErrores>({});
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [trampa, setTrampa] = useState(''); // campo oculto anti-bots: las personas no lo ven ni lo llenan

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as keyof ContactoFormData;
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enviando) return;
    const validacion = validarFormularioContacto(formData);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      return;
    }
    setFallo('');
    setEnviando(true);
    const r = await enviarConsulta({ nombre: formData.nombre.trim(), correo: formData.email.trim(), asunto: formData.asunto.trim(), mensaje: formData.mensaje.trim(), trampa });
    setEnviando(false);
    if (r === 'ok') {
      setEnviado(true);
      return;
    }
    // El mensaje NO se envió: se dice claramente y se conserva lo escrito para reintentar.
    setFallo(
      r === 'limite' ? 'Ya recibimos varios mensajes desde tu conexión. Espera unos minutos y vuelve a intentarlo.'
        : r === 'invalido' ? 'Revisa los datos: el correo debe ser válido y el mensaje tener al menos 5 caracteres.'
          : `No pudimos enviar tu mensaje en este momento. Inténtalo de nuevo o escríbenos a ${informacionContacto.correo}.`,
    );
  };

  if (enviado) {
    return (
      <div className="bg-success/10 text-success p-8 rounded-xl text-center border border-success/20 animate-fade-in">
        <CheckCircle2 className="w-14 h-14 mx-auto mb-4" />
        <h3 className="text-xl font-display font-bold mb-2">¡Mensaje Enviado!</h3>
        <p className="text-sm">Gracias por contactarnos. Te responderemos a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="contacto-nombre" className="block text-sm font-semibold text-primary mb-1.5">
          Nombre completo <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="contacto-nombre"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          aria-required="true"
          aria-invalid={errores.nombre ? 'true' : undefined}
          aria-describedby={errores.nombre ? 'contacto-nombre-error' : undefined}
          placeholder="Tu nombre completo"
          className={`w-full p-3 rounded-lg border ${errores.nombre ? 'border-danger' : 'border-gray-200'} focus:ring-2 focus:ring-primary/20 outline-none transition text-base md:text-sm`}
        />
        {errores.nombre && <span id="contacto-nombre-error" role="alert" className="text-xs text-danger mt-1 block">{errores.nombre}</span>}
      </div>
      <div>
        <label htmlFor="contacto-email" className="block text-sm font-semibold text-primary mb-1.5">
          Correo electrónico <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="contacto-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          aria-required="true"
          aria-invalid={errores.email ? 'true' : undefined}
          aria-describedby={errores.email ? 'contacto-email-error' : undefined}
          placeholder="Tu correo electrónico"
          className={`w-full p-3 rounded-lg border ${errores.email ? 'border-danger' : 'border-gray-200'} focus:ring-2 focus:ring-primary/20 outline-none transition text-base md:text-sm`}
        />
        {errores.email && <span id="contacto-email-error" role="alert" className="text-xs text-danger mt-1 block">{errores.email}</span>}
      </div>
      <div>
        <label htmlFor="contacto-asunto" className="block text-sm font-semibold text-primary mb-1.5">
          Asunto <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="contacto-asunto"
          type="text"
          name="asunto"
          value={formData.asunto}
          onChange={handleChange}
          required
          aria-required="true"
          aria-invalid={errores.asunto ? 'true' : undefined}
          aria-describedby={errores.asunto ? 'contacto-asunto-error' : undefined}
          placeholder="Asunto del mensaje"
          className={`w-full p-3 rounded-lg border ${errores.asunto ? 'border-danger' : 'border-gray-200'} focus:ring-2 focus:ring-primary/20 outline-none transition text-base md:text-sm`}
        />
        {errores.asunto && <span id="contacto-asunto-error" role="alert" className="text-xs text-danger mt-1 block">{errores.asunto}</span>}
      </div>
      <div>
        <label htmlFor="contacto-mensaje" className="block text-sm font-semibold text-primary mb-1.5">
          Mensaje <span className="text-danger" aria-hidden="true">*</span>
        </label>
        <textarea
          id="contacto-mensaje"
          name="mensaje"
          value={formData.mensaje}
          onChange={handleChange}
          rows={4}
          required
          aria-required="true"
          aria-invalid={errores.mensaje ? 'true' : undefined}
          aria-describedby={errores.mensaje ? 'contacto-mensaje-error' : undefined}
          placeholder="Escribe tu mensaje aquí..."
          className={`w-full p-3 rounded-lg border ${errores.mensaje ? 'border-danger' : 'border-gray-200'} focus:ring-2 focus:ring-primary/20 outline-none transition text-base md:text-sm resize-none`}
        ></textarea>
        {errores.mensaje && <span id="contacto-mensaje-error" role="alert" className="text-xs text-danger mt-1 block">{errores.mensaje}</span>}
      </div>
      {/* Campo trampa: oculto para personas y lectores de pantalla; solo lo rellenan los bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contacto-sitio-web">No llenar este campo</label>
        <input id="contacto-sitio-web" type="text" name="sitio_web" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
      </div>
      {fallo && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{fallo}</p>
      )}
      <Button type="submit" disabled={enviando} aria-busy={enviando} className="w-full text-sm py-3 disabled:cursor-wait disabled:opacity-70">
        {enviando ? 'Enviando…' : 'Enviar mensaje'}
      </Button>
    </form>
  );
}