/**
 * @fileOverview Configuración de seguridad para el panel administrativo.
 * 
 * IMPORTANTE: Agrega aquí los correos de Gmail que quieres que tengan
 * acceso total para añadir o borrar productos del menú.
 */

export const ADMIN_WHITELIST = [
  "arrozitocarlos1@gmail.com",
  "carlitosnajdarg@gmail.com", // Nuevo administrador añadido
  "admin@mrsmithbarpool.com"
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_WHITELIST.includes(email.toLowerCase());
}
