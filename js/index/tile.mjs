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

class Empty extends Tile {}
Tile.register("empty", Empty, "#000000", null);

class Grass extends Tile {}
Tile.register("grass", Grass, "#00FF00");

class WildGrass extends Tile {}
Tile.register("wild_grass", WildGrass, "#3DB846");

class Wall extends Tile {}
Tile.register("wall", Wall, "#606060");

class PortalData {
  constructor(groundTile) {
    this.groundTile = groundTile;
  }
}

class Portal extends TilePlus {
  constructor(pos, data) {
    super(pos, data);
    this.animation = new Animation(
      new Frame(0.28, "tiles/portal-1.png"),
      new Frame(0.28, "tiles/portal-2.png", "tiles/portal-1.png"),
      new Frame(0.28, "tiles/portal-3.png", "tiles/portal-1.png"),
      new Frame(0.28, "tiles/portal-4.png", "tiles/portal-1.png")
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
Tile.register("portal", Portal, "#C996FF", null);

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

class Table extends Tile {}
Tile.register("table", Table, "#B45F06");

class Chair extends Tile {}
Tile.register("chair", Chair, "#FFFF00");

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

class Couch extends Tile {}
Tile.register("couch", Couch, "#00FFFF");

class Bed extends Tile {}
Tile.register("bed", Bed, "#FF0000");

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
