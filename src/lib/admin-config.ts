/**
 * @fileOverview Configuración de jerarquía y permisos del bar.
 */

// DUEÑOS Y GERENTES: Control total (Añadir y Borrar)
export const ADMIN_WHITELIST = [
  "arrozitocarlos1@gmail.com",
  "carlitosnajdarg@gmail.com",
  "dueno@mrsmithbarpool.com"
];

// STAFF / PERSONAL: Solo lectura y añadir productos
export const MOD_WHITELIST = [
  "staff@mrsmithbarpool.com",
  "mesero@mrsmithbarpool.com",
  "bartender@mrsmithbarpool.com"
];

export type UserRole = 'admin' | 'mod' | 'none';

export function getRole(email: string | null | undefined): UserRole {
  if (!email) return 'none';
  const lowEmail = email.toLowerCase();
  if (ADMIN_WHITELIST.includes(lowEmail)) return 'admin';
  if (MOD_WHITELIST.includes(lowEmail)) return 'mod';
  return 'none';
}

export function isAdmin(email: string | null | undefined): boolean {
  return getRole(email) === 'admin';
}

export function isAuthorized(email: string | null | undefined): boolean {
  const role = getRole(email);
  return role === 'admin' || role === 'mod';
}
