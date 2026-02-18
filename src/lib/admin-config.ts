
/**
 * @fileOverview Configuración de seguridad para el panel administrativo.
 * 
 * IMPORTANTE: Agrega aquí los correos de Gmail que quieres que tengan
 * acceso total para añadir o borrar productos del menú.
 */

export const ADMIN_WHITELIST = [
  "tu-correo-aqui@gmail.com", // <-- CAMBIA ESTO POR TU GMAIL
  "admin@mrsmithbarpool.com"
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_WHITELIST.includes(email.toLowerCase());
}
