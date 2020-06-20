"use strict";

import {Vec} from "./geometry.mjs";

var cutscenes = new Map();

class Cutscene {
  constructor(obj) {
    this.sceneType = obj["scene_type"];
  }

  update(game, dt) {} //Return false if cutscene is over, true otherwise.

  static register(sceneType, sceneClass) {
    if (cutscenes.has(sceneType)) {
      throw new Error(`Scene type ${sceneType} is already in use.`);
    } else {
      cutscenes.set(sceneType, sceneClass);
    }
  }

  static getByType(sceneType) {
    const sceneClass = cutscenes.get(sceneType);
    if (sceneClass) {
      return sceneClass;
    } else {
      throw new Error(`Scene type ${sceneType} not found.`);
    }
  }

  static fromJSON(obj) {
    const sceneType  = obj["scene_type"],
          sceneClass = Cutscene.getByType(sceneType);
    return new sceneClass(obj);
  }
}

class WaitScene extends Cutscene {
  constructor(obj) {
    super(obj);
    this.waitDuration = obj["wait_duration"];
  }

  update(game, dt) {
    this.waitDuration -= dt;
    if (this.waitDuration <= 0) {
      return false;
    } else {
      return true;
    }
  }
}
Cutscene.register("wait", WaitScene)

class MoveScene extends Cutscene {
  constructor(obj) {
    super(obj);
    this.uuid = obj["uuid"];
    this.moveDestination = Vec.fromJSON(obj["move_destination"]);
    this.moveDuration = obj["move_duration"];
    this.velocity = null;
  }

  update(game, dt) {
    let ent = game.entities.find(e => e.uuid === this.uuid);
    if (!ent) {return;}
    if (!this.velocity) {
      let startPos     = ent.pos,
          displacement = this.moveDestination.relativeTo(startPos);
      this.velocity = displacement.div(this.moveDuration);
    }
    ent.move(this.velocity.mul(dt));
    this.moveDuration -= dt;
    if (this.moveDuration <= 0) {
      return false;
    } else {
      return true;
    }
  }
}
Cutscene.register("move", MoveScene)

class DialogueScene extends Cutscene {
  constructor(obj) {
    super(obj);
    this.uuid = obj["uuid"];
    this.dialogue = obj["dialogue"];
    this.activated = false;
  }

  update(game, dt) {
    if (game.keyBinding.checkIfPressed("primarykey")) {
      game.keyBinding.consume("primarykey");
      game.dialogueBox.endDialogue();
      return false;
    }
    if (!this.activated) {
      game.dialogueBox.setText(game, this.dialogue, this.uuid);
      this.activated = true;
    }
    return true;
  }
}
Cutscene.register("dialogue", DialogueScene)

export {Cutscene};
