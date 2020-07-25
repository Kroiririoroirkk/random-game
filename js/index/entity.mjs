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

  render(game) {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(game),
            spr = this.constructor._sprite,
            img = spr ? Images.getImage(spr) : null;
      if (img) {
        ctx.drawImage(img, pos.x - (img.naturalWidth - BLOCK_WIDTH)/2,
                           pos.y - (img.naturalHeight - BLOCK_WIDTH));
      } else {
        Render.drawRect(ctx, pos, this.constructor._fillStyle);
      }
    }).bind(this), this.pos.y + this.height)];
  }

  move(offset) {
    this.pos = this.pos.add(offset);
  }

  moveTo(pos) {
    this.pos = pos;
  }

  static register(entityId, entityClass,
                          sprite=null, fillStyle="rgb(50, 50, 50)") {
    if (entities.has(entityId)) {
      throw new Error(`Entity ID ${entityId} is already in use.`);
    } else {
      entities.set(entityId, entityClass);
      entityClass._sprite = sprite;
      entityClass._fillStyle = fillStyle;
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

class Walker extends Entity {}
Entity.register("walker", Walker);

class Stander extends Entity {}
Entity.register("stander", Stander, "npc-2-still.png");

export {Entity, Walker, Stander};
