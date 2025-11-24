import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

// --- Estrutura das salas ---
const rooms = {};
// rooms[sala] = { players: {socketId:{name,x,y}}, state:{} }

// Criar sala
function createRoom(roomId) {
  rooms[roomId] = {
    players: {},
  };
}

io.on("connection", socket => {
  console.log("> Novo cliente conectado:", socket.id);

  // --- LOGIN + ENTRAR NA SALA ---
  socket.on("join-room", ({ playerName, roomId }) => {

    if (!rooms[roomId]) createRoom(roomId);
    const room = rooms[roomId];

    // Impedir mais de 2 jogadores
    if (Object.keys(room.players).length >= 2) {
      socket.emit("room-full");
      return;
    }

    // Registrar jogador
    room.players[socket.id] = {
      name: playerName,
      x: 50,
      y: 50
    };

    socket.join(roomId);
    socket.roomId = roomId;

    console.log(`> Player ${playerName} entrou na sala ${roomId}`);
  });

  // --- MOVIMENTO ---
  socket.on("move", key => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms[roomId];
    const p = room.players[socket.id];
    if (!p) return;

    const speed = 10;

    if (key === "ArrowLeft") p.x -= speed;
    if (key === "ArrowRight") p.x += speed;
    if (key === "ArrowUp") p.y -= speed;
    if (key === "ArrowDown") p.y += speed;

    // Envia estado da sala apenas para seus jogadores
    io.to(roomId).emit("state", room.players);
  });

  // --- DESCONECTAR ---
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;

    delete rooms[roomId].players[socket.id];

    console.log("> Jogador saiu:", socket.id);
  });

});

server.listen(3000, () => console.log("🔥 Server online na porta 3000"));
