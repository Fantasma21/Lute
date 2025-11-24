import express from "express";
import http from "http";
import { Server } from "socket.io";

const ATTACK_DURATION = 0.35; // duração total do ataque em s
const ATTACK_ACTIVE_WINDOW_START = 0.12; // em s (ex: começa depois de 120ms)
const ATTACK_ACTIVE_WINDOW_END = 0.20;   // em s

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

// Simulação
const TICK_RATE = 60; // ticks por segundo
const DT = 1 / TICK_RATE;
const GRAVITY = 1200; // px/s^2 (ajustável)
const GROUND_Y = 320; // y do chão (ajustar se seu canvas for diferente)
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 80;

const rooms = {}; // rooms[id] = { players: { socketId: player }, inputs: { socketId: input }, running: true }

function createRoom(roomId) {
  rooms[roomId] = {
    players: {},
    inputs: {},
    running: true
  };
}

function aabbCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

io.on("connection", socket => {
  console.log("> Conectado:", socket.id);

  // join
  socket.on("join-room", ({ playerName, roomId }) => {
    if (!rooms[roomId]) createRoom(roomId);
    const room = rooms[roomId];

    if (Object.keys(room.players).length >= 2) {
      socket.emit("room-full");
      return;
    }

    // spawn esquerdo/direito
    const spawnX = Object.keys(room.players).length === 0 ? 100 : 700;

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
      attackTimer: 0
    };

    // inputs defaults
    room.inputs[socket.id] = {
      left: false, right: false, up: false, attack: false
    };

    socket.join(roomId);
    socket.roomId = roomId;

    socket.emit("login-success", { playerId: socket.id });
    io.to(roomId).emit("state", room.players);

    console.log(`> ${playerName} entrou em ${roomId}`);

    // start loop se for o primeiro jogador (evita múltiplos loops)
    if (!room.loopInterval) {
      room.loopInterval = setInterval(() => gameLoop(roomId), 1000 / TICK_RATE);
    }
  });

  // recebe inputs (substitui eventos move/attack individuais)
  socket.on("input", (input) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room || !room.inputs[socket.id]) return;

    // input = { left: bool, right: bool, up: bool, attack: bool }
    room.inputs[socket.id] = input;
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    delete rooms[roomId].players[socket.id];
    delete rooms[roomId].inputs[socket.id];

    io.to(roomId).emit("state", rooms[roomId].players);

    // se ninguém na sala, limpar loop
    if (Object.keys(rooms[roomId].players).length === 0) {
      clearInterval(rooms[roomId].loopInterval);
      delete rooms[roomId];
    }

    console.log("> Desconectado:", socket.id);
  });
});

function gameLoop(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const players = room.players;
  const inputs = room.inputs;

  // Simular física e ações para cada jogador
  for (const id in players) {
    const p = players[id];
    const inp = inputs[id] || { left: false, right: false, up: false, attack: false };

    // MOVIMENTO HORIZONTAL
    const SPEED = 240; // px/s
    let ax = 0;
    if (inp.left) ax = -SPEED;
    else if (inp.right) ax = SPEED;
    else ax = 0;

    // atribuir velocidade horizontal diretamente (sem aceleração complexa)
    p.vx = ax;

    // PULO (só quando está no chão)
    if (inp.up && Math.abs(p.vy) < 0.001 && p.y >= GROUND_Y - p.h - 0.5) {
      p.vy = -650; // impulso do pulo (ajustar conforme necessidade)
      p.state = "jump";
    }

    // ATAQUE
    if (inp.attack && !p.attacking) {
      p.attacking = true;
      p.attackTimer = 0.35; // duração do ataque em segundos
      p.state = "attack";
    }

    // gravidade
    p.vy += GRAVITY * DT;

    // aplicar velocidades
    p.x += p.vx * DT;
    p.y += p.vy * DT;

    // colisão com chão
    if (p.y > GROUND_Y - p.h) {
      p.y = GROUND_Y - p.h;
      p.vy = 0;
      if (!p.attacking && Math.abs(p.vx) < 1) p.state = "idle";
    }

    // limites da arena
    if (p.x < 0) p.x = 0;
    if (p.x > 800 - p.w) p.x = 800 - p.w;

    // atualizar attack timer
    if (p.attacking) {
  p.attackTimer -= DT;

  // calculamos quanto tempo já passou desde o início:
  const timeIntoAttack = ATTACK_DURATION - p.attackTimer; // s

  // se estamos dentro da janela ativa e ainda não aplicamos o hit
  if (!p.attackHitApplied && timeIntoAttack >= ATTACK_ACTIVE_WINDOW_START && timeIntoAttack <= ATTACK_ACTIVE_WINDOW_END) {
    // detecção de hit (mesma caixa)
    for (const oid in players) {
      if (oid === id) continue;
      const o = players[oid];
      const attackBox = {
        x: p.facing === "right" ? p.x + p.w : p.x - 40,
        y: p.y + 20,
        w: 40,
        h: p.h - 30
      };
      const targetBox = { x: o.x, y: o.y, w: o.w, h: o.h };
      if (aabbCollision(attackBox, targetBox)) {
        o.health -= 15;
        if (o.health < 0) o.health = 0;
        o.state = "hit";
        o.vx = p.facing === "right" ? 120 : -120;
      }
    }
    p.attackHitApplied = true;
  }

  // fim do ataque
  if (p.attackTimer <= 0) {
    p.attacking = false;
    p.attackTimer = 0;
    p.attackHitApplied = false;
    p.state = "idle";
  }
}

    // atualizar facing com base no vx se houver movimento
    if (p.vx > 1) p.facing = "right";
    if (p.vx < -1) p.facing = "left";

    // checar vida
    if (p.health <= 0) {
      p.state = "dead";
      p.vx = 0;
      p.vy = 0;
    }
  }

  // enviar estado (autoritative)
  io.to(roomId).emit("state", players);
}

server.listen(3000, () => console.log("🔥 Server online na porta 3000"));
