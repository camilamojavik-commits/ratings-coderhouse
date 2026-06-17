# Prompt para Claude — Web "Mis Ratings" para profes de Coderhouse

> Pegá todo lo que está debajo de la línea en Claude. Está pensado para que genere un artifact
> (React de un solo archivo, con datos de ejemplo) con el branding real de Coderhouse.

---

Quiero que diseñes y construyas una **web app de una sola página** llamada **"Mis Ratings"** para los
**profes de Coderhouse** (una edtech). Cada profe entra y ve **su rating por comisión** (qué tan bien
valoran sus clases los estudiantes), con comentarios y un filtro de fechas. Es un espacio personal,
motivador y claro — no un panel de control frío.

Construilo como **un único archivo React** (artifact), con **datos de ejemplo (mock) ya incluidos** para
que se vea funcionando, y **TODO el texto en español**. Usá Tailwind para estilos. No uses localStorage.

## 1. Qué muestra la web (estructura y secciones)

1. **Top bar** fija y finita, fondo Negro carbón `#171717`: a la izquierda el wordmark "Coderhouse"
   (con un puntito/sol naranja antes del nombre evocando la "O = sol" de la marca) y a la derecha el
   texto "Mis Ratings · Staff Académico". Sutil.
2. **Hero** sobre fondo claro: a la izquierda un **anillo de progreso circular** animado que muestra el
   **rating general** (promedio ponderado por nº de valoraciones, sobre 5). A la derecha: saludo
   "Hola, [Nombre del profe]", una frase corta que explique que es el promedio de la **valoración de la
   guía docente** de sus clases en vivo, y dos métricas grandes: **# de comisiones** y **# de
   valoraciones**. El anillo debe animar desde 0 hasta el valor al cargar.
3. **Barra de filtro de fechas** (sticky al hacer scroll): chips de período rápido — **30 días · 90 días
   · 6 meses · 12 meses · Todo** (el activo resaltado) — y a la derecha un **rango personalizado**
   (desde / hasta + botón "Aplicar"). Al cambiar el filtro, todo se recalcula con una transición suave
   (rating general, comisiones, comentarios) y aparece un pequeño "skeleton/loading" mientras "carga".
4. **Grid de comisiones** (cards, 2 columnas en desktop, 1 en mobile). Cada card:
   - Curso (titular) + "Comisión {número} · {período, ej. may–jun 2026}".
   - Un **badge de estado** según el rating: **Excelente** (≥4.5, verde), **Bien** (≥4, ámbar),
     **A mejorar** (<4, rojo suave).
   - El **rating** en número grande (2 decimales) + "/ 5", estrellas, y una **barra de progreso**
     finita proporcional al rating.
   - "{n} valoraciones".
   - **Comentarios de tus estudiantes**: hasta 3 citas **anónimas** (sin nombres), cada una con un
     borde-acento a la izquierda (verde si es positiva, ámbar si es constructiva) y la firma
     "— Estudiante (anónimo)". Si una comisión tiene muchos comentarios, mostrá 2-3 y un botón
     "Ver más" que despliega el resto con animación.
5. **Estado vacío** prolijo cuando el filtro no tiene datos ("No hay valoraciones en el período elegido").
6. **Footer** chico: aclara que se muestran comisiones con ≥3 valoraciones, que los comentarios son
   anónimos y moderados (no se publican mensajes ofensivos), y un contacto a "Operaciones Académicas".

## 2. Identidad visual — Branding Coderhouse (usalo con precisión)

**Concepto de marca: "el horizonte"** — una marca que avanza, proyección hacia el futuro, con calidez y
cercanía. La "O" de Coderhouse es un sol sobre el horizonte. Traducí eso a: líneas horizontales suaves,
un sol/anillo naranja como elemento protagonista, gradientes cálidos tipo amanecer/atardecer usados con
moderación (no saturar).

**Tipografía:**
- **Titulares / números destacados:** `BN Hightide` (fuente display de la marca). Como probablemente no
  esté disponible en el entorno, usá como sustituto una grotesca display de peso fuerte (por ejemplo
  `Space Grotesk` o `Archivo` 700/800 desde Google Fonts) y dejá un comentario indicando que en
  producción va **BN Hightide**.
- **Texto y UI:** `Plus Jakarta Sans` (Google Fonts), pesos 400/500/600/700.

**Paleta (hex exactos del Brandbook):**
- Primario — Naranja "Horizonte": **`#FF632B`** (color protagonista). Rampa: alba `#FFEDEA`,
  cálido `#FFB0A3`, horizonte `#FF632B`, atardecer `#C04200`, ocaso `#692000`, brasa `#260700`.
- Acento Rosa: `#FE64A3` (rampa `#FFECF1`, `#FEB0CA`, `#FE64A3`, `#D9077A`).
- Acento Amarillo: `#FE872D` (rampa `#FFEDE8`, `#FEBEA4`, `#FE872D`, `#BC5F09`).
- **Gradiente "horizonte"** (para el anillo del rating, detalles y el sol): de Rosa `#FE64A3` →
  Naranja `#FF632B` → Amarillo `#FE872D`. Usalo como acento, no como fondo de página.
- Neutros: Blanco lienzo `#F8F2E8` (fondo general cálido), Gris niebla `#BBBBBB`, Gris piedra `#868686`,
  Gris acero `#585858`, Gris grafito `#313131`, Negro carbón `#171717` (texto principal / top bar).
- Estados: verde `#1f9d62`, ámbar `#d99405`, rojo suave `#e0564a` (para los badges Excelente/Bien/A mejorar).

**Estilo visual:** limpio, cálido, con aire. Cards blancas (`#ffffff`) sobre fondo Blanco lienzo
`#F8F2E8`, bordes finos, esquinas redondeadas (radios 14–18px), sombras muy sutiles. Plano y moderno,
sin ruido. El gradiente horizonte aparece en el anillo y en pequeños detalles, nunca tapando el contenido.

## 3. UX: que sea dinámica, canchera y ágil

- **Microinteracciones**: hover en cards (leve elevación), chips con transición de color, el anillo de
  rating anima al cargar y al cambiar de filtro, las barras de progreso crecen con easing.
- **Filtro instantáneo**: cambiar período no recarga la página; transición suave + skeleton breve.
- **Animación de entrada**: las cards aparecen con un fade/slide escalonado (stagger).
- **Feedback claro**: estados de loading (skeleton), vacío y error bien resueltos.
- **Responsive impecable**: mobile-first; en celular las cards van a 1 columna, el filtro se adapta, todo
  legible. Tamaño de fuente nunca menor a 12px.
- **Accesibilidad**: contraste suficiente, foco visible, labels en inputs, navegable por teclado.
- **Tono**: cercano y motivador. Un buen rating se siente como un logro; uno bajo se presenta como
  oportunidad de mejora, nunca punitivo.

## 4. Forma de los datos (así llegan desde el backend, usalo para el mock)

La página consume un endpoint `GET /api/mis-ratings?dias=365` (o `?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`)
que devuelve un JSON con esta forma. Generá un objeto mock con 3–4 comisiones realistas:

```json
{
  "profe": "Fernando Cabana",
  "rango": { "desde": "2025-06-16", "hasta": null },
  "comisiones": [
    {
      "curso": "Data Analytics",
      "comision": "90970",
      "rating": 4.69,
      "n": 62,
      "periodo": "may–jun 2026",
      "comentarios": [
        { "t": "Estoy mucho más orientada en esta comisión, se nota la preparación de cada clase.", "tipo": "pos" },
        { "t": "Buenas explicaciones, aunque me costó seguir el ritmo en la parte de SQL.", "tipo": "neg" }
      ]
    }
  ]
}
```

- `tipo`: `"pos"` (positivo, acento verde) o `"neg"` (constructivo, acento ámbar).
- El **rating general** del hero = promedio de `rating` ponderado por `n` de las comisiones visibles.
- Mostrá solo comisiones con `n >= 3`.
- Dejá el `fetch` real escrito (a `/api/mis-ratings`) pero con **fallback al mock** si falla, así el
  artifact se ve funcionando sin backend.

## 5. Qué NO hacer

- No uses fondos oscuros o gradientes saturados como fondo de página (el fondo es Blanco lienzo claro).
- No muestres nombres de estudiantes ni de otros profes; los comentarios son siempre anónimos.
- No inventes métricas que no estén en los datos (nada de "ranking entre profes" ni comparaciones con otros).
- Nada de emojis en la UI; usá iconografía de línea sobria si necesitás íconos.
- No recargues la página al filtrar; todo en cliente con transiciones.

Entregá el componente React completo en un solo archivo, con los datos mock incluidos, los colores y
tipografías de arriba ya aplicados, y listo para previsualizar.
