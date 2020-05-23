"use strict";

import {Battle, BattleMenu} from "./index/battle.mjs";
import {BLOCK_WIDTH, DEFAULT_SAMPLE_RATE, PLAYER_SPEED,
        SCALE_FACTOR, SPEED_MULTIPLIER, SERVER_URL}
        from "./index/config.mjs";
import {ContextMenus} from "./index/contextmenu.mjs";
import {Entity} from "./index/entity.mjs";
import {Dir, Vec} from "./index/geometry.mjs";
import {Player, OtherPlayer} from "./index/player.mjs";
import {Render} from "./index/render.mjs";
import {SampleRateSlider} from "./index/slider.mjs";
import {UsernameNotice, GameLog, MenuItem, Menu,
        DialogueState, DialogueBox} from "./index/textbox.mjs";
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
    this.canvasCtx = this.makePage(username);
    this.pressedKeys = new Set();
    this.playerObj = null;
    this.otherPlayerObjs = [];
    this.map = [];
    this.entities = [];
    this.username = username;
    this.usernameNotice = null;
    this.gameLog = null;
    this.menu = null;
    this.dialogueBox = null;
    this.sampleRateSlider = null;
    this.battleMenu = null;
    this.scaled = false;
    this.contextMenu = ContextMenus.MAP;
    this.sampleRate = DEFAULT_SAMPLE_RATE;
    this.registerKeyListeners();
  }

  makePage() {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d", {alpha: false});
    canvas.innerHTML =
      "Oops! Something went wrong. Your browser might not support this game.";
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    document.body.innerHTML = "";
    document.body.style.backgroundColor = "white";
    document.body.style.overflow = "hidden";
    document.body.appendChild(canvas);
    return ctx;
  }

  registerKeyListeners() {
    addEventListener("keydown", e => this.pressedKeys.add(e.keyCode), false);
    addEventListener("keyup", e => this.pressedKeys.delete(e.keyCode), false);
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
  main();
}
document.getElementById("playbutton").addEventListener("click", startGame, false);

// ----------- GAME LOGIC -----------
function initialize() {
  game.usernameNotice = new UsernameNotice(game);
  game.gameLog = new GameLog(game, 250);
  game.menu = new Menu(game, 250);
  game.menu.addItem(game, new MenuItem("Profile"));
  game.menu.addItem(game, new MenuItem("Inventory"));
  game.dialogueBox = new DialogueBox(500, 100);
  game.sampleRateSlider = new SampleRateSlider(game);
}

function handleWSMessage(e) {
  console.log(e);
  if (e.data.startsWith("world|")) {
    const VERSION = "0.1.0",
          parts   = e.data.split("|"),
          world   = JSON.parse(parts.slice(1)),
          tiles   = world.tiles,
          spawn   = new Vec(world.spawn_pos.x, world.spawn_pos.y);
    if (world.version === VERSION) {
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
      game.entities = world.entities.map(Entity.fromJSON);
      if (game.playerObj) {
        game.playerObj.pos = spawn;
      } else {
        game.playerObj = new Player(spawn);
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
    for (let i = 1; i < parts.length; i += 3) {
      let username = parts[i],
          posX     = parseFloat(parts[i+1]),
          posY     = parseFloat(parts[i+2]),
          pos      = new Vec(posX, posY);
      game.otherPlayerObjs.push(new OtherPlayer(pos, username));
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
    game.contextMenu = ContextMenus.BATTLE;
    game.battle = new Battle();
  } else if (e.data.startsWith("battlemovereq")) {
    let parts = e.data.split("|"),
        moves = parts.slice(1);
    game.battleMenu = new BattleMenu(game, moves);
  } else if (e.data.startsWith("battlestatus")) {
    let parts = e.data.split("|"),
        playerHp = parseInt(parts[1]),
        enemyHp = parseInt(parts[2]);
    game.battle.playerHp = playerHp;
    game.battle.enemyHp = enemyHp;
  } else if (e.data.startsWith("battleend")) {
    game.contextMenu = ContextMenus.MAP;
    game.battle = null;
  }
}

function update(dt) {
  if (game.contextMenu === ContextMenus.MAP) {
    if (game.playerObj) {
      let moveStr = "",
          multiplier = 1,
          fastmove = false;
      if (game.pressedKeys.has(SHIFT)) {
        multiplier = SPEED_MULTIPLIER;
        fastmove = true;
      }

      if (game.pressedKeys.has(KEY_LEFT)) {
        moveStr += "l";
        game.playerObj.move(new Vec(-PLAYER_SPEED*dt*multiplier, 0));
        game.playerObj.facing = Dir.LEFT;
      }
      if (game.pressedKeys.has(KEY_RIGHT)) {
        moveStr += "r";
        game.playerObj.move(new Vec(PLAYER_SPEED*dt*multiplier, 0));
        game.playerObj.facing = Dir.RIGHT;
      }
      if (game.pressedKeys.has(KEY_UP)) {
        moveStr += "u";
        game.playerObj.move(new Vec(0, -PLAYER_SPEED*dt*multiplier));
        game.playerObj.facing = Dir.UP;
      }
      if (game.pressedKeys.has(KEY_DOWN)) {
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
      if (game.pressedKeys.has(Z_KEY)) {
        game.ws.send("interact");
        game.pressedKeys.delete(Z_KEY);
      }
    }
  } else if (game.contextMenu === ContextMenus.LOG) {
    if (game.pressedKeys.has(KEY_UP)) {
      game.gameLog.scrollUp();
      game.pressedKeys.delete(KEY_UP);
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      game.gameLog.scrollDown();
      game.pressedKeys.delete(KEY_DOWN);
    }
    if (game.pressedKeys.has(X_KEY)) {
      game.gameLog.clear(game);
      game.pressedKeys.delete(X_KEY);
    }
  } else if (game.contextMenu === ContextMenus.MENU) {
    if (game.pressedKeys.has(KEY_UP)) {
      game.menu.cursorUp(game);
      game.pressedKeys.delete(KEY_UP);
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      game.menu.cursorDown(game);
      game.pressedKeys.delete(KEY_DOWN);
    }
  } else if (game.contextMenu === ContextMenus.DIALOGUE) {
    if (game.pressedKeys.has(KEY_UP)) {
      game.dialogueBox.onUpArrow(game);
      game.pressedKeys.delete(KEY_UP);
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      game.dialogueBox.onDownArrow(game);
      game.pressedKeys.delete(KEY_DOWN);
    }
    if (game.pressedKeys.has(Z_KEY)) {
      if (game.dialogueBox.state === DialogueState.CHOOSE) {
        let option = game.dialogueBox.getOptionSelected(),
            uuid   = game.dialogueBox.entityUuid;
        game.ws.send("dialoguechoose|"+uuid+"|"+option.toString());
      } else {
        game.ws.send("interact");
      }
      game.pressedKeys.delete(Z_KEY);
    }
  } else if (game.contextMenu === ContextMenus.BATTLE) {
    if (game.pressedKeys.has(KEY_UP)) {
      game.battleMenu.cursorUp(game);
      game.pressedKeys.delete(KEY_UP);
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      game.battleMenu.cursorDown(game);
      game.pressedKeys.delete(KEY_DOWN);
    }
    if (game.pressedKeys.has(Z_KEY)) {
      let option = game.battleMenu.getOptionSelected();
      game.ws.send("battlemove|"+option.toString());
      game.battleMenu.resetSelected();
      game.pressedKeys.delete(Z_KEY);
    }
  }
  if (game.contextMenu !== ContextMenus.DIALOGUE
      && game.contextMenu !== ContextMenus.BATTLE) {
    if (game.pressedKeys.has(A_KEY)) {
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
      game.pressedKeys.delete(A_KEY);
    } else if (game.pressedKeys.has(C_KEY)) {
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
      game.pressedKeys.delete(C_KEY);
    }
  }
}

function render(dt) {
  let ctx = game.canvasCtx;

  let width  = document.body.clientWidth,
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
    game.battle.render(game);
    game.battleMenu.render(game);
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
      game.gameLog.render(game);
      game.menu.render(game);
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
      game.ws.send("getupdates");
      setTimeout(getplayers, 1000/game.sampleRate);
    };
    getplayers();
  };
  game.ws.onmessage = handleWSMessage;
}
