/**
 * Vercel Serverless Function — GET /api/mis-ratings
 * Devuelve el rating del profe por comisión desde BigQuery.
 * Filtro de fechas: ?dias=30|90|180|365|0  o  ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 *
 * Credencial de BigQuery: variable de entorno GCP_SA_KEY = el JSON de la service account (pegado completo).
 * Auth del profe: req.headers['x-profe-email'] o req.user (lo setea el login/OAuth que wiran los devs).
 *   En pruebas: ALLOW_QUERY_EMAIL=true permite ?email=  (NO usar en producción pública).
 */
const { BigQuery } = require("@google-cloud/bigquery");

const PROJECT = process.env.BQ_PROJECT || "coderhouse-data";
const DEFAULT_DAYS = parseInt(process.env.WINDOW_DAYS || "365", 10);
const MAX_DAYS = parseInt(process.env.MAX_DAYS || "3650", 10);
const MIN_VAL = parseInt(process.env.MIN_VALORACIONES || "3", 10);

function bqClient() {
  const opts = { projectId: PROJECT };
  if (process.env.GCP_SA_KEY) opts.credentials = JSON.parse(process.env.GCP_SA_KEY);
  return new BigQuery(opts);
}

function resolveProfeEmail(req) {
  if (req.user && req.user.email) return String(req.user.email).trim().toLowerCase();
  const h = req.headers && (req.headers["x-profe-email"] || req.headers["X-Profe-Email"]);
  if (h) return String(h).trim().toLowerCase();
  if (process.env.ALLOW_QUERY_EMAIL === "true" && req.query && req.query.email)
    return String(req.query.email).trim().toLowerCase();
  return null;
}

function resolveRange(q = {}) {
  const isISO = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  if (isISO(q.desde) && isISO(q.hasta)) return { from: q.desde, to: q.hasta };
  let dias = parseInt(q.dias, 10);
  if (isNaN(dias)) dias = DEFAULT_DAYS;
  if (dias <= 0 || dias > MAX_DAYS) dias = MAX_DAYS;
  return { from: new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10), to: null };
}

const OFENSIVO = /\b(mierda|basura|asco|asqueros\w*|idiota|est[uú]pid\w*|in[uú]til|p[eé]sim\w*|desastr\w*|verg[uü]enza|horrend\w*|incompetent\w*|imb[eé]cil|pelotud\w*|bolud\w*|forr\w*|garca|chant\w*|nefast\w*|odi[ao]\w*)\b/i;
const NOMBRA = /\b(profe|profesor|profesora|tutor|tutora)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/;
function clean(t) {
  if (!t) return null;
  const s = t.replace(/\s+/g, " ").trim();
  if (s.length < 8 || s.length > 320) return null;
  if (OFENSIVO.test(s) || NOMBRA.test(s)) return null;
  return s;
}

// Quita el alias +profesor/+profesora/+tutor/+tutora (y cualquier +tag) antes de la @,
// para que el email del login (base) matchee con el email de staff guardado con alias.
const sinAlias = e => (e || "").toLowerCase().replace(/\+[^@]*@/, "@");

module.exports = async (req, res) => {
  const emailRaw = resolveProfeEmail(req);
  if (!emailRaw) return res.status(401).json({ error: "no_identity", msg: "Falta identidad del profe (login)." });
  const email = sinAlias(emailRaw);
  const { from, to } = resolveRange(req.query || {});
  const toA = to ? "AND DATE(created_at) <= @to" : "";
  const toB = to ? "AND DATE(s.created_at) <= @to" : "";
  const params = to ? { email, from, to, minval: MIN_VAL } : { email, from, minval: MIN_VAL };

  const query = `
    WITH live AS (
      SELECT commission_number AS comision, product_name AS curso, score_profesor, DATE(created_at) AS fecha,
             REGEXP_REPLACE(LOWER(class_professor_email_1), r'\\+[^@]*@', '@') ne1,
             REGEXP_REPLACE(LOWER(class_professor_email_2), r'\\+[^@]*@', '@') ne2,
             REGEXP_REPLACE(LOWER(class_professor_email_3), r'\\+[^@]*@', '@') ne3,
             REGEXP_REPLACE(LOWER(profesor_email), r'\\+[^@]*@', '@') ne0,
             class_professor_name_1 n1, class_professor_name_2 n2, class_professor_name_3 n3, profesor n0
      FROM \`${PROJECT}.Product.survey_responses\`
      WHERE survey_name='Live Class Rating' AND score_profesor IS NOT NULL AND commission_number IS NOT NULL
        AND DATE(created_at) >= @from ${toA}
    ),
    mine AS (
      SELECT comision, curso, score_profesor, fecha,
             CASE WHEN ne1=@email THEN n1 WHEN ne2=@email THEN n2 WHEN ne3=@email THEN n3 ELSE n0 END AS profe_nombre
      FROM live WHERE @email IN (ne1,ne2,ne3,ne0)
    )
    SELECT comision, ANY_VALUE(curso) curso, ANY_VALUE(profe_nombre) profe_nombre,
           COUNT(*) n, ROUND(AVG(score_profesor),2) rating,
           FORMAT_DATE('%b %Y', MIN(fecha)) || '–' || FORMAT_DATE('%b %Y', MAX(fecha)) AS periodo,
           FORMAT_DATE('%Y-%m-%d', MAX(fecha)) AS fechaFin
    FROM mine GROUP BY comision HAVING COUNT(*) >= @minval ORDER BY n DESC`;

  const qComments = `
    WITH live AS (
      SELECT s.commission_number AS comision, s.score_profesor AS score,
             TRIM(JSON_EXTRACT_SCALAR(p.event_props,'$.comment')) AS comentario,
             LOWER(s.class_professor_email_1) e1, LOWER(s.class_professor_email_2) e2,
             LOWER(s.class_professor_email_3) e3, LOWER(s.profesor_email) e0
      FROM \`${PROJECT}.Product.posthog_survey_responses\` p
      JOIN \`${PROJECT}.Product.survey_responses\` s ON s.uuid = p.uuid
      WHERE p.survey_name='Live Class Rating' AND JSON_EXTRACT_SCALAR(p.event_props,'$.comment') IS NOT NULL
        AND DATE(s.created_at) >= @from ${toB}
    )
    SELECT comision, score, comentario FROM live
    WHERE @email IN (
      REGEXP_REPLACE(e1, r'\\+[^@]*@', '@'), REGEXP_REPLACE(e2, r'\\+[^@]*@', '@'),
      REGEXP_REPLACE(e3, r'\\+[^@]*@', '@'), REGEXP_REPLACE(e0, r'\\+[^@]*@', '@')
    ) AND LENGTH(comentario) >= 8 ORDER BY comision, score DESC`;

  try {
    const bq = bqClient();
    const [rows] = await bq.query({ query, params });
    const comentariosPorComision = {};
    try {
      const [crows] = await bq.query({ query: qComments, params });
      for (const c of crows) {
        const txt = clean(c.comentario);
        if (!txt) continue;
        (comentariosPorComision[c.comision] ||= []).push({ t: txt, tipo: Number(c.score) >= 4 ? "pos" : "neg" });
      }
    } catch (e) { console.error("comentarios BQ error:", e.message); }

    const profe = (rows.find(r => r.profe_nombre) || {}).profe_nombre || email;
    res.setHeader("Cache-Control", "private, max-age=300");
    res.status(200).json({
      profe: (profe || "").replace(/^\[[^\]]+\]\s*/, ""),
      email, rango: { desde: from, hasta: to },
      comisiones: rows.map(r => ({
        curso: r.curso, comision: r.comision, rating: Number(r.rating), n: r.n,
        periodo: r.periodo, fechaFin: r.fechaFin,
        comentarios: (comentariosPorComision[r.comision] || []).slice(0, 3),
      })),
    });
  } catch (err) {
    console.error("BQ error:", err.message);
    res.status(500).json({ error: "bq_error", msg: "No se pudieron leer los ratings." });
  }
};
