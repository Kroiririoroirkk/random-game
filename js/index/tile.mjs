"use strict";

import {BLOCK_WIDTH} from "./config.mjs";
import {Dir} from "./geometry.mjs";
import {Animation, Frame, Images, Render} from "./render.mjs";

var tiles = new Map();

class Tile {
  constructor(pos) {
    this.pos = pos;
  }

  getSpritePath(game) {
    return this.spritePath;
  }

  getSprite(game) {
    return Images.getImage(this.getSpritePath(game));
  }

  render(game) {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(game).floor(),
            spr = this.getSprite(game);
      if (spr) {
        if (this.usesBiggerSprite) {
          ctx.drawImage(spr, this.sx, this.sy, this.sWidth, this.sHeight,
            pos.x, pos.y+BLOCK_WIDTH-this.sHeight, this.sWidth, this.sHeight);
        } else {
          ctx.drawImage(spr, pos.x, pos.y+BLOCK_WIDTH-spr.naturalHeight);
        }
      } else {
        Render.drawRect(game.canvasCtx, pos, this.constructor.fillStyle);
      }
    }).bind(this), this.pos.y)];
  }

  static get hasMetadata() {
    return false;
  }

  animate() {}

  static register(tileId, tileClass, fillStyle, spritePath=undefined) {
    if (tiles.has(tileId)) {
      throw new Error(`Tile ID ${tileId} is already in use.`);
    } else {
      tiles.set(tileId, tileClass);
      if (typeof spritePath === "undefined") {
        tileClass.prototype.spritePath = `tiles/${tileId}.png`;
      } else {
        tileClass.prototype.spritePath = spritePath;
      }
      tileClass.fillStyle = fillStyle;
    }
  }

  static setLeftRightSprites(tileClass,
      leftSpritePath, rightSpritePath) {
    tileClass.prototype.spritePath = null;
    tileClass.prototype.getSpritePath = function getSpritePath(game) {
      if (this.spritePath) {return this.spritePath;}
      let tileCoord = this.pos.toTileCoord(),
          tileLeft  = game.map[tileCoord.y][tileCoord.x-1];
      if (tileLeft instanceof tileClass) {
        this.spritePath = rightSpritePath;
      } else {
        this.spritePath = leftSpritePath;
      }
      return this.spritePath;
    };
  }

  static setTwoByTwoSprite(tileClass,
      upperLeftSpritePath, upperRightSpritePath,
      lowerLeftSpritePath, lowerRightSpritePath) {
    tileClass.prototype.spritePath = null;
    tileClass.prototype.getSpritePath = function getSpritePath(game) {
      if (this.spritePath) {return this.spritePath;}
      let tileCoord = this.pos.toTileCoord(),
          tileAboveRight = game.map[tileCoord.y-1][tileCoord.x+1],
          tileBelowRight = game.map[tileCoord.y+1][tileCoord.x+1],
          tileAboveLeft  = game.map[tileCoord.y-1][tileCoord.x-1],
          tileBelowLeft  = game.map[tileCoord.y+1][tileCoord.x-1];
      if (tileAboveRight instanceof tileClass) {
        this.spritePath = lowerLeftSpritePath;
      } else if (tileBelowRight instanceof tileClass) {
        this.spritePath = upperLeftSpritePath;
      } else if (tileAboveLeft instanceof tileClass) {
        this.spritePath = lowerRightSpritePath;
      } else if (tileBelowLeft instanceof tileClass) {
        this.spritePath = upperRightSpritePath;
      }
      return this.spritePath;
    }
  }

  static setConnectingSprites(tileClass,
      singleSpritePath,       leftSpritePath,       middleSpritePath,       rightSpritePath,
      backSingleSpritePath,   backLeftSpritePath,   backMiddleSpritePath,   backRightSpritePath,
      middleSingleSpritePath, middleLeftSpritePath, middleMiddleSpritePath, middleRightSpritePath,
      frontSingleSpritePath,  frontLeftSpritePath,  frontMiddleSpritePath,  frontRightSpritePath) {
    tileClass.prototype.spritePath = null;
    tileClass.prototype.getSpritePath = function getSpritePath(game) {
      if (this.spritePath) {return this.spritePath;}
      let tileCoord = this.pos.toTileCoord(),
          tileAbove = game.map[tileCoord.y-1][tileCoord.x],
          tileBelow = game.map[tileCoord.y+1][tileCoord.x],
          tileLeft  = game.map[tileCoord.y][tileCoord.x-1],
          tileRight = game.map[tileCoord.y][tileCoord.x+1],
          statusY,
          statusX;
      if (tileAbove instanceof tileClass) {
        if (tileBelow instanceof tileClass) {
          statusY = 1;
        } else {
          statusY = 2;
        }
      } else if (tileBelow instanceof tileClass) {
        statusY = 0;
      } else {
        statusY = -1;
      }
      if (tileLeft instanceof tileClass) {
        if (tileRight instanceof tileClass) {
          statusX = 1;
        } else {
          statusX = 2;
        }
      } else if (tileRight instanceof tileClass) {
        statusX = 0;
      } else {
        statusX = -1;
      }
      if (statusY === -1) {
        if (statusX === -1) {
          this.spritePath = singleSpritePath;
        } else if (statusX === 0) {
          this.spritePath = leftSpritePath;
        } else if (statusX === 1) {
          this.spritePath = middleSpritePath;
        } else if (statusX === 2) {
          this.spritePath = rightSpritePath;
        }
      } else if (statusY === 0) {
        if (statusX === -1) {
          this.spritePath = backSingleSpritePath;
        } else if (statusX === 0) {
          this.spritePath = backLeftSpritePath;
        } else if (statusX === 1) {
          this.spritePath = backMiddleSpritePath;
        } else if (statusX === 2) {
          this.spritePath = backRightSpritePath;
        }
      } else if (statusY === 1) {
        if (statusX === -1) {
          this.spritePath = middleSingleSpritePath;
        } else if (statusX === 0) {
          this.spritePath = middleLeftSpritePath;
        } else if (statusX === 1) {
          this.spritePath = middleMiddleSpritePath;
        } else if (statusX === 2) {
          this.spritePath = middleRightSpritePath;
        }
      } else if (statusY === 2) {
        if (statusX === -1) {
          this.spritePath = frontSingleSpritePath;
        } else if (statusX === 0) {
          this.spritePath = frontLeftSpritePath;
        } else if (statusX === 1) {
          this.spritePath = frontMiddleSpritePath;
        } else if (statusX === 2) {
          this.spritePath = frontRightSpritePath;
        }
      }
      return this.spritePath;
    }
  }

  static setBlockSprites(tileClass, spritePath, width, height, sizes) {
    tileClass.prototype.spritePath = null;
    tileClass.prototype.getSpritePath = function getSpritePath(game) {
      if (this.spritePath) {return this.spritePath;}
      let tileCoord = this.pos.toTileCoord(),
          dx = 0,
          dy = 0,
          sx = 0,
          sy = 0;
      for (; dx < width; dx++) {
        let tileToCheck = game.map[tileCoord.y][tileCoord.x-dx-1];
        if (!(tileToCheck instanceof tileClass ||
              (tileToCheck.data &&
               tileToCheck.data.groundTile instanceof tileClass))) {
          break;
        }
      }
      for (; dy < height; dy++) {
        let tileToCheck = game.map[tileCoord.y-dy-1][tileCoord.x];
        if (!(tileToCheck instanceof tileClass ||
              (tileToCheck.data &&
               tileToCheck.data.groundTile instanceof tileClass))) {
          break;
        }
      }
      for (let i = 0; i < dx; i++) {
        sx += sizes[dy][i][0];
      }
      for (let j = 0; j < dy; j++) {
        sy += sizes[j][dx][1];
      }
      this.sx = sx;
      this.sy = sy;
      this.sWidth = sizes[dy][dx][0];
      this.sHeight = sizes[dy][dx][1];
      this.spritePath = spritePath;
      this.usesBiggerSprite = true;
      return this.spritePath;
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
    const tileId    = obj["tile_id"],
          tileClass = Tile.getById(tileId);
    if (tileClass.hasMetadata) {
      return new tileClass(pos, tileClass.dataFromJSON(obj["tile_data"], pos));
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
  render(game) {
    return [...this.data.groundTile.render(game),
            ...(super.render(game).map(r => r.withY(this.pos.y + this.renderDepth)))];
  }

  static dataFromJSON(obj, pos) {
    return new GroundData(Tile.fromJSON(obj["ground_tile"], pos));
  }
}
TransparentTile.prototype.renderDepth = BLOCK_WIDTH;

class Empty extends Tile {
  render(game) {return [];}
}
Tile.register("empty", Empty, null, null);

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
      new Frame(0.28, "tiles/portal/portal-1.png"),
      new Frame(0.28, "tiles/portal/portal-2.png", "tiles/portal/portal-1.png"),
      new Frame(0.28, "tiles/portal/portal-3.png", "tiles/portal/portal-1.png"),
      new Frame(0.28, "tiles/portal/portal-4.png", "tiles/portal/portal-1.png")
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

class Sign extends TransparentTile {}
Tile.register("sign", Sign, "#FFFF00");
Sign.prototype.renderDepth = 27;

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

class Floor extends Tile {
  getSpritePath(game) {
    if (this.spritePath) {return this.spritePath;}
    let tileCoord = this.pos.toTileCoord(),
        tileLeft  = game.map[tileCoord.y][tileCoord.x-1];
    if (tileLeft instanceof Floor && tileLeft.spritePath) {
      this.spritePath = tileLeft.spritePath;
    } else if (tileLeft.data
               && tileLeft.data.groundTile instanceof Floor
               && tileLeft.data.groundTile.spritePath) {
      this.spritePath = tileLeft.data.groundTile.spritePath;
    } else {
      let spriteArr = ["tiles/floor/floor1.png", "tiles/floor/floor2.png"];
      this.spritePath = spriteArr[Math.floor(Math.random()*2)];
    }
    return this.spritePath;
  }
}
Tile.register("floor", Floor, "#DDDDDD", null);

class IndoorWall extends Tile {}
Tile.register("indoor_wall", IndoorWall, "#00711A");

class Barrier extends Tile {}
Tile.register("barrier", Barrier, "#000000", null);

class Carpet extends Tile {}
Tile.register("carpet", Carpet, "#F1C232");

class RugData {
  constructor(pattern) {
    this.pattern = pattern;
  }
}

class Rug extends TilePlus {
  static dataFromJSON(obj, pos) {
    return new RugData(obj["pattern"]);
  }

  getSpritePath(game) {
    if (this.spritePath) {return this.spritePath;}
    this.spritePath = `tiles/rug/rug${this.data.pattern}.png`;
    return this.spritePath;
  }
}
Tile.register("rug", Rug, "#38761D", null);

class Table extends TransparentTile {}
Tile.register("table", Table, "#B45F06", null);
Tile.setConnectingSprites(Table,
  "tiles/table/table_single.png",        "tiles/table/table_left.png",        "tiles/table/table_middle.png",        "tiles/table/table_right.png",
  "tiles/table/table_back_single.png",   "tiles/table/table_back_left.png",   "tiles/table/table_back_middle.png",   "tiles/table/table_back_right.png",
  "tiles/table/table_middle_single.png", "tiles/table/table_middle_left.png", "tiles/table/table_middle_middle.png", "tiles/table/table_middle_right.png",
  "tiles/table/table_front_single.png",  "tiles/table/table_front_left.png",  "tiles/table/table_front_middle.png",  "tiles/table/table_front_right.png");


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

  getSpritePath(game) {
    if (this.spritePath) {return this.spritePath;}
    if (this.data.facing === Dir.LEFT) {
      this.spritePath = "tiles/chair/chair_left.png";
    } else if (this.data.facing === Dir.UP) {
      this.spritePath = "tiles/chair/chair_up.png";
    } else if (this.data.facing === Dir.RIGHT) {
      this.spritePath = "tiles/chair/chair_right.png";
    } else if (this.data.facing === Dir.DOWN) {
      this.spritePath = "tiles/chair/chair_down.png";
    }
    return this.spritePath;
  }
}
Tile.register("chair", Chair, "#FFFF00", null);

class KnickknackShelf extends TransparentTile {}
Tile.register("knickknack_shelf", KnickknackShelf, "#C27BA0");

class LeftDoor extends TransparentTile {}
Tile.register("left_door", LeftDoor, "#FF6D01");

class RightDoor extends TransparentTile {}
Tile.register("right_door", RightDoor, "#FF6D01");

class MetalLeftDoor extends TransparentTile {}
Tile.register("metal_left_door", MetalLeftDoor, "#D9D9D9");

class MetalRightDoor extends TransparentTile {}
Tile.register("metal_right_door", MetalRightDoor, "#D9D9D9");

class Mat extends TransparentTile {}
Tile.register("mat", Mat, "#C27BA0");
Tile.setLeftRightSprites(Mat,
  "tiles/mat/mat_left.png", "tiles/mat/mat_right.png");
Mat.prototype.renderDepth = 1;

class Countertop extends TransparentTile {}
Tile.register("countertop", Countertop, "#0000FF");
Tile.setConnectingSprites(Countertop,
  "tiles/countertop/countertop_single.png",        "tiles/countertop/countertop_left.png",        "tiles/countertop/countertop_middle.png",        "tiles/countertop/countertop_right.png",
  "tiles/countertop/countertop_back_single.png",   "tiles/countertop/countertop_back_left.png",   "tiles/countertop/countertop_back_middle.png",   "tiles/countertop/countertop_back_right.png",
  "tiles/countertop/countertop_middle_single.png", "tiles/countertop/countertop_middle_left.png", "tiles/countertop/countertop_middle_middle.png", "tiles/countertop/countertop_middle_right.png",
  "tiles/countertop/countertop_front_single.png",  "tiles/countertop/countertop_front_left.png",  "tiles/countertop/countertop_front_middle.png",  "tiles/countertop/countertop_front_right.png");

class StairTopAscending extends Tile {}
Tile.register("stair_top_ascending", StairTopAscending, "#434343");
Tile.setLeftRightSprites(StairTopAscending,
  "tiles/stair_top_ascending/stair_top_ascending_left.png", "tiles/stair_top_ascending/stair_top_ascending_right.png");

class StairBottomAscending extends Tile {}
Tile.register("stair_bottom_ascending", StairBottomAscending, "#666666");
Tile.setLeftRightSprites(StairBottomAscending,
  "tiles/stair_bottom_ascending/stair_bottom_ascending_left.png", "tiles/stair_bottom_ascending/stair_bottom_ascending_right.png");

class StairTopDescending extends Tile {}
Tile.register("stair_top_descending", StairTopDescending, "#434343");
Tile.setLeftRightSprites(StairTopDescending,
  "tiles/stair_top_descending/stair_top_descending_left.png", "tiles/stair_top_descending/stair_top_descending_right.png");

class StairBottomDescending extends Tile {}
Tile.register("stair_bottom_descending", StairBottomDescending, "#666666");
Tile.setLeftRightSprites(StairBottomDescending,
  "tiles/stair_bottom_descending/stair_bottom_descending_left.png", "tiles/stair_bottom_descending/stair_bottom_descending_right.png");

class Couch extends TransparentTile {}
Tile.register("couch", Couch, "#00FFFF");
Tile.setLeftRightSprites(Couch,
  "tiles/couch/couch_left.png", "tiles/couch/couch_right.png");

class Bed extends TransparentTile {}
Tile.register("bed", Bed, "#FF0000");
Tile.setConnectingSprites(Bed,
  "tiles/bed/bed_head_single.png",   "tiles/bed/bed_head_left.png",   "tiles/bed/bed_head_middle.png",   "tiles/bed/bed_head_right.png",
  "tiles/bed/bed_head_single.png",   "tiles/bed/bed_head_left.png",   "tiles/bed/bed_head_middle.png",   "tiles/bed/bed_head_right.png",
  "tiles/bed/bed_middle_single.png", "tiles/bed/bed_middle_left.png", "tiles/bed/bed_middle_middle.png", "tiles/bed/bed_middle_right.png",
  "tiles/bed/bed_foot_single.png",   "tiles/bed/bed_foot_left.png",   "tiles/bed/bed_foot_middle.png",   "tiles/bed/bed_foot_right.png");

class LampNightstand extends TransparentTile {}
Tile.register("lamp_nightstand", LampNightstand, "#FFF2CC");

class Desk extends Tile {}
Tile.register("desk", Desk, "#FFE599");

class Bookcase extends TransparentTile {
  static dataFromJSON(obj, pos) {
    return Chair.dataFromJSON(obj, pos);
  }

  getSpritePath(game) {
    if (this.spritePath) {return this.spritePath;}
    if (this.data.facing === Dir.LEFT) {
      this.spritePath = "tiles/bookcase/bookcase_left.png";
    } else if (this.data.facing === Dir.UP) {
      this.spritePath = "tiles/bookcase/bookcase_back.png";
    } else if (this.data.facing === Dir.RIGHT) {
      this.spritePath = "tiles/bookcase/bookcase_right.png";
    } else if (this.data.facing === Dir.DOWN) {
      let spriteArr = ["tiles/bookcase/bookcase_front1.png", "tiles/bookcase/bookcase_front2.png"];
      this.spritePath = spriteArr[Math.floor(Math.random()*2)];
    }
    return this.spritePath;
  }
}
Tile.register("bookcase", Bookcase, "#E6B8AF", null);

class HungUpClothes extends Tile {}
Tile.register("hung_up_clothes", HungUpClothes, "#A64D79");

class PileOfClothes extends Tile {}
Tile.register("pile_of_clothes", PileOfClothes, "#FF00FF");

class PlayerRoof extends TransparentTile {}
Tile.register("player_roof", PlayerRoof, "#FF00FF");

class ShopRoof extends TransparentTile {}
Tile.register("shop_roof", ShopRoof, "#EEDD00");

class ArmyRoof extends TransparentTile {}
Tile.register("army_roof", ArmyRoof, "#00FFFF");

class UniversityRoof extends TransparentTile {}
Tile.register("university_roof", UniversityRoof, "#4285F4");

class Roof extends TransparentTile {}
Tile.register("roof", Roof, "#1111BB");
Tile.setBlockSprites(Roof, "tiles/roof.png", 3, 3,
  [new Array(3).fill([BLOCK_WIDTH,BLOCK_WIDTH*3]),
   new Array(3).fill([BLOCK_WIDTH,BLOCK_WIDTH]),
   new Array(3).fill([BLOCK_WIDTH,BLOCK_WIDTH])]);

class Well extends TransparentTile {}
Tile.register("well", Well, "#4A86E8");
Tile.setTwoByTwoSprite(Well,
  "tiles/well/well_upper_left.png", "tiles/well/well_upper_right.png",
  "tiles/well/well_lower_left.png", "tiles/well/well_lower_right.png")

class Pavement extends Tile {}
Tile.register("pavement", Pavement, "#999999");

class Construction extends TransparentTile {}
Tile.register("construction", Construction, "#FFD966");

class Trees extends TransparentTile {}
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
        Roof, Well, Pavement, Construction, Trees, Garden};
