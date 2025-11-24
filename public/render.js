// public/render.js
// Módulo ES: renderiza o estado vindo do servidor usando sprites em /jet e /s-quebrada

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

let localPlayerId = null;
let latestState = {}; // objeto players vindo do server

// Config do sprite (mapa state -> sheet image + frames)
const SPRITES = {
  left: { // jogador que spawnou à esquerda (usaremos /jet)
    basePath: '/jet',
    states: {
      idle: { file: 'parado.png', frames: 4 },
      run:  { file: 'correndo.png', frames: 6 },
      jump: { file: 'salto.png', frames: 2 },
      fall: { file: 'caindo.png', frames: 2 },
      attack: { file: 'ataque.png', frames: 5 },
      hit: { file: 'hit.png', frames: 4 },
      dead: { file: 'morto.png', frames: 6 }
    }
  },
  right: { // jogador que spawnou à direita (usaremos /s-quebrada)
    basePath: '/s-quebrada',
    states: {
      idle: { file: 'parado.png', frames: 5 },
      run:  { file: 'correndo.png', frames: 3 },
      jump: { file: 'salto.png', frames: 2 },
      fall: { file: 'caindo.png', frames: 2 },
      attack: { file: 'ataque.png', frames: 5 },
      hit: { file: 'hit.png', frames: 3 },
      dead: { file: 'morto.png', frames: 6 }
    }
  }
};

// cache de imagens e estado de animação por player id
const playersRender = {}; 
// playersRender[id] = {
//   spriteSide: 'left'|'right',
//   anim: { img, framesMax, frameIndex, frameTimer, frameInterval },
//   pos: { x,y,w,h },
//   name
// }

export function setLocalPlayerId(id) {
  localPlayerId = id;
}

// chamada do server para atualizar o state (state = players object)
export function updateState(state) {
  latestState = state;

  // criar entradas de render para novos jogadores
  const ids = Object.keys(state);
  for (const id of ids) {
    if (!playersRender[id]) {
      const p = state[id];
      // decidir mídia: se x < 400 assume "left" (jet), senão "right"
      const side = (p.x && p.x < 400) ? 'left' : 'right';
      playersRender[id] = createRenderEntry(side, p);
    }
  }

  // remover jogadores que saíram
  for (const id in playersRender) {
    if (!state[id]) delete playersRender[id];
  }

  // atualizar posições & estado (não sobrepor animações ativas, apenas set state)
  for (const id of Object.keys(state)) {
    const p = state[id];
    const R = playersRender[id];
    if (!R) continue;
    R.pos.x = p.x;
    R.pos.y = p.y;
    R.pos.w = p.w || 50;
    R.pos.h = p.h || 80;
    R.name = p.name || R.name;
    // se o server reporta 'state', sinalizamos mudança de animação
    if (p.state) setAnimation(R, p.state, p.facing || 'right');
    // também controlamos health e attacking para efeitos visuais
    R.health = p.health ?? R.health;
    R.attacking = !!p.attacking;
  }
}

function createRenderEntry(side, p) {
  const conf = SPRITES[side];
  const pos = { x: p.x || 0, y: p.y || 0, w: p.w || 50, h: p.h || 80 };
  const name = p.name || 'player';

  // default animation = idle
  const stateConf = conf.states.idle;
  const img = new Image();
  img.src = conf.basePath + '/' + stateConf.file;

  return {
    spriteSide: side,
    pos,
    name,
    health: p.health ?? 100,
    attacking: p.attacking ?? false,
    anim: {
      state: 'idle',
      img,
      framesMax: stateConf.frames,
      frameIndex: 0,
      frameTimer: 0,
      frameInterval: 1000 / 10 // 10 FPS de animação por padrão
    }
  };
}

function setAnimation(renderEntry, stateName, facing) {
  const conf = SPRITES[renderEntry.spriteSide];
  const stateConf = conf.states[stateName] || conf.states.idle;
  // se já é essa animação, não reinicia (exceto se for attack, reiniciamos)
  if (renderEntry.anim.state === stateName && stateName !== 'attack') return;

  renderEntry.anim.state = stateName;
  renderEntry.anim.framesMax = stateConf.frames;
  renderEntry.anim.frameIndex = 0;
  renderEntry.anim.frameTimer = 0;
  // ajustar frame interval conforme framesMax (mais frames -> mesmo tempo total)
  renderEntry.anim.frameInterval = Math.max(40, 350 / stateConf.frames); // total ~350ms ataque
  renderEntry.anim.img = new Image();
  renderEntry.anim.img.src = conf.basePath + '/' + stateConf.file;

  // guardar facing (para flip horizontal)
  renderEntry.facing = facing === 'left' ? 'left' : 'right';
}

// desenha um jogador (com sprites em sheets ou imagens por-frame)
// Observação: seus PNGs já são imagens separadas por frame (parecem nomes únicos). 
// Mas aqui tratamos cada arquivo como um "sheet" horizontalmente composto de frames (caso não seja, as imagens ainda funcionam se cada frame for separado).
function drawPlayer(R, dt) {
  const a = R.anim;
  const img = a.img;
  const frames = a.framesMax || 1;
  const frameIndex = Math.floor(a.frameIndex);

  // avançar frameTimer
  a.frameTimer += dt;
  if (a.frameTimer >= a.frameInterval) {
    a.frameTimer = 0;
    a.frameIndex = (a.frameIndex + 1) % frames;
  }

  // Tentativa de desenhar: assumimos imagem tipo spritesheet com frames horizontais.
  // Se suas imagens não forem spritesheet, os framesMax devem ser 1 e imagem é completa.
  const srcW = img.width / Math.max(1, frames);
  const srcH = img.height;
  const sx = Math.floor(a.frameIndex) * srcW;
  const sy = 0;

  const dx = R.pos.x;
  const dy = R.pos.y;
  const dw = R.pos.w;
  const dh = R.pos.h;

  // desenhar flip se necessário
  ctx.save();
  if (R.facing === 'left') {
    // flip horizontal: translate & scale
    ctx.translate(dx + dw/2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(dx + dw/2), 0);
  }

  // se imagem ainda não carregou medidas, desenha um retângulo como fallback
  if (!img.complete || img.width === 0) {
    ctx.fillStyle = (R.spriteSide === 'left') ? '#1E90FF' : '#FF4C4C';
    ctx.fillRect(dx, dy, dw, dh);
  } else {
    try {
      ctx.drawImage(img, sx, sy, srcW, srcH, dx, dy, dw, dh);
    } catch (err) {
      // fallback
      ctx.fillStyle = (R.spriteSide === 'left') ? '#1E90FF' : '#FF4C4C';
      ctx.fillRect(dx, dy, dw, dh);
    }
  }
  ctx.restore();

  // desenhar nome
  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText(R.name, dx, dy - 8);

  // desenhar vida
  ctx.fillStyle = "black";
  ctx.fillRect(dx, dy - 18, 60, 8);
  ctx.fillStyle = "lime";
  ctx.fillRect(dx, dy - 18, Math.max(0, (R.health / 100) * 60), 8);

  // desenhar caixa de ataque quando atacando (visual)
  if (R.attacking) {
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    const ax = R.facing === 'right' ? dx + R.pos.w : dx - 40;
    ctx.strokeRect(ax, dy + 20, 40, R.pos.h - 30);
  }
}

// render loop
let lastTs = 0;
export function startRenderLoop() {
  function loop(ts) {
    const dt = Math.min(100, ts - lastTs); // ms
    lastTs = ts;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // chão
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 320, canvas.width, 80);

    // desenhar todos os players (ordenar por x poderia ser útil)
    for (const id in playersRender) {
      drawPlayer(playersRender[id], dt);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
