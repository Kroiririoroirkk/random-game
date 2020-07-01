"use strict";

import {Images} from "./render.mjs";
import {wrapText} from "./textbox.mjs";

class Species {
  constructor(id, displayName, leftSprite, rightSprite) {
    this.id = id;
    this.displayName = displayName;
    this.leftSprite = leftSprite;
    this.rightSprite = rightSprite;
  }

  static getById(id) {
    for (const species of Object.values(Species)) {
      if (species instanceof Species && species.id === id) {
        return species;
      }
    }
  }
}
Species.HUMAN = new Species("human", "Human", "char-right-still.png", "char-left-still.png");
Species.SCARPFALL = new Species("scarpfall", "Scarpfall", "terrekin/scarpfall-left.png", "terrekin/scarpfall-right.png");
Species.ORELICK = new Species("orelick", "Orelick", "terrekin/orelick-left.png", "terrekin/orelick-right.png");
Species.POUFFLE = new Species("pouffle", "Poufflé", "terrekin/pouffle-left.png", "terrekin/pouffle-right.png");
Species.LAVADOREY = new Species("lavadorey", "Lavadorey", "terrekin/lavadorey-left.png", "terrekin/lavadorey-right.png");
Species.DONNERLO = new Species("donnerlo", "Donnerlo", "terrekin/donnerlo-left.png", "terrekin/donnerlo-right.png");
Species.VINELETTE = new Species("vinelette", "Vinelette", "terrekin/vinelette-left.png", "terrekin/vinelette-right.png");
Species.WHIRLYBIRD = new Species("whirlybird", "Whirlybird", "terrekin/whirlybird-left.png", "terrekin/whirlybird-right.png");

class Stats {
  constructor(hp, attack, defense, mattack, mdefense, speed, charisma, dex, stam) {
    this.hp = hp;
    this.attack = attack;
    this.defense = defense;
    this.mattack = mattack;
    this.mdefense = mdefense;
    this.speed = speed;
    this.charisma = charisma;
    this.dex = dex;
    this.stam = stam;
  }

  static fromJSON(o) {
    return new Stats(o["hp"], o["attack"], o["defense"], o["mattack"], o["mdefense"],
                     o["speed"], o["charisma"], o["dex"], o["stam"]);
  }
}

class TerrekinElement {
  constructor(id, displayName) {
    this.id = id;
    this.displayName = displayName;
  }

  static getById(id) {
    for (const element of Object.values(TerrekinElement)) {
      if (element instanceof TerrekinElement && element.id === id) {
        return element;
      }
    }
  }
}
TerrekinElement.UNTYPED = new TerrekinElement("untyped", "Untyped");
TerrekinElement.EARTH = new TerrekinElement("earth", "Earth");
TerrekinElement.METAL = new TerrekinElement("metal", "Metal");
TerrekinElement.WATER = new TerrekinElement("water", "Water");
TerrekinElement.AIR = new TerrekinElement("air", "Air");
TerrekinElement.FIRE = new TerrekinElement("fire", "Fire");
TerrekinElement.LIGHTNING = new TerrekinElement("lightning", "Lightning");
TerrekinElement.PLANT = new TerrekinElement("plant", "Plant");

class MoveType {
  constructor(id, displayName) {
    this.id = id;
    this.displayName = displayName;
  }

  static getById(id) {
    for (const moveType of Object.values(MoveType)) {
      if (moveType instanceof MoveType && moveType.id === id) {
        return moveType;
      }
    }
  }
}
MoveType.PHYSICAL = new MoveType("physical", "Physical");
MoveType.MAGIC = new MoveType("magic", "Magic");
MoveType.NON_ATTACKING = new MoveType("non_attacking", "Non-attacking");

class Move {
  constructor(displayName, element, type, staminaDraw, power, moveTime, accuracy, description) {
    this.displayName = displayName;
    this.element = element;
    this.type = type;
    this.staminaDraw = staminaDraw;
    this.power = power;
    this.moveTime = moveTime;
    this.accuracy = accuracy;
    this.description = description;
  }

  static fromJSON(o) {
    return new Move(
      o["name"],
      TerrekinElement.getById(o["element"]),
      MoveType.getById(o["type"]),
      o["stamina_draw"],
      o["power"],
      o["move_time"],
      o["accuracy"],
      o["description"]
    );
  }
}

class Combatant {
  static fromJSON(o) {
    if (Object.prototype.hasOwnProperty.call(o, "stats")) {
      return FullCombatant.fromJSON(o);
    } else {
      return PartialCombatant.fromJSON(o);
    }
  }
}

class FullCombatant extends Combatant {
  constructor(species, level, stats, maxHP, moves) {
    super();
    this.species = species;
    this.level = level;
    this.stats = stats;
    this.maxHP = maxHP;
    this.moves = moves;
  }

  static fromJSON(o) {
    return new FullCombatant(
      Species.getById(o["species"]),
      o["level"],
      Stats.fromJSON(o["stats"]),
      o["max_hp"],
      o["moves"].map(Move.fromJSON)
    );
  }
}

class PartialCombatant extends Combatant {
  constructor(species, level, hpProportion) {
    super();
    this.species = species;
    this.level = level;
    this.hpProportion = hpProportion;
  }

  static fromJSON(o) {
    return new PartialCombatant(
      Species.getById(o["species"]),
      o["level"],
      o["hp_proportion"]
    );
  }
}

class BattleMenuTab {
  constructor(id, displayName) {
    this.id = id;
    this.displayName = displayName;
  }
}
BattleMenuTab.OVERVIEW = new BattleMenuTab("overview", "Overview");
BattleMenuTab.ATTACK = new BattleMenuTab("attack", "Attack");
BattleMenuTab.MOVE = new BattleMenuTab("move", "Move");
BattleMenuTab.ITEM = new BattleMenuTab("item", "Item");
BattleMenuTab.RUN = new BattleMenuTab("run", "Run");
BattleMenuTab.TABS = [
  BattleMenuTab.OVERVIEW,
  BattleMenuTab.ATTACK,
  BattleMenuTab.MOVE,
  BattleMenuTab.ITEM,
  BattleMenuTab.RUN
];

class BattleMenu {
  constructor(side) {
    this.side = side;
    this.oppositeSide = BattleMenu.otherSide(side);
    this.userCombatants = new Map();
    this.opponentCombatants = new Map();
    this.openTab = BattleMenuTab.OVERVIEW;
    this.tabText = [];
    this.currentlySelected = 0;
    this.itemsLength = 0;
    this.combatantUUIDToAttack = null;
    this.userCombatantsOverviewText = [];
    this.opponentCombatantsOverviewText = [];
    this.attackMenuText = [];
  }

  static otherSide(s) {
    if (s === "side1") {
      return "side2";
    } else {
      return "side1";
    }
  }

  handleMoveRequest(game, combatantUUID) {
    this.combatantUUIDToAttack = combatantUUID;
    this.redraw(game);
  }

  setBattle(game, battle) {
    this.userCombatants.clear();
    this.opponentCombatants.clear();
    for (const [uuid, combatant] of Object.entries(battle[this.side])) {
      this.userCombatants.set(uuid, Combatant.fromJSON(combatant))
    }
    for (const [uuid, combatant] of Object.entries(battle[this.oppositeSide])) {
      this.opponentCombatants.set(uuid, Combatant.fromJSON(combatant))
    }
    this.redraw(game);
  }

  redraw(game) {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.tabText = BattleMenuTab.TABS.map(tab =>
      tab === this.openTab ?
        ">" + tab.displayName :
        tab.displayName);
    if (this.openTab === BattleMenuTab.OVERVIEW) {
      let textLines = ["Allies"];
      for (const combatant of this.userCombatants.values()) {
        textLines.push(`${combatant.species.displayName}: HP ${combatant.stats.hp}/${combatant.maxHP}, Stam ${combatant.stats.stam}`);
      }
      this.userCombatantsOverviewText = wrapText(ctx,
        textLines.join(" \n ----- \n "), game.getScaledWidth()*0.6 - 20);
      textLines = ["Enemies"];
      for (const combatant of this.opponentCombatants.values()) {
        textLines.push(`${combatant.species.displayName}: HP ${Math.round(combatant.hpProportion*100)}%`);
      }
      this.opponentCombatantsOverviewText = wrapText(ctx,
        textLines.join(" \n ----- \n "), game.getScaledWidth()*0.4 - 20);
    } else if (this.openTab === BattleMenuTab.ATTACK) {
      this.attackMenuText = [];
      if (this.combatantUUIDToAttack) {
        const combatant = this.userCombatants.get(this.combatantUUIDToAttack);
        this.attackMenuText = wrapText(ctx,
          ["Choose a move:",
          ...combatant.moves.map((move, i) =>
            i === this.currentlySelected ?
              ">" + move.displayName :
              move.displayName)].join(" \n ----- \n "), game.getScaledWidth() - 20);
        this.itemsLength = combatant.moves.length;
      }
    }
  }

  tabLeft(game) {
    if (this.openTab === BattleMenuTab.OVERVIEW) {
      this.openTab = BattleMenuTab.RUN;
    } else if (this.openTab === BattleMenuTab.ATTACK) {
      this.openTab = BattleMenuTab.OVERVIEW;
    } else if (this.openTab === BattleMenuTab.MOVE) {
      this.openTab = BattleMenuTab.ATTACK;
    } else if (this.openTab === BattleMenuTab.ITEM) {
      this.openTab = BattleMenuTab.MOVE;
    } else if (this.openTab === BattleMenuTab.RUN) {
      this.openTab = BattleMenuTab.ITEM;
    }
    this.resetSelected();
    this.itemsLength = 0;
    this.redraw(game);
  }

  tabRight(game) {
    if (this.openTab === BattleMenuTab.OVERVIEW) {
      this.openTab = BattleMenuTab.ATTACK;
    } else if (this.openTab === BattleMenuTab.ATTACK) {
      this.openTab = BattleMenuTab.MOVE;
    } else if (this.openTab === BattleMenuTab.MOVE) {
      this.openTab = BattleMenuTab.ITEM;
    } else if (this.openTab === BattleMenuTab.ITEM) {
      this.openTab = BattleMenuTab.RUN;
    } else if (this.openTab === BattleMenuTab.RUN) {
      this.openTab = BattleMenuTab.OVERVIEW;
    }
    this.resetSelected();
    this.itemsLength = 0;
    this.redraw(game);
  }

  cursorUp(game) {
    this.currentlySelected--;
    if (this.currentlySelected < 0) {
      this.currentlySelected += this.itemsLength;
    }
    this.redraw(game);
  }

  cursorDown(game) {
    this.currentlySelected++;
    if (this.currentlySelected >= this.itemsLength) {
      this.currentlySelected -= this.itemsLength;
    }
    this.redraw(game);
  }

  handleEnter(game) {
    if (this.openTab === BattleMenuTab.ATTACK) {
      let msg = "battlemove|"
                +this.combatantUUIDToAttack+"|"
                +this.getOptionSelected().toString()+"|"
                +this.opponentCombatants.keys().next().value;
      game.ws.send(msg);
      this.resetSelected();
      this.combatantUUIDToAttack = null;
      this.redraw(game);
    }
  }

  getOptionSelected() {
    return this.currentlySelected;
  }

  resetSelected() {
    this.currentlySelected = 0;
  }

  render(game) {
    const LINE_HEIGHT = 24,
          ctx         = game.canvasCtx,
          startingY   = game.getScaledHeight()/2;

    ctx.font = "20px san-serif";

    let combatantY = 64;
    for (const combatant of this.userCombatants.values()) {
      const img = Images.getImage(combatant.species.leftSprite);
      if (img) {
        ctx.drawImage(img,
                      game.getScaledWidth()/4 - 32,
                      combatantY);
      }
      combatantY += 32;
    }
    combatantY = 64;
    for (const combatant of this.opponentCombatants.values()) {
      const img = Images.getImage(combatant.species.rightSprite);
      if (img) {
        ctx.drawImage(img,
                      3*game.getScaledWidth()/4 - 32,
                      combatantY);
      }
      combatantY += 32;
    }

    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(0, startingY-2*LINE_HEIGHT, game.getScaledWidth(), 2*LINE_HEIGHT);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.beginPath();
    ctx.moveTo(0, startingY);
    ctx.lineTo(game.getScaledWidth(), startingY);
    ctx.stroke();

    const tabWidth = game.getScaledWidth()/this.tabText.length;
    ctx.fillStyle = "rgb(255, 255, 255)";
    for (const [i, tab] of this.tabText.entries()) {
      ctx.fillText(tab, i*tabWidth + 10, startingY-LINE_HEIGHT);
    }

    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(0, startingY, game.getScaledWidth(),
                 game.getScaledHeight()/2);

    if (this.openTab === BattleMenuTab.OVERVIEW) {
      ctx.fillStyle = "rgb(255, 255, 255)";
      let y = startingY;
      for (const line of this.userCombatantsOverviewText) {
        y += LINE_HEIGHT;
        ctx.fillText(line, 10, y);
      }
      y = startingY;
      for (const line of this.opponentCombatantsOverviewText) {
        y += LINE_HEIGHT;
        ctx.fillText(line, game.getScaledWidth()*0.6 + 10, y);
      }
    } else if (this.openTab === BattleMenuTab.ATTACK) {
      ctx.fillStyle = "rgb(255, 255, 255)";
      let y = startingY;
      for (const line of this.attackMenuText) {
        y += LINE_HEIGHT;
        ctx.fillText(line, 10, y);
      }
    }
  }
}

export {BattleMenu};
