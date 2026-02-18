
/**
 * @fileOverview Configuración de jerarquía y permisos del bar.
 * Nota: Los moderadores (staff) ahora se gestionan dinámicamente desde Firestore.
 */

// DUEÑOS Y GERENTES: Control total e inamovible
export const ADMIN_WHITELIST = [
  "arrozitocarlos1@gmail.com",
  "carlitosnajdarg@gmail.com",
  "dueno@mrsmithbarpool.com"
];

// Estos son moderadores estáticos opcionales. 
// El personal nuevo se guarda en la colección 'staff_members' de Firestore.
export const STATIC_MOD_WHITELIST = [
  "staff@mrsmithbarpool.com"
];

export type UserRole = 'admin' | 'mod' | 'none';

// Esta función ahora debería ser usada con cuidado ya que solo verifica listas estáticas.
// El panel de admin verificará también la colección de staff_members.
export function getRole(email: string | null | undefined): UserRole {
  if (!email) return 'none';
  const lowEmail = email.toLowerCase();
  if (ADMIN_WHITELIST.includes(lowEmail)) return 'admin';
  if (STATIC_MOD_WHITELIST.includes(lowEmail)) return 'mod';
  // En la práctica, el componente Admin verificará si existe en Firestore
  return 'none';
}

export function isAdmin(email: string | null | undefined): boolean {
  return getRole(email) === 'admin';
}

export function isAuthorized(email: string | null | undefined): boolean {
  // Nota: Esta función es solo para validación inicial. 
  // El personal dinámico se valida en los componentes.
  const role = getRole(email);
  return role === 'admin' || role === 'mod';
}
