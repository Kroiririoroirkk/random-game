"use strict";

import {Dir} from "./geometry.mjs";
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
Tile.register("wild_grass", WildGrass, "wild_grass.png", "#3DB846");

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
    return new PortalData(Tile.fromJSON(obj["ground_tile"], pos));
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
    return new SignData(Tile.fromJSON(obj["ground_tile"], pos));
  }

  render(game) {
    const SIGN_HEIGHT = 27;
    return [...this.data.groundTile.render(game),
            ...(super.render(game).map(r => r.withY(this.pos.y + SIGN_HEIGHT)))];
  }
}
Tile.register("sign", Sign, "sign.png", "#FFFF00");

class DeepWater extends Tile {}
Tile.register("deep_water", DeepWater, "deep_water.png", "#0000FF");

class ShallowWater extends Tile {}
Tile.register("shallow_water", ShallowWater, "shallow_water.png", "#64B3F4");

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

class Carpet extends Tile {}
Tile.register("carpet", Carpet, "carpet.png", "#F1C232");

class Rug extends Tile {}
Tile.register("rug", Rug, "rug.png", "#38761D");

class Table extends Tile {}
Tile.register("table", Table, "table.png", "#B45F06");

class Chair extends Tile {}
Tile.register("chair", Chair, "chair.png", "#FFFF00");

class KnickknackShelf extends Tile {}
Tile.register("knickknack_shelf", KnickknackShelf, "knickknack_shelf.png", "#C27BA0");

class LeftDoor extends Tile {}
Tile.register("left_door", LeftDoor, "left_door.png", "#FF6D01");

class RightDoor extends Tile {}
Tile.register("right_door", RightDoor, "right_door.png", "#FF6D01");

class MetalLeftDoor extends Tile {}
Tile.register("metal_left_door", MetalLeftDoor, "metal_left_door.png", "#D9D9D9");

class MetalRightDoor extends Tile {}
Tile.register("metal_right_door", MetalRightDoor, "metal_right_door.png", "#D9D9D9");

class Countertop extends Tile {}
Tile.register("countertop", Countertop, "countertop.png", "#0000FF");

class StairTopAscending extends Tile {}
Tile.register("stair_top_ascending", StairTopAscending, "stair_top_ascending.png", "#434343");

class StairBottomAscending extends Tile {}
Tile.register("stair_bottom_ascending", StairBottomAscending, "stair_bottom_ascending.png", "#666666");

class StairTopDescending extends Tile {}
Tile.register("stair_top_descending", StairTopDescending, "stair_top_descending.png", "#434343");

class StairBottomDescending extends Tile {}
Tile.register("stair_bottom_descending", StairBottomDescending, "stair_bottom_descending.png", "#666666");

class Couch extends Tile {}
Tile.register("couch", Couch, "couch.png", "#00FFFF");

class Bed extends Tile {}
Tile.register("bed", Bed, "bed.png", "#FF0000");

class LampNightstand extends Tile {}
Tile.register("lamp_nightstand", LampNightstand, "lamp_nightstand.png", "#FFF2CC");

class Desk extends Tile {}
Tile.register("desk", Desk, "desk.png", "#FFE599");

class Bookcase extends Tile {}
Tile.register("bookcase", Bookcase, "bookcase.png", "#E6B8AF");

class HungUpClothes extends Tile {}
Tile.register("hung_up_clothes", HungUpClothes, "hung_up_clothes.png", "#A64D79");

class PileOfClothes extends Tile {}
Tile.register("pile_of_clothes", PileOfClothes, "pile_of_clothes.png", "#FF00FF");

class PlayerRoof extends Tile {}
Tile.register("player_roof", PlayerRoof, "player_roof.png", "#FF00FF");

class ShopRoof extends Tile {}
Tile.register("shop_roof", ShopRoof, "shop_roof.png", "#EEDD00");

class ArmyRoof extends Tile {}
Tile.register("army_roof", ArmyRoof, "army_roof.png", "#00FFFF");

class UniversityRoof extends Tile {}
Tile.register("university_roof", UniversityRoof, "university_roof.png", "#4285F4");

class UniversityHospitalRoof extends Tile {}
Tile.register("university_hospital_roof", UniversityHospitalRoof, "university_hospital_roof.png", "#0B5394");

class Roof extends Tile {}
Tile.register("roof", Roof, "roof.png", "#FF6D01");

class Well extends Tile {}
Tile.register("well", Well, "well.png", "#4A86E8");

class Pavement extends Tile {}
Tile.register("pavement", Pavement, "pavement.png", "#999999");

class Construction extends Tile {}
Tile.register("construction", Construction, "construction.png", "#FFD966");

class Trees extends Tile {}
Tile.register("trees", Trees, "trees.png", "#38761D");

class Garden extends Tile {}
Tile.register("garden", Garden, "garden.png", "#783F04");

export {Tile, TilePlus, Empty, Grass, WildGrass, Wall,
        PortalData, Portal, SignData, Sign,
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
