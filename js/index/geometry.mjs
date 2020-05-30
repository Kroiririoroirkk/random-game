"use strict";

class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  relativeTo(p) {
    return new Vec(this.x - p.x, this.y - p.y);
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
