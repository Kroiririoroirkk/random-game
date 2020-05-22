"use strict";

import {PLAYER_WIDTH} from "/js/index/config.js";
import {Entity} from "/js/index/entity.js";
import {Dir} from "/js/index/geometry.js";
import {Animation, Frame, Images, Render} from "/js/index/render.js";

class Player extends Entity {
  constructor(pos) {
    super(null, pos, null, Dir.DOWN);
    this.moving = false;
    this.running = false;
    this.leftAnimation = new Animation(
      new Frame(0.2, "char-left-walk1.png", "char-left-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-left-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-left-walk2.png", "char-left-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-left-still.png", "char-down-still1.png")
    );
    this.upAnimation = new Animation(
      new Frame(0.2, "char-up-walk1.png", "char-up-still1.png", "char-down-still1.png"),
      new Frame(0.2, "char-up-still2.png", "char-up-still1.png", "char-down-still1.png"),
      new Frame(0.2, "char-up-walk2.png", "char-up-still1.png", "char-down-still1.png"),
      new Frame(0.2, "char-up-still1.png", "char-down-still1.png")
    );
    this.rightAnimation = new Animation(
      new Frame(0.2, "char-right-walk1.png", "char-right-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-right-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-right-walk2.png", "char-right-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-right-still.png", "char-down-still1.png")
    );
    this.downAnimation = new Animation(
      new Frame(0.2, "char-down-walk1.png", "char-down-still1.png"),
      new Frame(0.2, "char-down-still2.png", "char-down-still1.png"),
      new Frame(0.2, "char-down-walk2.png", "char-down-still1.png"),
      new Frame(0.2, "char-down-still1.png")
    );
  }

  getAnimation() {
    if (this.facing === Dir.LEFT)  {return this.leftAnimation;}
    if (this.facing === Dir.UP)    {return this.upAnimation;}
    if (this.facing === Dir.RIGHT) {return this.rightAnimation;}
    if (this.facing === Dir.DOWN)  {return this.downAnimation;}
  }

  getSprite() {
    if (this.moving) {
      return this.getAnimation().getSprite();
    } else {
      if (this.facing === Dir.LEFT)  {return Images.getImage("char-left-still.png", "char-down-still1.png");}
      if (this.facing === Dir.UP)    {return Images.getImage("char-up-still1.png", "char-down-still1.png");}
      if (this.facing === Dir.RIGHT) {return Images.getImage("char-right-still.png", "char-down-still1.png");}
      if (this.facing === Dir.DOWN)  {return Images.getImage("char-down-still1.png");}
    }
  }

  move(offset) {
    super.move(offset);
    if (!this.moving) {
      this.startMoving();
    }
  }

  animate(dt) {
    if (this.running) {dt = 2*dt;}
    this.getAnimation().animate(dt);
  }

  startMoving() {
    this.getAnimation().reset();
    this.moving = true;
  }

  stopMoving() {
    this.running = false;
    this.moving = false;
  }

  render(game) {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = game.getPlayerDrawPos(),
            img = this.getSprite();
      if (img) {
        ctx.drawImage(img, pos.x, pos.y);
      } else {
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.fillRect(pos.x, pos.y, PLAYER_WIDTH, PLAYER_WIDTH);
        ctx.fillStyle = "rgb(255, 0, 0)";
        ctx.fillRect(pos.x+1, pos.y+1, PLAYER_WIDTH-2, PLAYER_WIDTH-2);
      }
    }).bind(this), this.pos.y + PLAYER_WIDTH)];
  }
}

class OtherPlayer extends Entity {
  constructor(pos, username) {
    super(null, pos, null, null);
    this.username = username;
  }

  render(game) {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            startingX = Math.floor(this.pos.relToPlayer(game).x),
            startingY = Math.floor(this.pos.relToPlayer(game).y);
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(startingX, startingY, PLAYER_WIDTH, PLAYER_WIDTH);
      ctx.fillStyle = "rgb(255, 20, 147)";
      ctx.fillRect(startingX+1, startingY+1, PLAYER_WIDTH-2, PLAYER_WIDTH-2);
    }).bind(this), this.pos.y + PLAYER_WIDTH)];
  }
}

export {Player, OtherPlayer};
