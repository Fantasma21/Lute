class Sprite {
  //-------SPRITE-------\\
  constructor({ position, imageSrc }) {
    this.position = position
    this.width = 50
    this.height = 150
    this.image = new Image()
    this.image.src = imageSrc
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y)
  }

  update() {
    //Atualização
    this.draw();
  }
 
}

class Fighter {
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