"use strict";

import {BattleMenu} from "./index/battle.mjs";
import {BLOCK_WIDTH, DEFAULT_SAMPLE_RATE, PLAYER_SPEED,
        SCALE_FACTOR, SPEED_MULTIPLIER, SERVER_URL}
        from "./index/config.mjs";
import {ContextMenus} from "./index/contextmenu.mjs";
import {Cutscene} from "./index/cutscene.mjs";
import {DeathScreen} from "./index/death.mjs";
import {Entity} from "./index/entity.mjs";
import {Dir, Vec} from "./index/geometry.mjs";
import {KeyBinding} from "./index/keybinding.mjs";
import {Player, OtherPlayer} from "./index/player.mjs";
import {Render} from "./index/render.mjs";
import {SampleRateSlider} from "./index/slider.mjs";
import {UsernameNotice, CutsceneSkipInstruction,
        GameLog, MenuItem, Menu, DialogueState,
        DialogueBox} from "./index/textbox.mjs";
import {Tile} from "./index/tile.mjs";

const SHIFT = 16;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const A_KEY = 65;
const C_KEY = 67;
const X_KEY = 88;
const Z_KEY = 90;

var game;

class Game {
  constructor(ws, username) {
    this.ws = ws;
    this.username = username;
    this.canvasCtx = null;
    this.playerObj = null;
    this.otherPlayerObjs = [];
    this.map = [];
    this.entities = [];
    this.usernameNotice = null;
    this.cutsceneSkipInstruction = null;
    this.gameLog = null;
    this.menu = null;
    this.dialogueBox = null;
    this.sampleRateSlider = null;
    this.battleMenu = null;
    this.deathScreen = null;
    this.keyBinding = new KeyBinding();
    this.scaled = false;
    this.contextMenu = ContextMenus.MAP;
    this.sampleRate = DEFAULT_SAMPLE_RATE;
    this.makePage();
  }

  makePage() {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d", {alpha: false});
    canvas.innerHTML =
      "Oops! Something went wrong. Your browser might not support this game.";
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    document.body.innerHTML = "";
    document.body.style.overflow = "hidden";
    document.body.appendChild(canvas);
    this.canvasCtx = ctx;
  }

  clearMap() {
    this.map = [];
  }

  scale() {
    this.scaled = true;
    this.canvasCtx.setTransform(SCALE_FACTOR, 0, 0, SCALE_FACTOR, 0, 0);
  }

  unscale() {
    this.scaled = false;
    this.canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  getScaledWidth() {
    if (this.scaled) {
      return this.canvasCtx.canvas.width / SCALE_FACTOR;
    } else {
      return this.canvasCtx.canvas.width;
    }
  }

  getScaledHeight() {
    if (this.scaled) {
      return this.canvasCtx.canvas.height / SCALE_FACTOR;
    } else {
      return this.canvasCtx.canvas.height;
    }
  }

  getPlayerDrawPos() {
    return new Vec(Math.floor(game.getScaledWidth()/2),
                   Math.floor(game.getScaledHeight()/2));
  }

  getEntity(uuid) {
    return this.entities.find(e => e.uuid === uuid);
  }
}

// ----------- ENTRY POINT -----------
function startGame() {
  let username = document.getElementById("username").value;
  let ws = new WebSocket(SERVER_URL);
  game = new Game(ws, username);
  ws.onclose = function(){
    alert("The server has been reloaded! Please refresh.");
  };
  main();
}
document.getElementById("playbutton").addEventListener("click", startGame, false);

// ----------- GAME LOGIC -----------
function initialize() {
  game.keyBinding.addKeyBind("moveleft", "ArrowLeft");
  game.keyBinding.addKeyBind("moveup", "ArrowUp");
  game.keyBinding.addKeyBind("moveright", "ArrowRight");
  game.keyBinding.addKeyBind("movedown", "ArrowDown");
  game.keyBinding.addKeyBind("scrollleft", "ArrowLeft");
  game.keyBinding.addKeyBind("scrollup", "ArrowUp");
  game.keyBinding.addKeyBind("scrollright", "ArrowRight");
  game.keyBinding.addKeyBind("scrolldown", "ArrowDown");
  game.keyBinding.addKeyBind("fastmove", "ShiftLeft");
  game.keyBinding.addKeyBind("openlog", "KeyA");
  game.keyBinding.addKeyBind("clearlog", "KeyX");
  game.keyBinding.addKeyBind("openmenu", "KeyC");
  game.keyBinding.addKeyBind("tag", "KeyZ");
  game.keyBinding.addKeyBind("interact", "KeyZ");
  game.keyBinding.addKeyBind("primarykey", "KeyZ");
  game.keyBinding.addKeyBind("skipcutscene", "KeyX");
  game.usernameNotice = new UsernameNotice();
  game.cutsceneSkipInstruction = new CutsceneSkipInstruction();
  game.gameLog = new GameLog(game, 250);
  game.menu = new Menu(game, 250);
  game.menu.addItem(game, new MenuItem("Profile", function(){}));
  game.menu.addItem(game, new MenuItem("Inventory", function(){}));
  game.menu.addItem(game, new MenuItem("Controls", function(){
    game.contextMenu = ContextMenus.NONE;
    game.keyBinding.createPage(game);
  }));
  game.dialogueBox = new DialogueBox(500, 100);
  game.sampleRateSlider = new SampleRateSlider(game);
  game.deathScreen = new DeathScreen(game);
}

function handleWSMessage(e) {
  if (e.data.startsWith("world|")) {
    const VERSION = "0.2.0",
          parts   = e.data.split("|"),
          world   = JSON.parse(parts.slice(1)),
          tiles   = world["tiles"],
          spawn   = Vec.fromJSON(world["spawn_pos"]);
    if (world["version"] === VERSION) {
      game.clearMap();
      let map = [];
      for (let j = 0; j < tiles.length; j++) {
        let rowTiles = [];
        for (let i = 0; i < tiles[j].length; i++) {
          const pos = new Vec(BLOCK_WIDTH * i, BLOCK_WIDTH * j),
                t = Tile.fromJSON(tiles[j][i], pos);
          rowTiles.push(t);
        }
        map.push(rowTiles);
      }
      game.map = map;
      game.entities = world["entities"].map(Entity.fromJSON);
      if (game.playerObj) {
        game.playerObj.pos = spawn;
      } else {
        game.playerObj = new Player(spawn);
      }
      game.cutscenes = world["cutscenes"].map(Cutscene.fromJSON);
      if (game.cutscenes.length > 0) {
        game.contextMenu = ContextMenus.CUTSCENE;
      }
    }
  } else if (e.data.startsWith("movedto|")) {
    let parts = e.data.split("|"),
        newX  = parseFloat(parts[1]),
        newY  = parseFloat(parts[2]);
    game.playerObj.moveTo(new Vec(newX, newY));
  } else if (e.data.startsWith("signtext|")) {
    let parts = e.data.split("|"),
        text  = parts.slice(1).join("|");
    game.gameLog.addMsg(game, "The sign reads: " + text);
  } else if (e.data.startsWith("players|")) {
    let parts = e.data.split("|");
    game.otherPlayerObjs = [];
    if (parts[1]) {
      for (let i = 1; i < parts.length; i += 3) {
        let username = parts[i],
            posX     = parseFloat(parts[i+1]),
            posY     = parseFloat(parts[i+2]),
            pos      = new Vec(posX, posY);
        game.otherPlayerObjs.push(new OtherPlayer(pos, username));
      }
    }
  } else if (e.data.startsWith("entities|")) {
    let parts = e.data.split("|");
    game.entities = parts.slice(1)
                         .filter(Boolean)
                         .map(e => Entity.fromJSON(JSON.parse(e)));
  } else if (e.data.startsWith("dialogue|")) {
    let parts = e.data.split("|"),
        uuid = parts[1],
        text = parts.slice(2).join("|");
    game.contextMenu = ContextMenus.DIALOGUE;
    game.dialogueBox.setText(game, text, uuid);
  } else if (e.data.startsWith("dialoguechoice|")) {
    let parts = e.data.split("|"),
        uuid = parts[1],
        textOptions = parts.slice(2);
    game.contextMenu = ContextMenus.DIALOGUE;
    game.dialogueBox.setOptions(game, textOptions, uuid);
  } else if (e.data.startsWith("dialogueend")) {
    game.contextMenu = ContextMenus.MAP;
    game.dialogueBox.endDialogue();
  } else if (e.data.startsWith("tag")) {
    let parts = e.data.split("|"),
        tagging_player = parts[1],
        tagged_player = parts[2];
    if (game.username === tagging_player) {
      game.gameLog.addMsg(game, "You tagged " + tagged_player + "!");
    } else if (game.username === tagged_player) {
      game.gameLog.addMsg(game, "You were tagged by " + tagging_player + "!");
    } else {
      game.gameLog.addMsg(game, tagging_player + " tagged " + tagged_player + "!");
    }
  } else if (e.data.startsWith("battlestart")) {
    let parts = e.data.split("|"),
        side = parts[1];
    game.contextMenu = ContextMenus.BATTLE;
    game.battleMenu = new BattleMenu(side);
  } else if (e.data.startsWith("battlemovereq")) {
    let parts = e.data.split("|"),
        combatantUUID = parts[1];
    game.battleMenu.handleMoveRequest(game, combatantUUID);
  } else if (e.data.startsWith("battlestatus")) {
    let parts = e.data.split("|"),
        battle = JSON.parse(parts[1]);
    game.battleMenu.setBattle(game, battle);
  } else if (e.data.startsWith("battleend")) {
    game.contextMenu = ContextMenus.MAP;
    game.battleMenu = null;
  } else if (e.data.startsWith("death")) {
    game.contextMenu = ContextMenus.DEATH;
  }
}

function update(dt) {
  if (game.contextMenu === ContextMenus.MAP) {
    if (game.playerObj) {
      let moveStr = "",
          multiplier = 1,
          fastmove = false;
      if (game.keyBinding.checkIfPressed("fastmove")) {
        multiplier = SPEED_MULTIPLIER;
        fastmove = true;
      }

      if (game.keyBinding.checkIfPressed("moveleft")) {
        moveStr += "l";
        game.playerObj.move(new Vec(-PLAYER_SPEED*dt*multiplier, 0));
        game.playerObj.facing = Dir.LEFT;
      }
      if (game.keyBinding.checkIfPressed("moveright")) {
        moveStr += "r";
        game.playerObj.move(new Vec(PLAYER_SPEED*dt*multiplier, 0));
        game.playerObj.facing = Dir.RIGHT;
      }
      if (game.keyBinding.checkIfPressed("moveup")) {
        moveStr += "u";
        game.playerObj.move(new Vec(0, -PLAYER_SPEED*dt*multiplier));
        game.playerObj.facing = Dir.UP;
      }
      if (game.keyBinding.checkIfPressed("movedown")) {
        moveStr += "d";
        game.playerObj.move(new Vec(0, PLAYER_SPEED*dt*multiplier));
        game.playerObj.facing = Dir.DOWN;
      }
      if (moveStr) {
        if (fastmove) {
          game.ws.send("fastmove|" + moveStr);
          game.playerObj.running = true;
        } else {
          game.ws.send("move|" + moveStr);
          game.playerObj.running = false;
        }
        game.playerObj.animate(dt);
      } else {
        game.playerObj.stopMoving();
      }
      if (game.keyBinding.checkIfPressed("interact")) {
        game.ws.send("interact");
        game.keyBinding.consume("interact");
      }
    }
  } else if (game.contextMenu === ContextMenus.LOG) {
    if (game.keyBinding.checkIfPressed("scrollup")) {
      game.gameLog.scrollUp();
      game.keyBinding.consume("scrollup");
    }
    if (game.keyBinding.checkIfPressed("scrolldown")) {
      game.gameLog.scrollDown();
      game.keyBinding.consume("scrolldown");
    }
    if (game.keyBinding.checkIfPressed("clearlog")) {
      game.gameLog.clear(game);
      game.keyBinding.consume("clearlog");
    }
  } else if (game.contextMenu === ContextMenus.MENU) {
    if (game.keyBinding.checkIfPressed("scrollup")) {
      game.menu.cursorUp(game);
      game.keyBinding.consume("scrollup");
    }
    if (game.keyBinding.checkIfPressed("scrolldown")) {
      game.menu.cursorDown(game);
      game.keyBinding.consume("scrolldown");
    }
    if (game.keyBinding.checkIfPressed("primarykey")) {
      game.menu.handlePress();
      game.keyBinding.consume("primarykey");
    }
  } else if (game.contextMenu === ContextMenus.DIALOGUE) {
    if (game.keyBinding.checkIfPressed("scrollup")) {
      game.dialogueBox.onUpArrow(game);
      game.keyBinding.consume("scrollup");
    }
    if (game.keyBinding.checkIfPressed("scrolldown")) {
      game.dialogueBox.onDownArrow(game);
      game.keyBinding.consume("scrolldown");
    }
    if (game.keyBinding.checkIfPressed("primarykey")) {
      if (game.dialogueBox.state === DialogueState.CHOOSE) {
        let option = game.dialogueBox.getOptionSelected(),
            uuid   = game.dialogueBox.entityUuid;
        game.ws.send("dialoguechoose|"+uuid+"|"+option.toString());
      } else {
        game.ws.send("interact");
      }
      game.keyBinding.consume("primarykey");
    }
  } else if (game.contextMenu === ContextMenus.BATTLE) {
    if (game.battleMenu) {
      if (game.keyBinding.checkIfPressed("scrollleft")) {
        game.battleMenu.tabLeft(game);
        game.keyBinding.consume("scrollleft");
      }
      if (game.keyBinding.checkIfPressed("scrollup")) {
        game.battleMenu.cursorUp(game);
        game.keyBinding.consume("scrollup");
      }
      if (game.keyBinding.checkIfPressed("scrollright")) {
        game.battleMenu.tabRight(game);
        game.keyBinding.consume("scrollright");
      }
      if (game.keyBinding.checkIfPressed("scrolldown")) {
        game.battleMenu.cursorDown(game);
        game.keyBinding.consume("scrolldown");
      }
      if (game.keyBinding.checkIfPressed("primarykey")) {
        game.battleMenu.handleEnter(game);
        game.keyBinding.consume("primarykey");
      }
    }
  } else if (game.contextMenu === ContextMenus.DEATH) {
    if (game.keyBinding.checkIfPressed("primarykey")) {
      game.contextMenu = ContextMenus.MAP;
      game.keyBinding.consume("primarykey");
    }
  } else if (game.contextMenu === ContextMenus.CUTSCENE) {
    if (game.keyBinding.checkIfPressed("skipcutscene")) {
      game.contextMenu = ContextMenus.MAP;
      game.cutscenes[0].cleanup(game);
      game.cutscenes = [];
      game.keyBinding.consume("skipcutscene")
    } else {
      if (game.cutscenes.length > 0) {
        if (!game.cutscenes[0].update(game, dt)) {
          game.cutscenes.shift();
        }
      } else {
        game.contextMenu = ContextMenus.MAP;
      }
    }
  }
  if (game.contextMenu === ContextMenus.LOG
      || game.contextMenu === ContextMenus.MENU
      || game.contextMenu === ContextMenus.MAP) {
    if (game.keyBinding.checkIfPressed("openlog")) {
      if (game.contextMenu === ContextMenus.LOG) {
        game.contextMenu = ContextMenus.MAP;
        game.gameLog.unfocus(game);
      } else {
        if (game.contextMenu === ContextMenus.MENU) {
          game.menu.unfocus(game);
        }
        game.contextMenu = ContextMenus.LOG;
        game.gameLog.focus(game);
      }
      game.keyBinding.consume("openlog");
    } else if (game.keyBinding.checkIfPressed("openmenu")) {
      if (game.contextMenu === ContextMenus.MENU) {
        game.contextMenu = ContextMenus.MAP;
        game.menu.unfocus(game);
      } else {
        if (game.contextMenu === ContextMenus.LOG) {
          game.gameLog.unfocus(game);
        }
        game.contextMenu = ContextMenus.MENU;
        game.menu.focus(game);
      }
      game.keyBinding.consume("openmenu");
    }
  }
}

function render(dt) {
  let ctx = game.canvasCtx,
      width  = document.body.clientWidth,
      height = document.body.clientHeight;
  if (ctx.canvas.width != width) {
    ctx.canvas.width = width;
  }
  if (ctx.canvas.height != height) {
    ctx.canvas.height = height;
  }

  game.unscale();
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, width, height);

  if (game.contextMenu === ContextMenus.BATTLE) {
    if (game.battleMenu) {
      game.battleMenu.render(game);
    }
  } else if (game.contextMenu === ContextMenus.DEATH) {
    game.deathScreen.render(game);
  } else {
    if (game.playerObj) {
      game.scale();
      let renderList = [];
      for (let j = 0; j < game.map.length; j++) {
        for (let i = 0; i < game.map[j].length; i++) {
          let tile = game.map[j][i];
          renderList.push(...tile.render(game));
          tile.animate(dt);
        }
      }
      for (const entity of game.entities) {
        renderList.push(...entity.render(game));
      }
      for (const obj of game.otherPlayerObjs) {
        renderList.push(...obj.render(game));
      }
      renderList.push(...game.playerObj.render(game));
      Render.renders(renderList);

      game.unscale();
      game.usernameNotice.render(game);
      if (game.contextMenu === ContextMenus.CUTSCENE) {
        game.cutsceneSkipInstruction.render(game);
      } else {
        game.gameLog.render(game);
        game.menu.render(game);
      }
      game.dialogueBox.render(game);
      game.sampleRateSlider.render(game);
    }
  }
}

function main() {
  let w = window;
  let requestAnimationFrame =
    w.requestAnimationFrame || w.webkitRequestAnimationFrame
    || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

  initialize();
  game.ws.onopen = function(e) {
    game.ws.send(game.username);
    let gameLoop = function(then) {
      return function(now) {
        let dt = (now - then)/1000;
        update(dt);
        render(dt);
        requestAnimationFrame(gameLoop(now));
      };
    };
    requestAnimationFrame(gameLoop(null));
    let getplayers = function() {
      if (game.contextMenu === ContextMenus.LOG
          || game.contextMenu === ContextMenus.MENU
          || game.contextMenu === ContextMenus.MAP
          || game.contextMenu === ContextMenus.DIALOGUE) {
        game.ws.send("getupdates");
      }
      setTimeout(getplayers, 1000/game.sampleRate);
    };
    getplayers();
  };
  game.ws.onmessage = handleWSMessage;
}
