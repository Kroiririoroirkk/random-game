"use strict";

import {Dir} from "./geometry.mjs";
import {Animation, Frame, Images, Render} from "./render.mjs";

var tiles = new Map();

class Tile {
  constructor(pos) {
    this.pos = pos;
  }

  getSprite(game) {
    const spr = this.sprite || this.constructor._sprite;
    if (Object.prototype.toString.call(spr) === '[object String]') {
      return Images.getImage(spr);
    } else if (Array.isArray(spr)) {
      this.sprite = spr[Math.floor(Math.random() * spr.length)];
      return this.getSprite(game);
    }
  }

  render(game) {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(game).floor(),
            spr = this.getSprite(game);
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

  static register(tileId, tileClass, fillStyle="#000000", sprite=undefined) {
    if (tiles.has(tileId)) {
      throw new Error(`Tile ID ${tileId} is already in use.`);
    } else {
      tiles.set(tileId, tileClass);
      if (typeof sprite === "undefined") {
        tileClass._sprite = `tiles/${tileId}.png`;
      } else {
        tileClass._sprite = sprite;
      }
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

class GroundData {
  constructor(groundTile) {
    this.groundTile = groundTile;
  }
}

class TransparentTile extends TilePlus {
  render(game, height=undefined) {
    if (height) {
      return [...this.data.groundTile.render(game),
              ...(super.render(game).map(r => r.withY(this.pos.y + height)))];
    } else {
      return [...this.data.groundTile.render(game),
              ...super.render(game)];
    }
  }

  static dataFromJSON(obj, pos) {
    return new GroundData(Tile.fromJSON(obj["ground_tile"], pos));
  }
}

class Empty extends Tile {}
Tile.register("empty", Empty, "#000000", null);

class Grass extends Tile {}
Tile.register("grass", Grass, "#00FF00");

class WildGrass extends Tile {}
Tile.register("wild_grass", WildGrass, "#3DB846");

class Wall extends Tile {}
Tile.register("wall", Wall, "#606060");

class Portal extends TransparentTile {
  constructor(pos, data) {
    super(pos, data);
    this.animation = new Animation(
      new Frame(0.28, "tiles/portal-1.png"),
      new Frame(0.28, "tiles/portal-2.png", "tiles/portal-1.png"),
      new Frame(0.28, "tiles/portal-3.png", "tiles/portal-1.png"),
      new Frame(0.28, "tiles/portal-4.png", "tiles/portal-1.png")
    );
  }

  animate(dt) {
    this.animation.animate(dt);
  }

  getSprite(game) {
    return this.animation.getSprite();
  }
}
Tile.register("portal", Portal, "#C996FF", null);

class Sign extends TransparentTile {
  render(game) {
    return super.render(game, 27);
  }
}
Tile.register("sign", Sign, "#FFFF00");

class DeepWater extends Tile {}
Tile.register("deep_water", DeepWater, "#0000FF");

class ShallowWater extends Tile {}
Tile.register("shallow_water", ShallowWater, "#64B3F4");

class Dirt extends Tile {}
Tile.register("dirt", Dirt, "#645A28");

class Desert extends Tile {}
Tile.register("desert", Desert, "#DAD79C");

class Lava extends Tile {}
Tile.register("lava", Lava, "#EC731C");

class Floor extends Tile {}
Tile.register("floor", Floor, "#DDDDDD",
              ["tiles/floor1.png", "tiles/floor2.png"]);

class IndoorWall extends Tile {}
Tile.register("indoor_wall", IndoorWall, "#00711A");

class Barrier extends Tile {}
Tile.register("barrier", Barrier, "#000000", null);

class Carpet extends Tile {}
Tile.register("carpet", Carpet, "#F1C232");

class Rug extends Tile {}
Tile.register("rug", Rug, "#38761D");

class Table extends TransparentTile {
  getSprite(game) {
    let tileCoord = this.pos.toTileCoord(),
        tileAbove = game.map[tileCoord.y-1][tileCoord.x],
        tileBelow = game.map[tileCoord.y+1][tileCoord.x],
        tileLeft  = game.map[tileCoord.y][tileCoord.x-1],
        tileRight = game.map[tileCoord.y][tileCoord.x+1],
        statusY,
        statusX,
        sprite;
    if (tileAbove instanceof Table) {
      if (tileBelow instanceof Table) {
        statusY = 1;
      } else {
        statusY = 2;
      }
    } else if (tileBelow instanceof Table) {
      statusY = 0;
    } else {
      statusY = -1;
    }
    if (tileLeft instanceof Table) {
      if (tileRight instanceof Table) {
        statusX = 1;
      } else {
        statusX = 2;
      }
    } else if (tileRight instanceof Table) {
      statusX = 0;
    } else {
      statusX = -1;
    }
    if (statusY === -1) {
      if (statusX === -1) {
        sprite = "tiles/table_single.png";
      } else if (statusX === 0) {
        sprite = "tiles/table_left.png";
      } else if (statusX === 1) {
        sprite = "tiles/table_middle.png";
      } else if (statusX === 2) {
        sprite = "tiles/table_right.png";
      }
    } else if (statusY === 0) {
      if (statusX === -1) {
        sprite = "tiles/table_back_single.png";
      } else if (statusX === 0) {
        sprite = "tiles/table_back_left.png";
      } else if (statusX === 1) {
        sprite = "tiles/table_back_middle.png";
      } else if (statusX === 2) {
        sprite = "tiles/table_back_right.png";
      }
    } else if (statusY === 1) {
      if (statusX === -1) {
        sprite = "tiles/table_middle_single.png";
      } else if (statusX === 0) {
        sprite = "tiles/table_middle_left.png";
      } else if (statusX === 1) {
        sprite = "tiles/table_middle_middle.png";
      } else if (statusX === 2) {
        sprite = "tiles/table_middle_right.png";
      }
    } else if (statusY === 2) {
      if (statusX === -1) {
        sprite = "tiles/table_front_single.png";
      } else if (statusX === 0) {
        sprite = "tiles/table_front_left.png";
      } else if (statusX === 1) {
        sprite = "tiles/table_front_middle.png";
      } else if (statusX === 2) {
        sprite = "tiles/table_front_right.png";
      }
    }
    return Images.getImage(sprite);
  }
}
Tile.register("table", Table, "#B45F06", null);

class ChairData extends GroundData {
  constructor(facing, groundTile) {
    super(groundTile);
    this.facing = facing;
  }
}

class Chair extends TransparentTile {
  static dataFromJSON(obj, pos) {
    return new ChairData(
      Dir.strToDir(obj["facing"]),
      super.dataFromJSON(obj, pos).groundTile);
  }

  getSprite(game) {
    if (this.data.facing === Dir.LEFT) {
      return Images.getImage("tiles/chair_left.png");
    } else if (this.data.facing === Dir.UP) {
      return Images.getImage("tiles/chair_up.png");
    } else if (this.data.facing === Dir.RIGHT) {
      return Images.getImage("tiles/chair_right.png");
    } else if (this.data.facing === Dir.DOWN) {
      return Images.getImage("tiles/chair_down.png");
    }
  }
}
Tile.register("chair", Chair, "#FFFF00", null);

class KnickknackShelf extends Tile {}
Tile.register("knickknack_shelf", KnickknackShelf, "#C27BA0");

class LeftDoor extends Tile {}
Tile.register("left_door", LeftDoor, "#FF6D01");

class RightDoor extends Tile {}
Tile.register("right_door", RightDoor, "#FF6D01");

class MetalLeftDoor extends Tile {}
Tile.register("metal_left_door", MetalLeftDoor, "#D9D9D9");

class MetalRightDoor extends Tile {}
Tile.register("metal_right_door", MetalRightDoor, "#D9D9D9");

class Countertop extends Tile {}
Tile.register("countertop", Countertop, "#0000FF");

class StairTopAscending extends Tile {}
Tile.register("stair_top_ascending", StairTopAscending, "#434343");

class StairBottomAscending extends Tile {}
Tile.register("stair_bottom_ascending", StairBottomAscending, "#666666");

class StairTopDescending extends Tile {}
Tile.register("stair_top_descending", StairTopDescending, "#434343");

class StairBottomDescending extends Tile {}
Tile.register("stair_bottom_descending", StairBottomDescending, "#666666");

class Couch extends TransparentTile {
  getSprite(game) {
    let tileCoord = this.pos.toTileCoord(),
        tileLeft  = game.map[tileCoord.y][tileCoord.x-1];
    if (tileLeft instanceof Couch) {
      return Images.getImage("tiles/couch_right.png");
    } else {
      return Images.getImage("tiles/couch_left.png");
    }
  }
}
Tile.register("couch", Couch, "#00FFFF", null);

class Bed extends TransparentTile {
  getSprite(game) {
    let tileCoord = this.pos.toTileCoord(),
        tileAbove = game.map[tileCoord.y-1][tileCoord.x],
        tileBelow = game.map[tileCoord.y+1][tileCoord.x],
        tileLeft  = game.map[tileCoord.y][tileCoord.x-1],
        tileRight = game.map[tileCoord.y][tileCoord.x+1],
        statusY,
        statusX,
        sprite;
    if (tileAbove instanceof Bed) {
      if (tileBelow instanceof Bed) {
        statusY = 1;
      } else {
        statusY = 2;
      }
    } else if (tileBelow instanceof Bed) {
      statusY = 0;
    } else {
      statusY = -1;
    }
    if (tileLeft instanceof Bed) {
      if (tileRight instanceof Bed) {
        statusX = 1;
      } else {
        statusX = 2;
      }
    } else if (tileRight instanceof Bed) {
      statusX = 0;
    } else {
      statusX = -1;
    }
    if (statusY === -1 || statusY === 0) {
      if (statusX === -1) {
        sprite = "tiles/bed_head_single.png";
      } else if (statusX === 0) {
        sprite = "tiles/bed_head_left.png";
      } else if (statusX === 1) {
        sprite = "tiles/bed_head_middle.png";
      } else if (statusX === 2) {
        sprite = "tiles/bed_head_right.png";
      }
    } else if (statusY === 1) {
      if (statusX === -1) {
        sprite = "tiles/bed_middle_single.png";
      } else if (statusX === 0) {
        sprite = "tiles/bed_middle_left.png";
      } else if (statusX === 1) {
        sprite = "tiles/bed_middle_middle.png";
      } else if (statusX === 2) {
        sprite = "tiles/bed_middle_right.png";
      }
    } else if (statusY === 2) {
      if (statusX === -1) {
        sprite = "tiles/bed_foot_single.png";
      } else if (statusX === 0) {
        sprite = "tiles/bed_foot_left.png";
      } else if (statusX === 1) {
        sprite = "tiles/bed_foot_middle.png";
      } else if (statusX === 2) {
        sprite = "tiles/bed_foot_right.png";
      }
    }
    return Images.getImage(sprite);
  }
}
Tile.register("bed", Bed, "#FF0000", null);

class LampNightstand extends Tile {}
Tile.register("lamp_nightstand", LampNightstand, "#FFF2CC");

class Desk extends Tile {}
Tile.register("desk", Desk, "#FFE599");

class Bookcase extends Tile {}
Tile.register("bookcase", Bookcase, "#E6B8AF");

class HungUpClothes extends Tile {}
Tile.register("hung_up_clothes", HungUpClothes, "#A64D79");

class PileOfClothes extends Tile {}
Tile.register("pile_of_clothes", PileOfClothes, "#FF00FF");

class PlayerRoof extends Tile {}
Tile.register("player_roof", PlayerRoof, "#FF00FF");

class ShopRoof extends Tile {}
Tile.register("shop_roof", ShopRoof, "#EEDD00");

class ArmyRoof extends Tile {}
Tile.register("army_roof", ArmyRoof, "#00FFFF");

class UniversityRoof extends Tile {}
Tile.register("university_roof", UniversityRoof, "#4285F4");

class UniversityHospitalRoof extends Tile {}
Tile.register("university_hospital_roof", UniversityHospitalRoof, "#0B5394");

class Roof extends Tile {}
Tile.register("roof", Roof, "#1111BB");

class Well extends Tile {}
Tile.register("well", Well, "#4A86E8");

class Pavement extends Tile {}
Tile.register("pavement", Pavement, "#999999");

class Construction extends Tile {}
Tile.register("construction", Construction, "#FFD966");

class Trees extends Tile {}
Tile.register("trees", Trees, "#38761D");

class Garden extends Tile {}
Tile.register("garden", Garden, "#783F04");

export {Tile, TilePlus, GroundData, TransparentTile,
        Empty, Grass, WildGrass, Wall, Portal, Sign,
        DeepWater, ShallowWater, Dirt, Desert, Lava,
        Floor, IndoorWall, Barrier, Carpet, Rug, Table, Chair,
        KnickknackShelf, LeftDoor, RightDoor, MetalLeftDoor,
        MetalRightDoor, Countertop, StairTopAscending,
        StairBottomAscending, StairTopDescending,
        StairBottomDescending, Couch, Bed, LampNightstand,
        Desk, Bookcase, HungUpClothes, PileOfClothes,
        PlayerRoof, ShopRoof, ArmyRoof, UniversityRoof,
        UniversityHospitalRoof, Roof, Well, Pavement,
        Construction, Trees, Garden};
