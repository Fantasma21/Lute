class Sprite {
  //-------SPRITE-------\\
  constructor({ 
    position, 
    imageSrc, 
    scale = 1, 
    framesMax = 1, 
    offset = {x: 0, y: 0} 
  } ) {
    this.position = position
    this.width = 50
    this.height = 150
    this.image = new Image()
    this.image.src = imageSrc
    this.scale = scale
    this.framesMax = framesMax
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 10
    this.offset = offset
  }

  draw() {    //desenhar os sprites
    c.drawImage(
      this.image, 
      this.framesCurrent * (this.image.width / this.framesMax ),
      0,
      this.image.width / this.framesMax,
      this.image.height,
      this.position.x - this.offset.x, //********************** */
      this.position.y - this.offset.y, 
      (this.image.width / this.framesMax ) * this.scale, 
      this.image.height * this.scale
      )
  }

  animateFrames () {
    this.framesElapsed++

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1){
        this.framesCurrent++
      } else {
        this.framesCurrent = 0
      }
    }
  }

  update() {                    // -------------------------atenção aqui------------------------------ //
    //Atualização
    this.draw()
    this.animateFrames ()
  } 
}

class Fighter extends Sprite {
  //-------SPRITE-------\\
  constructor({ 
    position, 
    velocity, 
    color = "red",    
    imageSrc, 
    scale = 1, 
    framesMax = 1,
    offset = { x:0, y: 0},
    sprites
  }) {
    super ({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    })
    
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
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5 // velocidade da animação
    this.sprites = sprites

    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image()
      sprites[sprite].image.src = sprites[sprite].imageSrc
    }
    console.log(this.sprites)
  }

  update() {
    //Atualização
    this.draw();
    this.animateFrames()

    this.atackBox.position.x = this.position.x + this.atackBox.offset.x; //retângolo de atack att em tempo real
    this.atackBox.position.y = this.position.y; //retângolo de atack att em tempo real

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;



    //limite de solo para os players, gravidade
    if (this.position.y + this.height + this.velocity.y >= canvas.height )   {
      this.velocity.y = 0;
      this.position.y = 426 //nesse ponto se toca no solo
    } // eles param no ponto 0 e não afundam no chão
    else this.velocity.y += gravity;
    console.log(this.position);
  }

  attack() {
    this.isAttacking = true;
    setTimeout(() => {
      this.isAttacking = false;
    }, 100);
  }

  switchSprite (sprite){
    switch (sprite){
      case 'parado':
        if (this.image !== this.sprites.parado.image){
          this.image = this.sprites.parado.image
          this.framesMax = this.sprites.parado.framesMax
          this.framesCurrent = 0
        }
        break
      case 'correndo':
        if (this.image !== this.sprites.correndo.image){
          this.image = this.sprites.correndo.image
          this.framesMax = this.sprites.correndo.framesMax
          this.framesCurrent = 0
        }
        break
      case 'salto':
        if (this.image !== this.sprites.salto.image){
          this.image = this.sprites.salto.image
          this.framesMax = this.sprites.salto.framesMax
          this.framesCurrent = 0
        }
        break  
        case 'caindo':
          if (this.image !== this.sprites.caindo.image){
            this.image = this.sprites.caindo.image
            this.framesMax = this.sprites.caindo.framesMax
            this.framesCurrent = 0
          }
          break      
    }
  }
}
