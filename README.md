# servel-dashboard

Dashboard web para administración y seguimiento de servicios, con autenticación y datos persistidos en Supabase.

![Vista general](src/assets/servel-hero.png)

## Qué es

Aplicación tipo panel (dashboard) construida con React y TanStack Router/Start sobre Vite, con UI basada en componentes reutilizables y métricas/visualizaciones.

## Qué se ve

- Pantalla de inicio de sesión.
- Dashboard principal con KPIs y tarjetas de resumen.
- Secciones de Analytics, Servicios y Settings.
- Vistas de listados y detalle (por ejemplo: servicios y categorías).

## Stack

- React + TypeScript
- TanStack Start / TanStack Router
- Vite
- Tailwind CSS
- Supabase (auth + base de datos)

## Ejecutar en local

1) Instalar dependencias:

```bash
npm install
```

2) Crear un archivo `.env` en la raíz con las variables (no se sube a GitHub):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

3) Levantar el proyecto:

```bash
npm run dev
```

## Scripts útiles

```bash
npm run build
npm run preview
npm run lint
npm run format
```
