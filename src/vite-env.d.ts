/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API del portal. En desarrollo: http://localhost:8080. Vacío = mismo origen. */
  readonly VITE_API_URL?: string;
  /** Slug de la escuela cuyo contenido carga el sitio (p. ej. informatica). */
  readonly VITE_ESCUELA_SLUG?: string;
  /** Orígenes del panel autorizados a enviar borradores a la vista previa (separados por coma). */
  readonly VITE_PANEL_ORIGINS?: string;
}
