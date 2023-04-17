const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.2

class Sprite {            //SPRITE 
    constructor( { position, velocity } ) {
        this.position = position
        this.velocity = velocity
        this.height = 150
    }

    draw() {
        c.fillStyle = 'red'
        c.fillRect(this.position.x, this.position.y, 50, this.height)
    }

    update() {  //Atualização
        this.draw()
        
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if (this.position.y + this.height +this.velocity.y >= canvas.height){
            this.velocity.y = 0 //nesse ponto se toca no solo
        } else // eles param no ponto 0 e não afundam no chão
        this.velocity.y += gravity
    }
}

const player = new Sprite ({
    position: {  
      x: 0,
      y: 0
    },
    velocity: {
      x: 0,
      y: 0
    }
})

const enemy = new Sprite ({
    position: {  
      x: 400,
      y: 100
    },
    velocity: {
      x: 0,
      y: 0
    }
})

console.log(player)

const keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  w: {
    pressed: false
  }
}

let lastKey

function animate() {
    window.requestAnimationFrame(animate)
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    player.update()
    enemy.update()
    
    player.velocity.x = 0

    if (keys.a.pressed && lastKey === 'a') {
      player.velocity.x = -1
    } else if (keys.d.pressed && lastKey === 'd') {
      player.velocity.x = 1
    }
}

animate()

//movimentação do player nas teclas
window.addEventListener('keydown', (event) => {
  console.log (event.key);
  switch (event.key) {
    case 'd':
      keys.d.pressed = true
      lastKey = 'd'
      break
   case 'a':
     keys.a.pressed = true
     lastKey = 'a'
     break  
   case 'w': //funcionalidade de saltar
     player.velocity.y = -10
     break
  }
  console.log(event.key)
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break   
    case 'w':
      keys.w.pressed = false
      break   
  }
  console.log(event.key)
})