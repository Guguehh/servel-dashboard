# servel-dashboard

Dashboard web para administración y seguimiento de servicios, con autenticación y datos persistidos en Supabase.

![Vista general](src/assets/servel-hero.png)

## Qué es

Aplicación tipo panel (dashboard) construida con React y TanStack Router/Start sobre Vite, con UI basada en componentes reutilizables, edición de plantillas de servicios y métricas visuales.

## Qué se ve

- Pantalla de inicio de sesión.
- Dashboard principal con KPIs y tarjetas de resumen.
- Secciones de Analytics, Servicios, Historial, Cuentas y Settings.
- Vistas de listados y detalle para servicios y categorías.
- Configuración de plantillas con precio, duración, modalidad, ubicación, urgencia y campos personalizados.

## Stack

- React + TypeScript
- TanStack Start / TanStack Router
- Vite
- Tailwind CSS
- Supabase (Auth + Database)

## Estado actual

El proyecto ya quedó reconstruido sobre una base nueva de Supabase.

- Migraciones aplicadas en remoto.
- Usuario admin sembrado en `auth.users`.
- Catálogo inicial poblado con categorías, tipos de precio, configuraciones admin y plantillas de servicio.
- La app ya fue validada contra Supabase real y no depende del fallback demo para el flujo principal.

## Datos iniciales cargados

El seed remoto deja creado lo siguiente:

- `10` categorías.
- `11` tipos de precio.
- `13` servicios/plantillas.
- `2` registros en `admin_settings`:
  - `ui`
  - `category_defaults`

## Acceso admin inicial

La migración deja creada una cuenta base para pruebas administrativas:

- Email: `admin@admin.com`
- Password: `agus1234!`

Si este proyecto se usa fuera de un entorno de prueba, conviene cambiar esa contraseña inmediatamente.

## Variables de entorno

Crear un archivo `.env` en la raíz con estas variables:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Notas:

- `.env` no debe subirse a GitHub.
- La app usa las variables `VITE_*` en frontend.
- Las verificaciones administrativas y algunas pruebas locales pueden requerir `SUPABASE_SERVICE_ROLE_KEY`.

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Cargar el archivo `.env` con las variables de Supabase.

3. Levantar el proyecto:

```bash
npm run dev
```

4. Abrir la URL que informe Vite en consola.

## Inicializar o reconstruir la base remota

Si se quiere recrear la base nueva desde cero:

1. Vincular el proyecto de Supabase:

```bash
npx supabase link --project-ref <project-ref>
```

2. Autenticarse en CLI:

```bash
npx supabase login
```

3. Aplicar migraciones y seed:

```bash
npx supabase db push --include-all
```

Las migraciones relevantes viven en `supabase/migrations`.

## Validaciones realizadas

Se verificó lo siguiente sobre la base nueva:

- Login real con `admin@admin.com`.
- Lectura autenticada de `categories`, `services`, `price_types`, `admin_settings`, `admin_change_requests` y `admin_audit_log`.
- Persistencia de configuraciones `version: 2` dentro de `quote_fields`.
- Casos especiales confirmados:
  - precio con `permiteRangos`
  - precio con `permiteMinimo`
  - duración `exacta`
  - duración tipo `turno`
  - `admin_settings` para `ui` y defaults por categoría
- Revisión de logs del navegador:
  - se corrigió el warning de React por `key` duplicada/faltante en el gráfico del dashboard
  - los `net::ERR_ABORTED` observados durante desarrollo quedaron identificados como requests canceladas por ciclos de render/navegación en dev, no como fallas reales de Supabase
  - tras los ajustes en rutas y carga inicial, esos abortos ya no se reprodujeron en una recarga limpia

## Scripts útiles

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

## Pendientes menores

Quedan algunos puntos no bloqueantes para revisar más adelante:

- Warning de chunks grandes en `vite build`.
- Warning/log de Wrangler al intentar escribir en la carpeta local de logs.
