// public/render.js - Sistema de Renderização Simplificado
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

let localPlayerId = null;
let latestState = {};

// Carregar imagem de fundo
const backgroundImage = new Image();
backgroundImage.src = '/fundoGame.png';
let backgroundLoaded = false;

backgroundImage.onload = () => {
  backgroundLoaded = true;
  console.log("✅ Fundo carregado: fundoGame.png");
};

backgroundImage.onerror = () => {
  console.log("⚠️  Fundo não carregado, usando fallback");
  backgroundLoaded = false;
};

// Configuração SIMPLES das sprites - uma por estado
const SPRITES_CONFIG = {
  left: { // Jogador esquerdo (jet)
    basePath: '/jet',
    states: {
      idle: 'parado.png',
      run: 'correndo.png', 
      jump: 'salto.png',
      fall: 'caindo.png',
      attack: 'ataque.png',
      hit: 'hit.png',
      dead: 'morto.png'
    }
  },
  right: { // Jogador direito (s-quebrada)
    basePath: '/s-quebrada',
    states: {
      idle: 'parado.png',
      run: 'correndo.png',
      jump: 'salto.png', 
      fall: 'caindo.png',
      attack: 'ataque.png',
      hit: 'hit.png',
      dead: 'morto.png'
    }
  }
};

// Cache de imagens
const imageCache = {};
const playersRender = {};

// Função simples para carregar imagem
function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (imageCache[src]) {
      resolve(imageCache[src]);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache[src] = img;
      resolve(img);
    };
    img.onerror = () => {
      console.warn("❌ Não foi possível carregar:", src);
      reject(new Error(`Failed to load: ${src}`));
    };
    img.src = src;
  });
}

// Definir jogador local
export function setLocalPlayerId(id) {
  localPlayerId = id;
  console.log("🎮 Player local definido:", id);
}

// Atualizar estado do jogo
export function updateState(state) {
  latestState = state;

  // Atualizar ou criar jogadores
  for (const id of Object.keys(state)) {
    const playerData = state[id];
    
    if (!playersRender[id]) {
      // Novo jogador - determinar lado pelo spawn
      const side = (playerData.x < 400) ? 'left' : 'right';
      playersRender[id] = createRenderEntry(side, playerData);
      console.log(`🆕 Novo jogador: ${playerData.name} (${side})`);
    }

    const renderObj = playersRender[id];
    
    // Atualizar posição e dados
    renderObj.pos.x = playerData.x;
    renderObj.pos.y = playerData.y;
    renderObj.pos.w = playerData.w || 50;
    renderObj.pos.h = playerData.h || 80;
    renderObj.name = playerData.name;
    renderObj.health = playerData.health ?? 100;
    renderObj.facing = playerData.facing || 'right';

    // Atualizar animação se estado mudou
    if (playerData.state && playerData.state !== renderObj.currentState) {
      setPlayerState(renderObj, playerData.state);
    }
  }

  // Remover jogadores desconectados
  for (const id in playersRender) {
    if (!state[id]) {
      delete playersRender[id];
    }
  }
}

// Criar entrada de renderização
function createRenderEntry(side, playerData) {
  return {
    spriteSide: side,
    pos: { 
      x: playerData.x, 
      y: playerData.y, 
      w: playerData.w || 50, 
      h: playerData.h || 80 
    },
    name: playerData.name,
    health: playerData.health ?? 100,
    facing: playerData.facing || 'right',
    currentState: 'idle',
    currentSprite: null,
    spriteLoadPromise: null
  };
}

// Definir estado do jogador (animação)
function setPlayerState(renderObj, newState) {
  renderObj.currentState = newState;
  
  const config = SPRITES_CONFIG[renderObj.spriteSide];
  const spriteFile = config.states[newState] || config.states.idle;
  const spritePath = `${config.basePath}/${spriteFile}`;
  
  console.log(`🎬 ${renderObj.name}: ${newState} -> ${spriteFile}`);
  
  // Carregar sprite
  renderObj.spriteLoadPromise = loadImage(spritePath)
    .then(img => {
      renderObj.currentSprite = img;
    })
    .catch(error => {
      console.warn(`⚠️  Sprite não carregada: ${spritePath}`);
      renderObj.currentSprite = null;
    });
}

// Desenhar jogador
function drawPlayer(renderObj) {
  const pos = renderObj.pos;
  
  ctx.save();
  
  // Flip horizontal se virado para esquerda
  if (renderObj.facing === 'left') {
    ctx.translate(pos.x + pos.w/2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(pos.x + pos.w/2), 0);
  }

  // Desenhar sprite ou fallback
  if (renderObj.currentSprite && renderObj.currentSprite.complete) {
    try {
      ctx.drawImage(renderObj.currentSprite, pos.x, pos.y, pos.w, pos.h);
    } catch (error) {
      drawFallbackPlayer(renderObj);
    }
  } else {
    drawFallbackPlayer(renderObj);
  }

  ctx.restore();
  
  // Desenhar UI (nome e vida)
  drawPlayerUI(renderObj);
}

// Fallback visual (quando sprites não carregam)
function drawFallbackPlayer(renderObj) {
  const pos = renderObj.pos;
  const stateColors = {
    idle: '#3498db',    // Azul
    run: '#2980b9',     // Azul escuro  
    jump: '#9b59b6',    // Roxo
    fall: '#8e44ad',    // Roxo escuro
    attack: '#e74c3c',  // Vermelho
    hit: '#e67e22',     // Laranja
    dead: '#95a5a6'     // Cinza
  };
  
  const color = stateColors[renderObj.currentState] || '#3498db';
  
  // Corpo
  ctx.fillStyle = color;
  ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
  
  // Contorno
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);
  
  // Indicador de estado (debug)
  ctx.fillStyle = 'white';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(renderObj.currentState, pos.x + pos.w/2, pos.y - 5);
  ctx.textAlign = 'left';
}

// Desenhar UI do jogador (nome e vida)
function drawPlayerUI(renderObj) {
  const pos = renderObj.pos;
  
  // Nome
  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(renderObj.name, pos.x + pos.w/2, pos.y - 25);
  
  // Barra de vida
  const barWidth = 60;
  const barHeight = 6;
  const barX = pos.x + (pos.w - barWidth) / 2;
  const barY = pos.y - 20;
  
  // Fundo da barra
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Vida (cores dinâmicas)
  const healthPercent = renderObj.health / 100;
  let healthColor = "#2ecc71"; // Verde
  if (healthPercent < 0.5) healthColor = "#f39c12"; // Amarelo
  if (healthPercent < 0.25) healthColor = "#e74c3c"; // Vermelho
  
  ctx.fillStyle = healthColor;
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  
  // Borda da barra
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  // Texto da vida
  ctx.fillStyle = "white";
  ctx.font = "10px Arial";
  ctx.fillText(
    `${Math.round(renderObj.health)}%`, 
    barX + barWidth + 5, 
    barY + barHeight + 3
  );
  
  ctx.textAlign = "left";
}

// Loop de renderização
let lastTimestamp = 0;
export function startRenderLoop() {
  console.log("🎬 Iniciando loop de renderização...");
  
  function render(currentTime) {
    const deltaTime = currentTime - lastTimestamp;
    lastTimestamp = currentTime;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar fundo
    drawBackground();
    
    // Desenhar chão
    drawGround();
    
    // Desenhar jogadores (ordenados por posição X para depth)
    const sortedPlayers = Object.values(playersRender)
      .sort((a, b) => a.pos.x - b.pos.x);
    
    for (const player of sortedPlayers) {
      drawPlayer(player);
    }
    
    // Continuar loop
    requestAnimationFrame(render);
  }
  
  // Iniciar loop
  requestAnimationFrame(render);
}

// Desenhar fundo
function drawBackground() {
  if (backgroundLoaded) {
    // Preencher todo o canvas com o fundo
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    // Fallback: gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// Desenhar chão
function drawGround() {
  // Sombra do chão
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 320, canvas.width, 80);
  
  // Chão principal
  ctx.fillStyle = "#34495e";
  ctx.fillRect(0, 320, canvas.width, 80);
  
  // Linha do chão
  ctx.fillStyle = "#7f8c8d";
  ctx.fillRect(0, 320, canvas.width, 4);
}

// Função de debug para ver sprites carregadas
export function debugSprites() {
  console.log("🐞 Debug de Sprites:");
  console.log("- Imagens no cache:", Object.keys(imageCache));
  console.log("- Jogadores renderizando:", Object.keys(playersRender));
  
  for (const id in playersRender) {
    const player = playersRender[id];
    console.log(`  ${player.name}: ${player.currentState}, sprite: ${player.currentSprite ? '✅' : '❌'}`);
  }
}