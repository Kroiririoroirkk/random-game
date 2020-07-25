"use strict";

import {BLOCK_WIDTH} from "./config.mjs";
import {Dir, Vec} from "./geometry.mjs";
import {Images, Render} from "./render.mjs";

var entities = new Map();

class Entity {
  constructor(name, pos, velocity, facing) {
    this.name = name;
    this.pos = pos;
    this.velocity = velocity;
    this.facing = facing;
    this.height = BLOCK_WIDTH;
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
            pos = this.pos.relToPlayer(game),
            spr = this.getSprite(game);
      if (spr) {
        ctx.drawImage(spr, pos.x - (spr.naturalWidth - BLOCK_WIDTH)/2,
                           pos.y - (spr.naturalHeight - BLOCK_WIDTH));
      } else {
        Render.drawRect(ctx, pos, this.fillStyle);
      }
    }).bind(this), this.pos.y + this.height)];
  }

  move(offset) {
    this.pos = this.pos.add(offset);
  }

  moveTo(pos) {
    this.pos = pos;
  }

  static register(entityId, entityClass, fillStyle, spritePath=undefined) {
    if (entities.has(entityId)) {
      throw new Error(`Entity ID ${entityId} is already in use.`);
    } else {
      entities.set(entityId, entityClass);
      entityClass.prototype.spritePath = spritePath;
      entityClass.prototype.fillStyle = fillStyle;
    }
  }

  static getById(entityId) {
    const entityClass = entities.get(entityId);
    if (entityClass) {
      return entityClass;
    } else {
      throw new Error(`Entity ID ${entityId} not found.`);
    }
  }

  static fromJSON(obj) {
    const entityId     = obj["entity_id"],
          entityClass  = Entity.getById(entityId),
          entityName   = obj["name"],
          entityPos    = Vec.fromJSON(obj["pos"]),
          entityVel    = Vec.fromJSON(obj["velocity"]),
          entityFacing = Dir.strToDir(obj["facing"]);
    return new entityClass(entityName, entityPos, entityVel, entityFacing);
  }
}

class Walker extends Entity {
  getSpritePath(game) {
    return "";
  }
}
Entity.register("walker", Walker, "#323232");

class Stander extends Entity {
  getSpritePath(game) {
    return `npcs/${this.name}.png`;
  }
}
Entity.register("stander", Stander, "#323232");

export {Entity, Walker, Stander};
