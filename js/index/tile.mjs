"use strict";

import {Animation, Frame, Images, Render} from "./render.mjs";

var tiles = new Map();

class Tile {
  constructor(pos) {
    this.pos = pos;
  }

  render(game) {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(game),
            spr = this.constructor._sprite,
            img = spr ? Images.getImage(spr) : null;
      if (img) {
        ctx.drawImage(img, pos.x, pos.y);
      } else {
        Render.drawRect(game.canvasCtx, pos, this.constructor._fillStyle);
      }
    }).bind(this), this.pos.y)];
  }

  static get hasMetadata() {
    return false;
  }

  animate() {}

  static register(tileId, tileClass,
                        sprite=null, fillStyle="rgb(50, 50, 50)") {
    if (tiles.has(tileId)) {
      throw new Error(`Tile ID ${tileId} is already in use.`);
    } else {
      tiles.set(tileId, tileClass);
      tileClass._sprite = sprite;
      tileClass._fillStyle = fillStyle;
    }
  }

  static getById(tileId) {
    const tileClass = tiles.get(tileId);
    if (tileClass) {
      return tileClass;
    } else {
      throw new Error(`Tile ID ${tileId} not found.`);
    }
  }

  static fromJSON(obj, pos) {
    const tileId    = obj.tile_id,
          tileClass = Tile.getById(tileId);
    if (tileClass.hasMetadata) {
      return new tileClass(pos, tileClass.dataFromJSON(obj.tile_data, pos));
    } else {
      return new tileClass(pos);
    }
  }
}

class TilePlus extends Tile {
  constructor(pos, data) {
    super(pos);
    this.data = data;
  }

  static get hasMetadata() {
    return true;
  }

  static dataFromJSON(obj, pos) {
    throw new Error("Method dataFromJSON not implemented by "
                    + this.constructor.name);
  }
}

class Empty extends Tile {}
Tile.register("empty", Empty, null, "rgb(0, 0, 0)");

class Grass extends Tile {}
Tile.register("grass", Grass, "grass.png", "rgb(0, 255, 0)");

class WildGrass extends Tile {}
Tile.register("wild_grass", WildGrass, "wild-grass.png", "rgb(0, 180, 0)");

class Wall extends Tile {}
Tile.register("wall", Wall, "wall.png", "rgb(210, 105, 30)");

class PortalData {
  constructor(groundTile) {
    this.groundTile = groundTile;
  }
}

class Portal extends TilePlus {
  constructor(pos, data) {
    super(pos, data);
    this.animation = new Animation(
      new Frame(0.28, "portal-1.png"),
      new Frame(0.28, "portal-2.png", "portal-1.png"),
      new Frame(0.28, "portal-3.png", "portal-1.png"),
      new Frame(0.28, "portal-4.png", "portal-1.png")
    );
  }

  static dataFromJSON(obj, pos) {
    return new PortalData(Tile.fromJSON(obj.ground_tile, pos));
  }

  animate(dt) {
    this.animation.animate(dt);
  }

  render(game) {
    return [...this.data.groundTile.render(game), new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(game),
            img = this.animation.getSprite();
      if (img) {
        ctx.drawImage(img, pos.x, pos.y);
      } else {
        Render.drawRect(game.canvasCtx, pos, this.constructor._fillStyle);
      }
    }).bind(this), this.pos.y)];
  }
}
Tile.register("portal", Portal, null, "rgb(0, 0, 0)");

class SignData {
  constructor(groundTile) {
    this.groundTile = groundTile;
  }
}

class Sign extends TilePlus {
  static dataFromJSON(obj, pos) {
    return new SignData(Tile.fromJSON(obj.ground_tile, pos));
  }

  render(game) {
    const SIGN_HEIGHT = 27;
    return [...this.data.groundTile.render(game),
            ...(super.render(game).map(r => r.withY(this.pos.y + SIGN_HEIGHT)))];
  }
}
Tile.register("sign", Sign, "sign.png", "rgb(255, 255, 0)");

export {Tile, TilePlus, Empty, Grass, WildGrass, Wall,
        PortalData, Portal, SignData, Sign};
