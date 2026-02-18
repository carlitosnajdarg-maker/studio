
// Lista de correos electrónicos autorizados para acceder al panel administrativo
// ¡RECUERDA AGREGAR TU GMAIL AQUÍ PARA PODER ENTRAR!
export const ADMIN_WHITELIST = [
  "tu-email@gmail.com", 
  "admin@mrsmithbarpool.com",
  "jose@gmail.com" // Ejemplo de otro correo autorizado
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_WHITELIST.includes(email.toLowerCase());
}
