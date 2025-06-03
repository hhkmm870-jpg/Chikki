// -------------------------------------------------
// 1) Obtención de elementos y configuraciones
// -------------------------------------------------
const cover = document.getElementById('cover');
const bgMusic = document.getElementById('bgMusic');

const heartCanvas = document.getElementById('heartCanvas');
const hCtx = heartCanvas.getContext('2d');

const heartsCanvas = document.getElementById('heartsCanvas');
const heartsCtx = heartsCanvas.getContext('2d');

// Tamaño fijo para el “spiral heart”
const heartWidth = 350;
const heartHeight = 350;
heartCanvas.width = heartWidth;
heartCanvas.height = heartHeight;

// Variables para la “lluvia” de corazoncitos fuera del círculo
let circleX, circleY, circleRadius;
function resizeHeartsCanvas() {
  heartsCanvas.width = window.innerWidth;
  heartsCanvas.height = window.innerHeight;
  updateCircleParams();
}
window.addEventListener('resize', resizeHeartsCanvas);
resizeHeartsCanvas();

function updateCircleParams() {
  const rect = document.querySelector('.heart-container').getBoundingClientRect();
  circleX = rect.left + rect.width / 2;
  circleY = rect.top + rect.height / 2;
  circleRadius = rect.width / 2;
}

// -------------------------------------------------
// 2) Código del “Spiral Heart” (sistema de partículas)
// -------------------------------------------------
let pSystemSize = 30;
let deform = { dir: 1 };
let repaintHeart = 'rgba(0,0,0,0.1)'; // Fondo semitransparente para el trail

const mcos = Math.cos,
      msin = Math.sin,
      mpow = Math.pow,
      mrandom = Math.random,
      PI180 = Math.PI / 180,
      tau = Math.PI * 2;

const ParticleSystem = function(num) {
  this.colour = '#ff0033';
  this.numParticles = num;
  this.allParticles = [];
  this.x = heartWidth * 0.5;
  this.y = heartHeight * 0.5;
  this.generate();
}

ParticleSystem.prototype.generate = function() {
  for (let i = 0; i < this.numParticles; i++) {
    let vo = {};
    vo.degrees = (360 / this.numParticles) * i * PI180;
    vo.parent = this;
    vo.scalar = 2 + (6 / this.numParticles) * i;
    vo.size = 2 + (3.5 / this.numParticles) * i;
    vo.speed = 0.01 + (0.05 / this.numParticles) * (i * 0.5);
    vo.x = heartWidth / 2;
    vo.y = heartHeight / 2;
    vo.vx = 0;
    vo.vy = 0;
    this.allParticles.push(new Particle(vo));
  }
}

ParticleSystem.prototype.update = function() {
  for (let i = 0; i < this.allParticles.length; i++) {
    this.allParticles[i].update();
  }
}

const Particle = function(vo) {
  this.degrees = vo.degrees;
  this.parent = vo.parent;
  this.scalar = vo.scalar;
  this.size = vo.size;
  this.speed = vo.speed;
  this.x = vo.x;
  this.y = vo.y;
  this.vx = 0;
  this.vy = 0;
}

Particle.prototype.update = function() {
  this.degrees += this.speed;
  this.vx = 16 * mpow(msin(this.degrees), 3) * deform.dir;
  this.vy = (
    (13 * mcos(this.degrees)) -
    (6  * mcos(2 * this.degrees)) -
    (2  * mcos(3 * this.degrees)) -
    (1  * mcos(4 * this.degrees))
  ) * -1;
  this.x = this.vx * this.scalar + this.parent.x;
  this.y = this.vy * this.scalar + this.parent.y;
}

function updateHeart() {
  system.update();
}

function drawHeart() {
  // 1) “Trail” semitransparente en negro
  hCtx.fillStyle = repaintHeart;
  hCtx.fillRect(0, 0, heartWidth, heartHeight);

  // 2) Dibujar partículas del corazón
  hCtx.fillStyle = system.colour;
  for (let i = 0; i < system.numParticles; i++) {
    let p = system.allParticles[i];
    hCtx.beginPath();
    hCtx.arc(p.x, p.y, p.size, 0, tau, false);
    hCtx.fill();
  }
}

let system = new ParticleSystem(pSystemSize);

// -------------------------------------------------
// 3) Letras que emergen desde el centro del corazón
// -------------------------------------------------
const letters = "ERES LA NIÑA MAS HERMOSA Y VALIENTE ESTOY ORGULLOSO DE TI";
let letterParticles = [];
let letterIndex = 0;
let frameCount = 0;

class LetterParticle {
  constructor(char, x, y, vx, vy) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.alpha = 1;
    this.size = 28;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.01;
  }
  draw(ctx) {
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.font = `${this.size}px Courier New`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(this.char, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

function spawnLetter() {
  const char = letters[letterIndex];
  letterIndex = (letterIndex + 1) % letters.length;
  const x = heartWidth / 2 + (mrandom() * 40 - 20);
  const y = heartHeight / 2;
  const vx = mrandom() * 1 - 0.5;
  const vy = -1 - mrandom();
  letterParticles.push(new LetterParticle(char, x, y, vx, vy));
}

function updateLetters() {
  frameCount++;
  if (frameCount % 30 === 0) {
    spawnLetter();
  }
  for (let i = letterParticles.length - 1; i >= 0; i--) {
    const lp = letterParticles[i];
    lp.update();
    if (lp.alpha <= 0 || lp.y < -20) {
      letterParticles.splice(i, 1);
    }
  }
}

function drawLetters(ctx) {
  for (let i = 0; i < letterParticles.length; i++) {
    letterParticles[i].draw(ctx);
  }
}

// -------------------------------------------------
// 4) Corazoncitos “lloviendo” fuera del círculo
// -------------------------------------------------
class HeartRainParticle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * -window.innerHeight;
    this.size = 10 + Math.random() * 15; // 10px–25px
    this.vy = 1 + Math.random() * 2;     // Velocidad 1–3
    const colors = ["#ff6994", "#ff4e50", "#ff6f61", "#ff8fb0"];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  update() {
    this.y += this.vy;
    if (this.y > window.innerHeight + this.size) {
      this.reset();
    }
  }
  draw(ctx) {
    const distX = this.x - circleX;
    const distY = this.y - circleY;
    // Solo dibujar si NO está dentro del círculo central
    if ((distX * distX + distY * distY) >= (circleRadius * circleRadius)) {
      drawHeartShape(ctx, this.x, this.y, this.size, this.color);
    }
  }
}

function drawHeartShape(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  // Lado izquierdo superior
  ctx.bezierCurveTo(
    x, y,
    x - size / 2, y,
    x - size / 2, y + topCurveHeight
  );
  // Parte inferior izquierda
  ctx.bezierCurveTo(
    x - size / 2, y + (size + topCurveHeight) / 2,
    x, y + (size + topCurveHeight) / 2,
    x, y + size
  );
  // Parte inferior derecha
  ctx.bezierCurveTo(
    x, y + (size + topCurveHeight) / 2,
    x + size / 2, y + (size + topCurveHeight) / 2,
    x + size / 2, y + topCurveHeight
  );
  // Lado derecho superior
  ctx.bezierCurveTo(
    x + size / 2, y,
    x, y,
    x, y + topCurveHeight
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const rainCount = 50;
let rainParticles = [];
for (let i = 0; i < rainCount; i++) {
  rainParticles.push(new HeartRainParticle());
}

function updateRain() {
  for (let p of rainParticles) {
    p.update();
  }
}

function drawRain() {
  heartsCtx.clearRect(0, 0, heartsCanvas.width, heartsCanvas.height);
  for (let p of rainParticles) {
    p.draw(heartsCtx);
  }
}

// -------------------------------------------------
// 5) Función para arrancar todo (música + animaciones)
// -------------------------------------------------
let started = false;
function startEverything() {
  if (started) return;
  started = true;

  // 5.1) Ocultar la portada
  cover.style.display = 'none';

  // 5.2) Reproducir la música
  bgMusic.play().catch(() => {
    console.log('Autoplay bloqueado: Jeline debe interactuar con el reproductor para escuchar la música.');
  });

  // 5.3) Iniciar animaciones
  animate();
}

// Cuando Jeline haga clic en la portada, arrancamos todo
cover.addEventListener('click', startEverything);

// -------------------------------------------------
// 6) Bucle principal de animación
// -------------------------------------------------
function animate() {
  // 6.1) Lluvia de corazoncitos (heartsCanvas)
  updateRain();
  drawRain();

  // 6.2) Spiral heart (heartCanvas)
  updateHeart();
  drawHeart();

  // 6.3) Letras ascendentes (heartCanvas)
  updateLetters();
  drawLetters(hCtx);

  requestAnimationFrame(animate);
}
