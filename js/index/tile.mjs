"use strict";

import {Animation, Frame, Images, Render} from "./render.mjs";

var tiles = new Map();

class Tile {
  constructor(pos) {
    this.pos = pos;
  }

  getSprite() {
    const spr = this.sprite || this.constructor._sprite;
    if (Object.prototype.toString.call(spr) === '[object String]') {
      return spr ? Images.getImage(spr) : null;
    } else if (Array.isArray(spr)) {
      this.sprite = spr[Math.floor(Math.random() * spr.length)];
      return this.getSprite();
    }
  }

  render(game) {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(game).floor(),
            spr = this.getSprite();
      if (spr) {
        ctx.drawImage(spr, pos.x, pos.y);
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
                        sprite=null, fillStyle="#000000") {
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
Tile.register("empty", Empty);

class Grass extends Tile {}
Tile.register("grass", Grass, "grass.png", "#00FF00");

class WildGrass extends Tile {}
Tile.register("wild_grass", WildGrass, "wild-grass.png", "#3DB846");

class Wall extends Tile {}
Tile.register("wall", Wall, "wall.png", "#606060");

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

  getSprite() {
    return this.animation.getSprite();
  }

  render(game) {
    return [...this.data.groundTile.render(game),
            ...super.render(game)];
  }
}
Tile.register("portal", Portal, null, "#C996FF");

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
Tile.register("sign", Sign, "sign.png", "#FFFF00");

class DeepWater extends Tile {}
Tile.register("deep_water", DeepWater, "deep-water.png", "#0000FF");

class ShallowWater extends Tile {}
Tile.register("shallow_water", ShallowWater, "shallow-water.png", "#64B3F4");

class Dirt extends Tile {}
Tile.register("dirt", Dirt, "dirt.png", "#645A28");

class Desert extends Tile {}
Tile.register("desert", Desert, "desert.png", "#DAD79C");

class Lava extends Tile {}
Tile.register("lava", Lava, "lava.png", "#EC731C");

class Floor extends Tile {}
Tile.register("floor", Floor, ["floor1.png", "floor2.png"], "#DDDDDD");

class IndoorWall extends Tile {}
Tile.register("indoor_wall", IndoorWall, "indoor_wall.png", "#00711A");

class Barrier extends Tile {}
Tile.register("barrier", Barrier);

export {Tile, TilePlus, Empty, Grass, WildGrass, Wall,
        PortalData, Portal, SignData, Sign,
        DeepWater, ShallowWater, Dirt, Desert, Lava,
        Floor, IndoorWall, Barrier};
