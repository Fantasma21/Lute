const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;

class Sprite {
  //-------SPRITE-------\\
  constructor({ position, velocity, color = "red", offset }) {
    this.position = position;
    this.velocity = velocity;
    this.width = 50;
    this.height = 150;
    this.lastKey;
    this.atackBox = {
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      offset,
      width: 100,
      height: 50,
    };
    this.color = color;
    this.isAttacking;
    this.health = 100 // life
  }

  draw() {
    //desenha na tela
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.width, this.height);

    //attack box, área do atack
    if (this.isAttacking) {
      c.fillStyle = "green";
      c.fillRect(
        this.atackBox.position.x,
        this.atackBox.position.y,
        this.atackBox.width,
        this.atackBox.height
      );
    }
  }

  update() {
    //Atualização
    this.draw();
    this.atackBox.position.x = this.position.x + this.atackBox.offset.x; //retângolo de atack att em tempo real
    this.atackBox.position.y = this.position.y; //retângolo de atack att em tempo real

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.position.y + this.height + this.velocity.y >= canvas.height) {
      this.velocity.y = 0; //nesse ponto se toca no solo
    } // eles param no ponto 0 e não afundam no chão
    else this.velocity.y += gravity;
  }

  attack() {
    this.isAttacking = true;
    setTimeout(() => {
      this.isAttacking = false;
    }, 100);
  }
}

const player = new Sprite({
  position: {
    x: 0,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  offset: {
    x: 0,
    y: 0,
  },
});

const enemy = new Sprite({
  position: {
    x: 400,
    y: 100,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  color: "blue",
  offset: {
    x: -50,
    y: 0,
  },
});

console.log(player);

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  ArrowRight: {
    pressed: false,
  },
  ArrowLeft: {
    pressed: false,
  },
};

function rectangularColiision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.atackBox.position.x + rectangle1.atackBox.width >=
      rectangle2.position.x &&
    rectangle1.atackBox.position.x <=
      rectangle2.position.x + rectangle2.width &&
    rectangle1.atackBox.position.y + rectangle1.atackBox.height >=
      rectangle2.position.y &&
    rectangle1.atackBox.position.y <= rectangle2.position.y + rectangle2.height
  );
}

let timer = 5
function decreaseTimer () {
  if (timer > 0) {
    setTimeout (decreaseTimer, 1000)
    timer--
    document.querySelector('#timer').innerHTML = timer
  }

if (timer == 0) {  
  document.querySelector('#displayText').style.display = 'flex'

if (player.health === enemy.health) {
  document.querySelector('#displayText').innerHTML = 'Empate'
} else if (player.health > enemy.health) {
  document.querySelector('#displayText').innerHTML = 'Jogador 1 venceu!'
} else if (player.health < enemy.health) {
  document.querySelector('#displayText').innerHTML = 'Jogador 2 venceu!'
}
}
}

decreaseTimer()

function animate() {
  window.requestAnimationFrame(animate);
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.update();
  enemy.update();

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // player movement
  if (keys.a.pressed && player.lastKey === "a") {
    player.velocity.x = -5;
  } else if (keys.d.pressed && player.lastKey === "d") {
    player.velocity.x = 5;
  }

  // enemy movement
  if (keys.ArrowLeft.pressed && enemy.lastKey === "ArrowLeft") {
    enemy.velocity.x = -5;
  } else if (keys.ArrowRight.pressed && enemy.lastKey === "ArrowRight") {
    enemy.velocity.x = 5;
  }

  // detectar colisão
  if (
    rectangularColiision({
      rectangle1: player,
      rectangle2: enemy,
    }) &&
    player.isAttacking
  ) {
    player.isAttacking = false
    enemy.health -= 10 // quantidade de vida retirada de 100
    document.querySelector('#enemyHealth').style.width = enemy.health + '%' // vida retirada em %
  }

  if (
    rectangularColiision({
      rectangle1: enemy,
      rectangle2: player,
    }) &&
    enemy.isAttacking
  ) {
    enemy.isAttacking = false
    player.health -= 10
    document.querySelector('#playerHealth').style.width = player.health + '%' // vida retirada em %
    console.log("enemy atack")
  }
}
animate();

//movimentação do player nas teclas
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "d":
      keys.d.pressed = true;
      player.lastKey = "d";
      break;
    case "a":
      keys.a.pressed = true;
      player.lastKey = "a";
      break;
    case "w": //funcionalidade de saltar
      player.velocity.y = -20; //velocidade de movimentação
      break;
    case " ":
      player.attack();
      break;

    case "ArrowRight": //controlar nas setas
      keys.ArrowRight.pressed = true;
      enemy.lastKey = "ArrowRight";
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = true;
      enemy.lastKey = "ArrowLeft";
      break;
    case "ArrowUp":
      enemy.velocity.y = -20;
      break;
    case "ArrowDown":
      enemy.isAttacking = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "d":
      keys.d.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
  }
  // teclas do enemy
  switch (event.key) {
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
  }
});
