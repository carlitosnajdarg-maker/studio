
/**
 * @fileOverview Configuración de jerarquía y permisos del bar.
 */

// DUEÑO: Control absoluto (Bootstrap)
export const OWNER_WHITELIST = [
  "carlitosnajdarg@gmail.com"
];

// GERENTES: Control administrativo (Bootstrap)
export const ADMIN_WHITELIST = [
  "arrozitocarlos1@gmail.com",
  "dueno@mrsmithbarpool.com"
];

// MODERADORES ESTÁTICOS (Bootstrap)
export const STATIC_MOD_WHITELIST = [
  "staff@mrsmithbarpool.com"
];

export type UserRole = 'owner' | 'admin' | 'mod' | 'none';

export function getRole(email: string | null | undefined): UserRole {
  if (!email) return 'none';
  const lowEmail = email.toLowerCase();
  if (OWNER_WHITELIST.includes(lowEmail)) return 'owner';
  if (ADMIN_WHITELIST.includes(lowEmail)) return 'admin';
  if (STATIC_MOD_WHITELIST.includes(lowEmail)) return 'mod';
  return 'none';
}

export function isOwner(email: string | null | undefined): boolean {
  return getRole(email) === 'owner';
}

export function isAdmin(email: string | null | undefined): boolean {
  const role = getRole(email);
  return role === 'admin' || role === 'owner';
}

export function isAuthorized(email: string | null | undefined): boolean {
  const role = getRole(email);
  return role !== 'none';
}
