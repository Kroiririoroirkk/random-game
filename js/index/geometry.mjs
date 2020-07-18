"use strict";

import {BLOCK_WIDTH} from "./config.mjs";

class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  relativeTo(p) {
    return this.sub(p);
  }

  relToPlayer(game) {
    if (game.playerObj) {
      return this.relativeTo(game.playerObj.pos).add(game.getPlayerDrawPos());
    } else {
      throw new Error("Player doesn't exist yet");
    }
  }

  add(p) {
    return new Vec(this.x + p.x, this.y + p.y);
  }

  sub(p) {
    return new Vec(this.x - p.x, this.y - p.y);
  }

  mul(k) {
    return new Vec(k*this.x, k*this.y);
  }

  div(k) {
    return new Vec(this.x/k, this.y/k);
  }

  floor() {
    return new Vec(Math.floor(this.x), Math.floor(this.y));
  }

  static fromJSON(obj) {
    return new Vec(obj["x"], obj["y"]);
  }

  toTileCoord() {
    return new TileCoord(Math.floor(this.x / BLOCK_WIDTH),
                         Math.floor(this.y / BLOCK_WIDTH));
  }
}

class TileCoord {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Dir {
  static strToDir(d) {
    if (d === "l") {return Dir.LEFT;}
    if (d === "u") {return Dir.UP;}
    if (d === "r") {return Dir.RIGHT;}
    if (d === "d") {return Dir.DOWN;}
  }
}
Dir.LEFT = 1;
Dir.UP = 2;
Dir.RIGHT = 3;
Dir.DOWN = 4;

export {Vec, Dir};
