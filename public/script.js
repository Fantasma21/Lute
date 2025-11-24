const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;

const background = new Sprite({
  position: {
    x: 0,
    y: 0
  },
  imageSrc: '/img/fundoGame.png'
})

const player = new Fighter({
  position: {
    x: 10,   //posição do player
    y: 0
  },
  velocity: {
    x: 0,
    y: 0
  },
  offset: {
    x: 0,
    y: 0
  },
  imageSrc: '/jet/parado.png',  //renderização do player parado
  framesMax: 4,  //quantidade de imagens
  scale: 1,
  offset:{
    x: 0,
    y: 30
  },
  sprites: {
    parado: {
      imageSrc: '/jet/parado.png',
      framesMax: 4
    },
    correndo: {
      imageSrc: '/jet/correndo.png',
      framesMax: 6
      },
    salto: {
      imageSrc: '/jet/salto.png',
      framesMax: 2
     },
    caindo: {
      imageSrc: '/jet/caindo.png',
      framesMax: 2
     },
    ataque: {
      imageSrc: '/jet/ataque.png',
      framesMax: 5
     },
     hit: {
      imageSrc: '/jet/hit.png',
      framesMax: 4
     },
     morto: {
      imageSrc: '/jet/morto.png',
      framesMax: 6
     }  
  },
  atackBox: {
    offset:{
     x: 45,  //posicionamento da box de ataque
     y: 10
    },
    //tamanho da box de ataque
    width: 78,
    height: 60
  }
})


const enemy = new Fighter({
  position: {
    x: 800,     //posição do enemy
    y: 100,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  color: "blue",
  offset: {
    x: -50,
    y: 0
  },
  imageSrc: '/s-quebrada/parado.png',  //renderização do player parado
  framesMax: 5,  //quantidade de imagens
  scale: 1,
  offset:{
    x: 0,
    y: 30
  },
  sprites: {
    parado: {
      imageSrc: '/s-quebrada/parado.png',
      framesMax: 5
    },
    correndo: {
      imageSrc: '/s-quebrada/correndo.png',
      framesMax: 3
      },
    salto: {
      imageSrc: '/s-quebrada/salto.png',
      framesMax: 2
     },
    caindo: {
      imageSrc: '/s-quebrada/caindo.png',
      framesMax: 2
     },
    ataque: {
      imageSrc: '/s-quebrada/ataque.png',
      framesMax: 5
     },
     hit:{
      imageSrc: '/s-quebrada/hit.png',
      framesMax: 3
     },
     morto: {
      imageSrc: '/s-quebrada/morto.png',
      framesMax: 6
     }  

    },
    atackBox: {
      offset:{
       x: -61, //alcance do ataque
       y: -10
      },
      width: 80,
      height: 110
    }
})

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

decreaseTimer()

function animate() {
  window.requestAnimationFrame(animate);
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);
  background.update()
  player.update()
 /enemy.update();

  player.velocity.x = 0;
  enemy.velocity.x = 0;

  // player movement
  
  if (keys.a.pressed && player.lastKey === "a") {
    player.velocity.x = -5;
    player.switchSprite('correndo')
  } else if (keys.d.pressed && player.lastKey === "d") {
    player.velocity.x = 5;
    player.switchSprite('correndo')
  } else {
    player.switchSprite('parado')
  }

  // pulando
  if (player.velocity.y < 0) {
    player.switchSprite('salto')
  } else if (player.velocity.y > 0) {
    player.switchSprite('caindo')
  }

  // enemy movement
  if (keys.ArrowLeft.pressed && enemy.lastKey === "ArrowLeft") {
    enemy.velocity.x = -5;
    enemy.switchSprite('correndo')
  } else if (keys.ArrowRight.pressed && enemy.lastKey === "ArrowRight") {
    enemy.velocity.x = 5;
    enemy.switchSprite('correndo')
  } else {
    enemy.switchSprite('parado')
  }

    // pulando
    if (enemy.velocity.y < 0) {
      enemy.switchSprite('salto')
    } else if (enemy.velocity.y > 0) {
      enemy.switchSprite('caindo')
    }
  

  // detectar colisão e hit enemy
  if (
    rectangularColiision({
      rectangle1: player,
      rectangle2: enemy
    }) &&
    player.isAttacking && 
    player.framesCurrent === 3
  ) {
    enemy.hit()
    player.isAttacking = false
    document.querySelector('#enemyHealth').style.width = enemy.health + '%' // vida retirada em %
  }

  //if player misses
  if (player.isAttacking && player.framesCurrent === 3)
  player.isAttacking = false

  // this is where our player gets hit

  if (
    rectangularColiision({
      rectangle1: enemy,
      rectangle2: player
    }) &&
    enemy.isAttacking && 
    enemy.framesCurrent === 2
  ) {
    player.hit()
    enemy.isAttacking = false
    document.querySelector('#playerHealth').style.width = player.health + '%' // vida retirada em %
  }

  //if player misses
  if (enemy.isAttacking && enemy.framesCurrent === 2)
  enemy.isAttacking = false

  // fim do jogo baseado na vida
 if (enemy.health <= 0 || player.health <= 0) {
   determineWinner({ player, enemy, timerId })
 }

}
animate();

//movimentação do player nas teclas
window.addEventListener("keydown", (event) => {
  if(!player.dead){

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
      player.attack();  //golpe do player
      break;
  }
}

if(!enemy.dead) {
  switch(event.key){
    case "ArrowRight": //controlar nas setas
      keys.ArrowRight.pressed = true;
      enemy.lastKey = "ArrowRight";
      break
    case "ArrowLeft":
      keys.ArrowLeft.pressed = true;
      enemy.lastKey = "ArrowLeft";
      break
    case "ArrowUp":
      enemy.velocity.y = -20;
      break
    case "ArrowDown":
      enemy.attack()  //golpe do enemy
      break
  }
}
})

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
