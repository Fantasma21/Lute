import express from "express";
import http from "http";
import { Server } from "socket.io";

// Configurações do jogo
const ATTACK_DURATION = 0.35; // duração total do ataque em segundos
const ATTACK_ACTIVE_WINDOW_START = 0.12; // janela de hit começa em 120ms
const ATTACK_ACTIVE_WINDOW_END = 0.20;   // janela de hit termina em 200ms

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

// Constantes de simulação
const TICK_RATE = 60; // ticks por segundo
const DT = 1 / TICK_RATE;
const GRAVITY = 1200; // px/s^2
const GROUND_Y = 320; // posição Y do chão
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 80;

const rooms = {}; // rooms[roomId] = { players: {}, inputs: {}, running: boolean }

// Criar uma nova sala
function createRoom(roomId) {
  rooms[roomId] = {
    players: {},
    inputs: {},
    running: true,
    loopInterval: null
  };
  console.log(`🆕 Sala criada: ${roomId}`);
}

// Verificar colisão AABB (Axis-Aligned Bounding Box)
function aabbCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Verificar se o jogo terminou
function checkGameOver(roomId, players) {
  const playerList = Object.values(players);
  const alivePlayers = playerList.filter(p => p.health > 0);
  
  // Jogo termina se só tiver 1 jogador vivo
  if (alivePlayers.length === 1 && playerList.length === 2) {
    const winner = alivePlayers[0];
    const loser = playerList.find(p => p.health <= 0);
    
    console.log(`🏆 Fim de jogo na sala ${roomId}! Vencedor: ${winner.name}`);
    
    // Notificar todos os jogadores
    io.to(roomId).emit("game-over", {
      winner: winner.id,
      loser: loser.id,
      winnerName: winner.name
    });
    
    // Parar o loop do jogo
    const room = rooms[roomId];
    if (room && room.loopInterval) {
      clearInterval(room.loopInterval);
      room.loopInterval = null;
      room.running = false;
    }
    
    return true;
  }
  
  return false;
}

io.on("connection", socket => {
  console.log("🔗 Conectado:", socket.id);

  // Entrar em uma sala
  socket.on("join-room", ({ playerName, roomId }) => {
    console.log(`🎪 ${playerName} tentando entrar na sala ${roomId}`);
    
    // Criar sala se não existir
    if (!rooms[roomId]) {
      createRoom(roomId);
    }
    
    const room = rooms[roomId];

    // Verificar se sala está cheia
    if (Object.keys(room.players).length >= 2) {
      console.log(`❌ Sala ${roomId} cheia!`);
      socket.emit("room-full");
      return;
    }

    // Definir posição de spawn (esquerda/direita)
    const spawnX = Object.keys(room.players).length === 0 ? 100 : 700;

    // Criar jogador
    room.players[socket.id] = {
      id: socket.id,
      name: playerName,
      x: spawnX,
      y: GROUND_Y - PLAYER_HEIGHT,
      w: PLAYER_WIDTH,
      h: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      facing: spawnX < 400 ? "right" : "left",
      state: "idle",
      health: 100,
      attacking: false,
      attackTimer: 0,
      attackHitApplied: false // ✅ CORRIGIDO: Variável definida
    };

    // Configurar inputs padrão
    room.inputs[socket.id] = {
      left: false, 
      right: false, 
      up: false, 
      attack: false
    };

    // Entrar na sala Socket.io
    socket.join(roomId);
    socket.roomId = roomId;

    // Notificar sucesso no login
    socket.emit("login-success", { playerId: socket.id });
    
    // Notificar todos na sala sobre o novo jogador
    const roomPlayers = Object.keys(room.players);
    io.to(roomId).emit("player-joined", {
      playerId: socket.id,
      playerName: playerName,
      roomPlayers: roomPlayers
    });

    // Enviar estado atual para todos
    io.to(roomId).emit("state", room.players);

    console.log(`✅ ${playerName} entrou em ${roomId} (${roomPlayers.length}/2)`);

    // Iniciar loop do jogo se for o primeiro jogador
    if (!room.loopInterval && roomPlayers.length === 1) {
      console.log(`🎮 Iniciando loop da sala ${roomId}`);
      room.loopInterval = setInterval(() => gameLoop(roomId), 1000 / TICK_RATE);
    }
  });

  // Receber inputs dos jogadores
  socket.on("input", (input) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms[roomId];
    if (!room || !room.inputs[socket.id]) return;

    // Atualizar inputs do jogador
    room.inputs[socket.id] = input;
  });

  // ✅ CORRIGIDO: Evento para sair da sala
  socket.on("leave-room", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    console.log(`🚪 ${socket.id} saindo da sala ${roomId}`);
    
    const room = rooms[roomId];
    const playerName = room.players[socket.id]?.name || "Jogador";

    // Remover jogador
    delete room.players[socket.id];
    delete room.inputs[socket.id];

    // Notificar outros jogadores
    const remainingPlayers = Object.keys(room.players);
    socket.to(roomId).emit("player-left", {
      playerId: socket.id,
      playerName: playerName,
      roomPlayers: remainingPlayers
    });

    // Parar loop se sala estiver vazia
    if (remainingPlayers.length === 0) {
      console.log(`🗑️ Sala ${roomId} vazia - removendo`);
      if (room.loopInterval) {
        clearInterval(room.loopInterval);
      }
      delete rooms[roomId];
    } else {
      // Atualizar estado para jogadores restantes
      io.to(roomId).emit("state", room.players);
    }

    // Limpar referência da sala
    socket.roomId = null;
  });

  socket.on("disconnect", () => {
    console.log("🔌 Desconectado:", socket.id);
    
    // Tratar desconexão como saída da sala
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const playerName = room.players[socket.id]?.name || "Jogador";

      delete room.players[socket.id];
      delete room.inputs[socket.id];

      const remainingPlayers = Object.keys(room.players);
      socket.to(roomId).emit("player-left", {
        playerId: socket.id,
        playerName: playerName,
        roomPlayers: remainingPlayers
      });

      if (remainingPlayers.length === 0) {
        if (room.loopInterval) {
          clearInterval(room.loopInterval);
        }
        delete rooms[roomId];
      } else {
        io.to(roomId).emit("state", room.players);
      }
    }
  });
});

// Loop principal do jogo
function gameLoop(roomId) {
  const room = rooms[roomId];
  if (!room || !room.running) return;

  const players = room.players;
  const inputs = room.inputs;

  // Simular física e ações para cada jogador
  for (const id in players) {
    const player = players[id];
    const input = inputs[id] || { 
      left: false, right: false, up: false, attack: false 
    };

    // 🎮 MOVIMENTO HORIZONTAL
    const SPEED = 240; // px/s
    let accelerationX = 0;
    
    if (input.left) accelerationX = -SPEED;
    else if (input.right) accelerationX = SPEED;
    
    player.vx = accelerationX;

    // 🦘 PULO (só quando está no chão)
    if (input.up && Math.abs(player.vy) < 0.001 && player.y >= GROUND_Y - player.h - 0.5) {
      player.vy = -650; // impulso do pulo
      player.state = "jump";
    }

    // 👊 ATAQUE
    if (input.attack && !player.attacking) {
      player.attacking = true;
      player.attackTimer = ATTACK_DURATION;
      player.attackHitApplied = false; // Resetar flag de hit
      player.state = "attack";
    }

    // ⬇️ GRAVIDADE
    player.vy += GRAVITY * DT;

    // 🚀 APLICAR VELOCIDADES
    player.x += player.vx * DT;
    player.y += player.vy * DT;

    // 🏞️ COLISÃO COM CHÃO
    if (player.y > GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      if (!player.attacking && Math.abs(player.vx) < 1) {
        player.state = "idle";
      }
    }

    // 🎯 LIMITES DA ARENA
    if (player.x < 0) player.x = 0;
    if (player.x > 800 - player.w) player.x = 800 - player.w;

    // ⏰ ATUALIZAR ATAQUE
    if (player.attacking) {
      player.attackTimer -= DT;

      // Calcular tempo decorrido desde o início do ataque
      const timeIntoAttack = ATTACK_DURATION - player.attackTimer;

      // 🔥 JANELA ATIVA DO ATAQUE (onde o hit é aplicado)
      if (!player.attackHitApplied && 
          timeIntoAttack >= ATTACK_ACTIVE_WINDOW_START && 
          timeIntoAttack <= ATTACK_ACTIVE_WINDOW_END) {
        
        // Detectar colisão com outros jogadores
        for (const otherId in players) {
          if (otherId === id) continue; // Pular o próprio jogador
          
          const opponent = players[otherId];
          const attackBox = {
            x: player.facing === "right" ? player.x + player.w : player.x - 40,
            y: player.y + 20,
            w: 40,
            h: player.h - 30
          };
          
          const targetBox = { 
            x: opponent.x, 
            y: opponent.y, 
            w: opponent.w, 
            h: opponent.h 
          };
          
          // Verificar colisão
          if (aabbCollision(attackBox, targetBox)) {
            console.log(`💥 ${player.name} acertou ${opponent.name}!`);
            
            // Aplicar dano
            opponent.health -= 15;
            if (opponent.health < 0) opponent.health = 0;
            
            // Efeito de hit
            opponent.state = "hit";
            opponent.vx = player.facing === "right" ? 120 : -120;
            
            // Marcar que o hit foi aplicado
            player.attackHitApplied = true;
          }
        }
      }

      // 🛑 FIM DO ATAQUE
      if (player.attackTimer <= 0) {
        player.attacking = false;
        player.attackTimer = 0;
        player.attackHitApplied = false;
        player.state = "idle";
      }
    }

    // 🧭 ATUALIZAR DIREÇÃO
    if (player.vx > 1) player.facing = "right";
    if (player.vx < -1) player.facing = "left";

    // ❤️ VERIFICAR VIDA
    if (player.health <= 0) {
      player.state = "dead";
      player.vx = 0;
      player.vy = 0;
    }
  }

  // ✅ VERIFICAR FIM DE JOGO
  if (checkGameOver(roomId, players)) {
    return; // Parar se o jogo terminou
  }

  // 📡 ENVIAR ESTADO ATUALIZADO PARA TODOS OS JOGADORES
  io.to(roomId).emit("state", players);
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🔥 Servidor LUTE online na porta ${PORT}`);
  console.log(`🎮 Acesse: http://localhost:${PORT}`);
});

export default server;