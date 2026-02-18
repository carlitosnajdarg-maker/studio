# Mr. Smith - El Mejor Bar Pool de la Costa

Bienvenido al repositorio del menú digital y sistema de gestión de staff de **Mr. Smith**.

## Características
- **Menú Digital**: Categorizado y dinámico para clientes.
- **Panel Administrativo**: Gestión de productos, precios y fotos.
- **Reloj de Jornada**: Sistema de fichaje (Inicio/Pausa/Fin) para el staff con cálculo de horas netas.
- **Jerarquía de Roles**: Control total para el Dueño sobre Gerentes y Staff.

## Instrucciones de Publicación
Este proyecto está configurado para **Static Export**, lo que permite usar el plan gratuito de Firebase Hosting.
1. Ejecuta `npm run build` para generar la carpeta `out`.
2. Sube los cambios a GitHub para que Firebase App Hosting (o tu flujo de CI/CD) despliegue el contenido de `src/app/page.tsx`.