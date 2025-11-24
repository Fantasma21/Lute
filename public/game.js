const socket = io();

const playerName = localStorage.getItem("playerName");
const roomId = localStorage.getItem("roomId");

let playerId = null;
let gameState = {};

// login na sala
socket.emit("join-room", { playerName, roomId });

// sala cheia
socket.on("room-full", () => {
  alert("A sala já está cheia!");
  window.location.href = "/";
});

// servidor confirma login
socket.on("login-success", (data) => {
  playerId = data.playerId;
});

// recebe estado sincronizado
socket.on("room-state", (state) => {
  gameState = state;
});

// enviar movimentos
document.addEventListener("keydown", (e) => {
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    a: "left",
    d: "right"
  };

  const dir = map[e.key];
  if (dir) {
    socket.emit("move", dir);
  }

  // ataque
  if (e.key === " ") {
    socket.emit("attack");
  }
});
