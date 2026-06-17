# Coderhouse · Mis Ratings (web para profes)

Web donde cada profe ve **su rating por comisión** (promedio de la "guía docente" / valoración del
profesor en las clases en vivo), con comentarios anónimos y filtro de fechas. Estilo teachers.coderhouse.com.

## Estructura (lista para Vercel)
```
public/index.html        → el front (diseño Coderhouse). Llama a /api/mis-ratings; cae a demo si no hay backend.
api/mis-ratings.js        → serverless function: consulta BigQuery y devuelve solo los datos del profe.
server.js                 → solo para correr LOCAL (npm run dev). En Vercel no se usa.
package.json / .env.example / .gitignore / PROMPT
```
En Vercel, todo lo de `public/` se sirve estático y lo de `api/` se publica como función. El front pega a
`/api/mis-ratings` automáticamente. No hace falta build.

## Deploy en Vercel (lo hacés vos, como el tablero de asignaciones)
1. Subí el proyecto a Vercel (importando el repo, o `vercel` con la CLI).
2. En **Settings → Environment Variables** cargá:
   - `GCP_SA_KEY` = el **JSON completo de la service account** read-only de BigQuery (pegado tal cual).
   - `BQ_PROJECT` = `coderhouse-data`.
   - (opcional) `WINDOW_DAYS`, `MIN_VALORACIONES`.
3. Deploy. Listo: el front carga y la función lee BigQuery con esa credencial.

> La credencial vive SOLO como variable de entorno en Vercel. Nunca en el código ni en el repo
> (el `.gitignore` bloquea `.json` y `.env`).

## Autenticación / login de profes (esto lo cierran los devs)
La función responde **solo** los datos del profe identificado. Toma la identidad de, en este orden:
1. `req.user.email` (si hay middleware de sesión), 2. header `x-profe-email`, 3. `?email=` solo si
`ALLOW_QUERY_EMAIL=true` (pruebas).

Como es un sitio nuevo, **Dan/Javi tienen que pasarte el login/OAuth y el dominio** (igual que en
asignaciones). Hasta que esté el login, **no la compartas pública** con `ALLOW_QUERY_EMAIL=true`, porque
cualquiera podría consultar por email. Para probar vos: activá `ALLOW_QUERY_EMAIL=true` temporal y
protegé el deploy con la *Password Protection* de Vercel.

### Identidad con los alias +profesor (resuelto)
Los profes NO tienen cuenta @coderhouse.com; en los datos figuran con alias tipo
`nombre+profesor@gmail.com` (`+profesor/+profesora/+tutor/+tutora`). Esos alias son del **mismo buzón**
que el Gmail base (`nombre@gmail.com`). Entonces el login puede ser:
- **Google sign-in** (el profe entra con su Gmail normal) o **magic link** (Clerk). Devuelve el email
  **base**, sin el `+tag`.
- La función **normaliza el alias** (le saca el `+profesor/...`) en ambos lados antes de matchear, así el
  email del login encaja con el de staff guardado con alias. Ya está implementado y validado
  (ej.: login `aferca@gmail.com` → matchea `aferca+profesor@gmail.com`).

Lo único que tienen que hacer los devs es **conectar el login** (Google/Clerk) y pasar la identidad a la
función vía `req.user.email` o el header `x-profe-email`. El matcheo del alias ya está resuelto en el código.

## Datos (BigQuery)
Vista `coderhouse-data.Product.survey_responses` (`Live Class Rating`, `score_profesor`, `commission_number`,
`product_name`, slots `class_professor_email_1/2/3` + `profesor_email`) y `posthog_survey_responses` para
los comentarios (`event_props.comment`). La función matchea el email del profe contra los slots, agrupa por
comisión, promedia `score_profesor` (mín. `MIN_VALORACIONES`) y filtra por el período pedido
(`?dias=` o `?desde&hasta`). Comentarios: anónimos y moderados (descarta ofensivos y los que nombran a alguien).

## Correr local
```bash
npm install
# crear .env con GCP_SA_KEY=... y ALLOW_QUERY_EMAIL=true
npm run dev   # http://localhost:8080/?email=aferca+profesor@gmail.com
```

## Notas para devs
- El filtro de período hoy pide `?dias=365` y filtra en el cliente por `fechaFin` (recencia, que la API ya
  devuelve). Para el **rating recalculado exacto por período**, que el front vuelva a hacer `fetch` con
  `?dias=N` al cambiar de período (la función ya lo soporta).
- El front usa Babel en runtime (export de Claude Design). Para prod conviene pre-compilar (Vite).

## Ideas v2
- Evolución del rating en el tiempo (sparkline por comisión).
- Desglose por pregunta (guía docente vs acompañamiento) si se exponen.
