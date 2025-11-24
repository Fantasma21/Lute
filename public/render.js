const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

// Estado vindo do servidor
let gameState = {};

export function updateState(newState) {
  gameState = newState;
}

export function startRenderLoop() {
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const id in gameState) {
      const p = gameState[id];

      // corpo do jogador
      ctx.fillStyle = "red";
      ctx.fillRect(p.x, p.y, 40, 40);

      // nome acima
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(p.name, p.x, p.y - 10);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
