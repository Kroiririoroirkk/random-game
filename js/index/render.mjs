"use strict";

import {BLOCK_WIDTH} from "./config.mjs";

class Render {
  constructor(render, groundY) {
    this.render = render;
    this.groundY = groundY;
  }

  withY(y) {
    return new Render(this.render, y);
  }

  static renders(renderList) {
    renderList.sort((r1, r2) => r1.groundY - r2.groundY);
    renderList.forEach(function(r) {
      r.render();
    });
  }

  static drawRect(ctx, pos, fillStyle) {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(Math.floor(pos.x), Math.floor(pos.y),
                 BLOCK_WIDTH, BLOCK_WIDTH);
    ctx.fillStyle = fillStyle;
    ctx.fillRect(Math.floor(pos.x)+1, Math.floor(pos.y)+1,
                 BLOCK_WIDTH-2, BLOCK_WIDTH-2);
  }
}

const images = new Map();

const LOADING = "LOADING";

function loadImage(filename) {
  const image = new Image();
  image.onload = function(){images.set(filename, image);};
  image.src = "/data/img/" + filename;
  images.set(filename, LOADING);
}

class Images {
  static getImage(...filenames) {
    for (const filename of filenames) {
      if (images.has(filename)) {
        if (images.get(filename) !== LOADING) {
          return images.get(filename);
        }
      } else {
        loadImage(filename);
      }
    }
    return null;
  }
}

class Frame {
  constructor(time, ...sprites) {
    this.time = time;
    this.sprites = sprites;
  }
}

class Animation {
  constructor(...frames) {
    this.frames = frames;
    this.reset();
  }

  animate(dt) {
    this.frameDuration -= dt;
    while (this.frameDuration <= 0) {
      this.frameIndex++;
      if (this.frameIndex >= this.frames.length) {
        this.frameIndex %= this.frames.length;
      }
      this.frameDuration += this.frames[this.frameIndex].time;
    }
  }

  reset() {
    this.frameIndex = 0;
    this.frameDuration = this.frames[0].time;
  }

  getSprite() {
    return Images.getImage(...this.frames[this.frameIndex].sprites);
  }
}

export {Render, Images, Frame, Animation};
