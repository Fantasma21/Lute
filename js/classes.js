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
    this.framesHold = 5
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
    sprites,
    atackBox = {offset: {}, width: undefined, height: undefined } 
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
      offset: atackBox.offset,
      width: atackBox.width,
      height: atackBox.height
    }
    this.color = color;
    this.isAttacking;
    this.health = 100 // life
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5 // velocidade da animação
    this.sprites = sprites
    this.dead = false

    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image()
      sprites[sprite].image.src = sprites[sprite].imageSrc
    }
  }

  update() {
    //Atualização
    this.draw();
    if (!this.dead) this.animateFrames()

    // ataque caixas
    this.atackBox.position.x = this.position.x + this.atackBox.offset.x //retângolo de atack att em tempo real
    this.atackBox.position.y = this.position.y + this.atackBox.offset.y //retângolo de atack att em tempo real

    // draw caixa de ataque
    // c.fillRect(
    //  this.atackBox.position.x, 
    //  this.atackBox.position.y, 
    //  this.atackBox.width, 
    // this.atackBox.height
    //  )

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y



    //limite de solo para os players, gravidade
    if (this.position.y + this.height + this.velocity.y >= canvas.height -10 )   {
      this.velocity.y = 0;
      this.position.y = 426 //nesse ponto se toca no solo
    } // eles param no ponto 0 e não afundam no chão
    else this.velocity.y += gravity;
    console.log(this.position);
  }

  attack() {
    this.switchSprite('ataque')
    this.isAttacking = true
      ////////////////////////////////////////
  }

  hit(){
    this.health -= 10 // quantidade de vida retirada de 100

    if (this.health <= 0){
      this.switchSprite('morto')
    } else this.switchSprite('hit')
  }

  switchSprite (sprite){
    if(this.image === this.sprites.morto.image) {
      if(this.framesCurrent === this.sprites.morto.framesMax -1) 
      this.dead = true
      return
    }

    // overriding all other animations with the attack animation
    if (
      this.image === this.sprites.ataque.image && 
      this.framesCurrent < this.sprites.ataque.framesMax -1
      ) 
       return
   // override whem fighter gets hit
   if(this.image === this.sprites.hit.image && 
    this.framesCurrent < this.sprites.hit.framesMax -1
    )
      return

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
      case 'ataque':
            if (this.image !== this.sprites.ataque.image){
              this.image = this.sprites.ataque.image
              this.framesMax = this.sprites.ataque.framesMax
              this.framesCurrent = 0
            }
            break    
      case 'hit':
             if (this.image !== this.sprites.hit.image){
                this.image = this.sprites.hit.image
                this.framesMax = this.sprites.hit.framesMax
                this.framesCurrent = 0
             }
            break 
      case 'morto':
            if (this.image !== this.sprites.morto.image){
               this.image = this.sprites.morto.image
               this.framesMax = this.sprites.morto.framesMax
               this.framesCurrent = 0
              }
              break      
    }
  }
}
