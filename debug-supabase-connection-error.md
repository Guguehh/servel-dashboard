# Debug Session: supabase-connection-error

- Status: CLOSED
- Fecha inicial: 2026-05-04
- Última actualización: 2026-06-25
- Síntoma inicial: errores `ERR_NAME_NOT_RESOLVED` y `Failed to fetch` al conectar con Supabase desde la app local.
- Contexto inicial: falla login/auth y varias consultas `rest/v1/*`; también aparece un warning separado de React sobre `key` faltante.

## Hipótesis iniciales

1. La URL de Supabase configurada en `.env` apunta a un host inexistente o mal escrito.
2. Hay un problema de DNS/red local y el dominio de Supabase no resuelve desde esta máquina.
3. La app está levantando con variables de entorno vacías o viejas y el cliente de Supabase queda mal inicializado.
4. El warning de React sobre `key` faltante es independiente del error de base de datos y no es la causa del fallo de conexión.

## Evidencia disponible

- Consola del navegador:
  - `net::ERR_NAME_NOT_RESOLVED https://qcixlgspdaoyywxmdoeu.supabase.co/...`
  - `TypeError: Failed to fetch`
- `nslookup qcixlgspdaoyywxmdoeu.supabase.co`:
  - `Non-existent domain`
- `Invoke-WebRequest https://qcixlgspdaoyywxmdoeu.supabase.co`:
  - `The remote name could not be resolved`
- No existe archivo `.env*` en la raíz del proyecto.
- Las variables del terminal están vacías:
  - `VITE_SUPABASE_URL=`
  - `SUPABASE_URL=`
- El `project_id` aparece en `supabase/config.toml` como `qcixlgspdaoyywxmdoeu`.

## Análisis

- Hipótesis 1: confirmada parcialmente. El host configurado/apuntado no existe.
- Hipótesis 2: descartada como problema general de red; la evidencia apunta a un dominio inexistente, no a un timeout genérico.
- Hipótesis 3: probable. Falta `.env` local y la app está usando una URL embebida o previa que apunta a un proyecto inválido.
- Hipótesis 4: confirmada. El warning de React por `key` faltante es independiente del problema de base de datos.

## Próximo paso

- Corregir la URL/key de Supabase en `.env` con credenciales válidas del proyecto real y reiniciar Vite.

## Fix aplicado

- Se cargó `.env` local con:
  - `VITE_SUPABASE_URL=https://htculyxgepcxjevhcfwn.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=...`
  - `SUPABASE_URL=https://htculyxgepcxjevhcfwn.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
- Se reinició Vite y el proyecto volvió a levantar en `http://127.0.0.1:5173/`.
- `nslookup htculyxgepcxjevhcfwn.supabase.co` ahora resuelve correctamente.

## Estado actual

- Error de DNS/Supabase: resuelto.
- Warning remanente: React avisa un `key` faltante en un gráfico (`Area`), independiente de la conexión a base.

## Continuación del trabajo

Una vez resuelto el host/DNS, el siguiente problema real fue que la base nueva existía pero estaba vacía desde el punto de vista del proyecto:

- las tablas `categories`, `services` y `price_types` no estaban creadas aún;
- la app podía caer en fallback demo si la estructura no existía;
- el proyecto de Supabase estaba nuevo y sin el esquema del repositorio.

## Acciones realizadas después del fix de conexión

1. Se instaló la skill de Supabase:
   - `npx --yes skills add supabase/agent-skills -g -y`
2. Se vinculó el proyecto correcto en Supabase CLI.
3. Se revisaron todas las migraciones de `supabase/migrations`.
4. Se corrigió la migración del usuario admin para que funcione en Supabase Cloud:
   - se agregó `create extension if not exists pgcrypto;`
   - se reemplazó `crypt(..., gen_salt(...))` por `extensions.crypt(..., extensions.gen_salt(...))`
5. Se agregó un seed remoto nuevo y persistente para poblar la base con el contenido del proyecto.
6. Se ejecutó `npx supabase db push --include-all`.

## Resultado final del push

La base remota quedó con:

- `10` categorías
- `11` tipos de precio
- `13` servicios/plantillas
- `2` registros en `admin_settings`
- tablas de workflow admin creadas

Además:

- el login con `admin@admin.com` quedó operativo;
- la lectura autenticada desde la app quedó validada;
- la app local ya levanta apuntando al proyecto nuevo de Supabase.

## Verificaciones hechas

- `supabase db push --include-all`: OK
- login real con `admin@admin.com`: OK
- conteos remotos:
  - `categories = 10`
  - `services = 13`
  - `price_types = 11`
  - `admin_settings = 2`
  - `admin_change_requests = 0`
  - `admin_audit_log = 0`
- `npm run build`: OK

## Pendientes menores

- revisar el warning de chunks grandes que informa Vite al compilar;
- revisar el warning/log de Wrangler por la carpeta local de logs;
- se corrigió el warning de React por `key` en el gráfico del dashboard;
- los `net::ERR_ABORTED` que seguían apareciendo en DevTools se depuraron con evidencia runtime y quedaron atribuidos a requests canceladas durante ciclos de render/navegación en desarrollo, no a una caída real de Supabase;
- tras limpiar render redundante en `/`, reducir requests secundarias del dashboard y eliminar chequeos redundantes al cargar, esos abortos ya no se reprodujeron en una recarga limpia.
