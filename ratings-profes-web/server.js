/**
 * Servidor LOCAL para desarrollo (no se usa en Vercel; allá corre api/mis-ratings.js como serverless).
 * Sirve public/ y enruta GET /api/mis-ratings a la misma función.
 *   npm install && npm run dev   →  http://localhost:8080
 */
const express = require("express");
const path = require("path");
const handler = require("./api/mis-ratings");

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/mis-ratings", (req, res) => handler(req, res));
app.get("/healthz", (_req, res) => res.send("ok"));
app.listen(PORT, () => console.log(`Mis Ratings (local) en http://localhost:${PORT}`));
