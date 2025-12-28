# Integración Completa

FASE 1: INTEGRACIÓN VISUAL
1. Analiza estructura actual del proyecto
2. Identifica archivos de landing existentes (NO TOCAR)
3. Crea carpeta `src/pages/dashboards/`
4. Mueve archivos de dashboards (de Google AI Studio) a esa carpeta
5. Instala React Router v6 si no existe
6. Configura rutas sin modificar componentes existentes:
   - / → Home
   - /login → LoginPage
   - /dashboard/atleta → AtletaDashboard
   - /dashboard/coach → CoachDashboard
7. Verifica build: `npm run build`
8. Prueba navegación manualmente
9. Commit: "feat: integrate dashboard routing"

VERIFICACIÓN:
- Landing funciona en /
- Dashboards accesibles en sus rutas
- Cero errores de TypeScript
- Cero warnings de build
- Estilos consistentes (mismo sistema de diseño)

NO CONTINÚES hasta que FASE 1 esté 100% funcional.
