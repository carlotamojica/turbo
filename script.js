const dvd = document.getElementById("dvd");
const logoA = document.querySelector(".logo-a");
const logoB = document.querySelector(".logo-b");

let showA = true;
let rotation = 0;

/* -------------------------------
   POSICIÓN Y VELOCIDAD
-------------------------------- */
let x = 0;
let y = 0;

let vx = 3;
let vy = 3;

/* velocidad base (magnitud) */
const BASE_SPEED = Math.hypot(vx, vy);

/* -------------------------------
   TAMAÑO
-------------------------------- */
let dvdWidth = 0;
let dvdHeight = 0;

/* -------------------------------
   PARÁMETROS FÍSICOS
-------------------------------- */
const MAX_SPEED = 30;
const THROW_MULT = 50;

/* retorno al estado base */
const RETURN_EASE = 0.01;
const RETURN_DELAY = 500;
let lastThrowTime = 0;

/* -------------------------------
   DRAG
-------------------------------- */
let isDragging = false;
let points = [];

/* -------------------------------
   RENDIMIENTO (Safari)
-------------------------------- */
let lastFrame = 0;
const FRAME_INTERVAL = 1000 / 120;

/* -------------------------------
   HELPERS
-------------------------------- */
function updateSizes() {
  dvdWidth = dvd.offsetWidth;
  dvdHeight = dvd.offsetHeight;
}

function toggleLogo() {
  showA = !showA;
  logoA.style.display = showA ? "block" : "none";
  logoB.style.display = showA ? "none" : "block";
}

function clampSpeed() {
  const speed = Math.hypot(vx, vy);
  if (speed > MAX_SPEED) {
    const k = MAX_SPEED / speed;
    vx *= k;
    vy *= k;
  }
}

/* -------------------------------
   DRAG EVENTS
-------------------------------- */
dvd.addEventListener("pointerdown", (e) => {
  isDragging = true;
  dvd.setPointerCapture(e.pointerId);
  points = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
});

window.addEventListener("pointermove", (e) => {
  if (!isDragging) return;

  const last = points[points.length - 1];
  const dx = e.clientX - last.x;
  const dy = e.clientY - last.y;

  x += dx;
  y += dy;

  points.push({ x: e.clientX, y: e.clientY, t: performance.now() });

  while (
    points.length > 2 &&
    points[points.length - 1].t - points[0].t > 120
  ) {
    points.shift();
  }

dvd.style.transform = `
  translate(${x}px, ${y}px)
  rotate(${rotation}deg)
`;
});

window.addEventListener("pointerup", () => {
  if (!isDragging) return;
  isDragging = false;

  if (points.length >= 2) {
    const a = points[0];
    const b = points[points.length - 1];

    vx = (b.x - a.x) * THROW_MULT;
    vy = (b.y - a.y) * THROW_MULT;

    clampSpeed();
    lastThrowTime = performance.now();
  }

  points = [];
});

window.addEventListener("pointercancel", () => {
  isDragging = false;
  points = [];
});

/* -------------------------------
   ANIMACIÓN
-------------------------------- */
function animate(time) {
  if (time - lastFrame < FRAME_INTERVAL) {
    requestAnimationFrame(animate);
    return;
  }
  lastFrame = time;

  if (!dvdWidth || !dvdHeight) {
    updateSizes();
    requestAnimationFrame(animate);
    return;
  }

  if (!isDragging) {
    x += vx;
    y += vy;

    // retorno suave manteniendo dirección
    if (time - lastThrowTime > RETURN_DELAY) {
      const speed = Math.hypot(vx, vy);

      if (speed > 0) {
        const newSpeed =
          speed + (BASE_SPEED - speed) * RETURN_EASE;

        const nx = vx / speed;
        const ny = vy / speed;

        vx = nx * newSpeed;
        vy = ny * newSpeed;
      }
    }
  }

  const w = window.innerWidth;
  const h = window.innerHeight;

  if (x <= 0 || x + dvdWidth >= w) {
    vx *= -1;
    toggleLogo();
  }

  if (y <= 0 || y + dvdHeight >= h) {
    vy *= -1;
    toggleLogo();
  }

  x = Math.max(0, Math.min(w - dvdWidth, x));
  y = Math.max(0, Math.min(h - dvdHeight, y));

rotation += (Math.abs(vx) + Math.abs(vy)) * 0.3;

dvd.style.transform = `
  translate(${x}px, ${y}px)
  rotate(${rotation}deg)
`;
  requestAnimationFrame(animate);
}

/* -------------------------------
   INIT
-------------------------------- */
window.addEventListener("load", () => {
  updateSizes();

  x = Math.random() * (window.innerWidth - dvdWidth);
  y = Math.random() * (window.innerHeight - dvdHeight);

  animate();
});

window.addEventListener("resize", updateSizes);