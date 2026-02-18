
/**
 * @fileOverview Configuración de jerarquía y permisos del bar.
 */

// DUEÑO BOOTSTRAP: Carlitos tiene control total inicial.
export const OWNER_WHITELIST = [
  "carlitosnajdarg@gmail.com"
];

// GERENTES BOOTSTRAP: Control administrativo inicial.
export const ADMIN_WHITELIST = [
  "arrozitocarlos1@gmail.com",
  "dueno@mrsmithbarpool.com"
];

export type UserRole = 'owner' | 'admin' | 'staff' | 'none';

export function getRole(email: string | null | undefined): UserRole {
  if (!email) return 'none';
  const lowEmail = email.toLowerCase();
  if (OWNER_WHITELIST.includes(lowEmail)) return 'owner';
  if (ADMIN_WHITELIST.includes(lowEmail)) return 'admin';
  return 'none';
}

export function isOwner(email: string | null | undefined): boolean {
  return getRole(email) === 'owner';
}

export function isAdmin(email: string | null | undefined): boolean {
  const role = getRole(email);
  return role === 'admin' || role === 'owner';
}
