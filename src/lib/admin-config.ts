
// Lista de correos electrónicos autorizados para acceder al panel administrativo
export const ADMIN_WHITELIST = [
  "tu-email@gmail.com", // Reemplaza con tu email real
  "admin@mrsmithbarpool.com"
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_WHITELIST.includes(email);
}
