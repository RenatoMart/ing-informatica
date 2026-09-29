// Contenido del panel lateral de Admisión (FloatingAdmissions).
// Las modalidades se muestran como tarjetas (en el orden de la lista).

export interface ModalidadAdmision {
  titulo: string;
  dirigidoA: string;
  vacantes: string;
  descripcion: string;
}

export interface InfoUtilItem {
  titulo: string;
  detalle: string;
}

// Fuente: admisionunt.info (ficha de la carrera, código 27 "Ing. Informática";
// cronograma; requisitos por modalidad) y el PDF oficial "Oferta de Vacantes
// Proceso de Admisión 2027-I - Sede Trujillo" (R.C.U. N° 254-2026/UNT), consultados
// el 2026-09-15. Verifica vigencia antes de publicar: cronogramas y vacantes
// cambian cada proceso de admisión.
export const modalidadesAdmision: ModalidadAdmision[] = [
  {
    titulo: 'Examen Ordinario',
    dirigidoA: 'Egresados de educación secundaria del país o del extranjero.',
    vacantes: '18 vacantes en Ing. Informática (Admisión 2027-I)',
    descripcion: 'Ingreso mediante examen de admisión presencial. Costo de inscripción: S/ 400. Examen: 22 o 23 de agosto de 2026, según área.',
  },
  {
    titulo: 'CEPUNT-I',
    dirigidoA: 'Egresados del Centro Preuniversitario de la UNT (CEPUNT).',
    vacantes: '14 vacantes en Ing. Informática (Admisión 2027-I)',
    descripcion: 'Ingreso mediante tres evaluaciones sumativas a lo largo del ciclo (24 de mayo, 28 de junio y 02 de agosto de 2026). Más información en cepunt.edu.pe.',
  },
  {
    titulo: 'Quinto de Secundaria',
    dirigidoA: 'Estudiantes que cursan el quinto año de secundaria.',
    vacantes: '3 vacantes en Ing. Informática (Admisión 2027-I)',
    descripcion: 'Reserva de vacante con constancia de estudios y autorización del padre o apoderado; la acreditación final se completa al egresar de secundaria. Costo de inscripción: S/ 400.',
  },
  {
    titulo: 'Premios de Excelencia',
    dirigidoA: 'Los dos primeros puestos de su promoción escolar (egresados desde 2025).',
    vacantes: '3 vacantes en Ing. Informática (Admisión 2027-I)',
    descripcion: 'Modalidad para estudiantes con el mejor orden de mérito de los cinco grados de secundaria. Costo de inscripción: S/ 400.',
  },
  {
    titulo: 'Personas con Discapacidad',
    dirigidoA: 'Postulantes con discapacidad certificada.',
    vacantes: '2 vacantes en Ing. Informática (Admisión 2027-I)',
    descripcion: 'Modalidad inclusiva; requiere certificado de discapacidad emitido por una institución prestadora de salud. Costo de inscripción: S/ 400.',
  },
];

export const infoUtilAdmision: InfoUtilItem[] = [
  {
    titulo: 'Requisitos',
    detalle: 'Comunes a la mayoría de modalidades: foto pasaporte a color, DNI o carné de extranjería (anverso y reverso) y declaración jurada de veracidad, además del documento propio de cada modalidad (constancia de estudios, certificado de discapacidad, título profesional, etc.) y el comprobante de pago correspondiente.',
  },
  {
    titulo: 'Fechas (Admisión 2027-I)',
    detalle: 'Inscripción virtual (Ordinario y Quinto de Secundaria): 15 de junio al 08 de agosto de 2026. Examen presencial: 22 y 23 de agosto de 2026, según área. CEPUNT-I: sumativos el 24 de mayo, 28 de junio y 02 de agosto de 2026.',
  },
  {
    titulo: 'Costos de inscripción',
    detalle: 'Examen Ordinario, Quinto de Secundaria, Premios de Excelencia, Discapacidad, Deportistas y Víctimas de la Violencia: S/ 400. Traslado interno: S/ 280. Traslado externo: S/ 540. Segunda profesión: S/ 1,000. Acreditación de ingresantes: S/ 50 (+S/ 400 adicional para CEPUNT).',
  },
];

// Botón inferior: portal oficial de admisión de la universidad (ficha de la
// carrera de Ing. Informática, código 27).
export const portalAdmision = {
  label: 'Portal de Admisión UNT',
  url: 'https://www.admisionunt.info/carreraDetalle/27',
};
