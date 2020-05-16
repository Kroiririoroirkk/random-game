"use strict";

// ----------- CONSTANTS -----------
const SHIFT = 16;
const SPACE = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const C_KEY = 67;
const L_KEY = 76;
const M_KEY = 77;

const BLOCK_WIDTH = 32;
const PLAYER_WIDTH = 28;
var SCALE_FACTOR = 0.8;

const PLAYER_SPEED = BLOCK_WIDTH*3;
const SPEED_MULTIPLIER = 2;

// ----------- GAME -----------
var game;

const contextMenus = Object.freeze({MAP:1, LOG:2, MENU:3});

class Game {
  constructor(ws, username) {
    this.ws = ws;
    this.canvasCtx = this.makePage(username);
    this.pressedKeys = new Set();
    this.playerObj = null;
    this.otherPlayerObjs = [];
    this.gameObjs = [];
    this.username = username;
    this.gameLog = null;
    this.menu = null;
    this.scaled = false;
    this.contextMenu = contextMenus.MAP;
    this.registerKeyListeners();
  }

  makePage() {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d", {alpha: false});
    canvas.innerHTML = "Oops! Something went wrong. Your browser might not support this game.";
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

  clearGameObjs() {
    this.gameObjs = [];
  }

  addGameObj(obj) {
    this.gameObjs.push(obj);
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
}

// ----------- VEC -----------
class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  relativeTo(p) {
    return new Vec(this.x - p.x, this.y - p.y);
  }

  relToPlayer() {
    return this.relativeTo(game.playerObj.pos).add(game.getPlayerDrawPos());
  }

  add(p) {
    return new Vec(this.x + p.x, this.y + p.y);
  }
}

// ----------- DIRECTION -----------
const dirs = Object.freeze({LEFT:1, UP:2, RIGHT:3, DOWN:4});

// ----------- IMAGES -----------
const images = Object.create(null);

const LOADING = "LOADING";

function loadImage(filename) {
  const image = new Image();
  image.onload = function(){images[filename] = image;};
  image.src = 'img/' + filename;
  images[filename] = LOADING;
}

function getImage(...filenames) {
  for (const filename of filenames) {
    if (filename in images) {
      if (images[filename] !== LOADING) {
        return images[filename];
      }
    } else {
      loadImage(filename);
    }
  }
  return null;
}

class Frame {
  constructor(sprite, time) {
    this.sprite = sprite;
    this.time = time;
  }
}

class Animation {
  constructor(frames) {
    this.frames = frames;
    this.frameIndex = 0;
    this.frameDuration = frames[0].time;
  }

  animate(dt) {
    this.frameDuration -= dt;
    if (this.frameDuration <= 0) {
      this.frameIndex++;
      if (this.frameIndex >= this.frames.length) {
        this.framesIndex %= frames.length;
      }
      this.frameDuration += frames[frameIndex].time;
    }
  }

  getSprite() {
    return this.frames[frameIndex].sprite;
  }
}

// ----------- ENTITY -----------
function drawRect(ctx, pos, fillStyle) {
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(Math.floor(pos.x), Math.floor(pos.y), BLOCK_WIDTH, BLOCK_WIDTH);
  ctx.fillStyle = fillStyle;
  ctx.fillRect(Math.floor(pos.x)+1, Math.floor(pos.y)+1, BLOCK_WIDTH-2, BLOCK_WIDTH-2);
}

class Entity {
  constructor(pos) {
    this.pos = pos;
  }

  render() {
    drawRect(game.canvasCtx, this.pos.relToPlayer(), "rgb(50, 50, 50)");
  }

  move(offset) {
    this.pos = this.pos.add(offset);
  }

  moveTo(pos) {
    this.pos = pos;
  }
}

// ----------- PLAYER -----------
class Player extends Entity {
  constructor(pos) {
    super(pos);
    this.facing = dirs.DOWN;
  }

  getSprite() {
    if (this.facing === dirs.LEFT)  {return getImage("char-left-still.png", "char-down-still.png");}
    if (this.facing === dirs.UP)    {return getImage("char-up-still.png", "char-down-still.png");}
    if (this.facing === dirs.RIGHT) {return getImage("char-right-still.png", "char-down-still.png");}
    if (this.facing === dirs.DOWN)  {return getImage("char-down-still.png");}
  }

  render() {
    const ctx = game.canvasCtx,
          pos = game.getPlayerDrawPos(),
          img = this.getSprite();
    if (img) {
      ctx.drawImage(img, pos.x, pos.y);
    } else {
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(pos.x, pos.y, PLAYER_WIDTH, PLAYER_WIDTH);
      ctx.fillStyle = "rgb(255, 0, 0)";
      ctx.fillRect(pos.x+1, pos.y+1, PLAYER_WIDTH-2, PLAYER_WIDTH-2);
    }
  }
}

// ----------- ENTITIES -----------
class Grass extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    const ctx = game.canvasCtx,
          pos = this.pos.relToPlayer(),
          img = getImage("grass.png");
    if (img) {
      ctx.drawImage(img, pos.x, pos.y);
    } else {
      drawRect(game.canvasCtx, pos, "rgb(0, 255, 0)");
    }
  }
}

class WildGrass extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    const ctx = game.canvasCtx,
          pos = this.pos.relToPlayer(),
          img = getImage("wild-grass.png");
    if (img) {
      ctx.drawImage(img, pos.x, pos.y);
    } else {
      drawRect(game.canvasCtx, pos, "rgb(0, 180, 0)");
    }
  }
}

class Wall extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    const ctx = game.canvasCtx,
          pos = this.pos.relToPlayer(),
          img = getImage("wall.png");
    if (img) {
      ctx.drawImage(img, pos.x, pos.y);
    } else {
      drawRect(game.canvasCtx, this.pos.relToPlayer(), "rgb(210, 105, 30)");
    }
  }
}

class Portal extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    drawRect(game.canvasCtx, this.pos.relToPlayer(), "rgb(0, 0, 0)");
  }
}

class Sign extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    drawRect(game.canvasCtx, this.pos.relToPlayer(), "rgb(255, 255, 0)");
  }
}

class OtherPlayer extends Entity {
  constructor(pos, username) {
    super(pos);
    this.username = username;
  }

  render() {
    const ctx = game.canvasCtx,
          startingX = Math.floor(this.pos.relToPlayer().x),
          startingY = Math.floor(this.pos.relToPlayer().y);
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(startingX, startingY, PLAYER_WIDTH, PLAYER_WIDTH);
    ctx.fillStyle = "rgb(255, 20, 147)";
    ctx.fillRect(startingX+1, startingY+1, PLAYER_WIDTH-2, PLAYER_WIDTH-2);
  }
}

// ----------- TEXT HANDLING -----------
function wrapText(ctx, text, maxWidth) {
  let words = text.split(" "),
      currentLine = words[0],
      lines = [];

  for (var i = 1; i < words.length; i++) {
    if (words[i] === "\n") {
      lines.push(currentLine);
      currentLine = "";
    } else {
      let testLine  = currentLine === "" ?
            words[i] : currentLine + " " + words[i],
          metrics   = ctx.measureText(testLine),
          testWidth = metrics.width;
      if (testWidth < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
  }
  lines.push(currentLine);
  return lines;
}

// ----------- GAME LOG -----------
class GameLog {
  constructor(width) {
    this.width = width;
    this.messageLog = [];
    this.lineStart = 0;
    this.wrappedText = [];
    this.unfocus();
  }

  addMsg(msg) {
    this.messageLog.unshift(msg);
    if (game.contextMenu === contextMenus.LOG) {
      this.focus();
    } else {
      this.unfocus();
    }
  }

  scrollUp() {
    this.lineStart--;
    if (this.lineStart < 0) {
      this.lineStart = 0;
    }
  }

  scrollDown() {
    this.lineStart++;
    if (this.lineStart > this.wrappedText.length) {
      this.lineStart = this.wrappedText.length;
    }
  }

  focus() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      ["Press L to exit the log, C to clear, and arrow keys to scroll.",
      ...this.messageLog]
        .join(" \n ----- \n "), this.width);
  }

  unfocus() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      ["Press L to open the log!",
      ...this.messageLog]
        .join(" \n ----- \n "), this.width);
    this.lineStart = 0;
  }

  clear() {
    this.messageLog = [];
    this.focus();
    this.lineStart = 0;
  }

  render() {
    const LINE_HEIGHT  = 24,
          ctx          = game.canvasCtx,
          renderedText = this.wrappedText.slice(this.lineStart);

    let y = 31;
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(0, y, this.width + 20, LINE_HEIGHT*renderedText.length + 5);

    ctx.fillStyle = "rgb(255, 255, 255)";
    for (const line of renderedText) {
      y += LINE_HEIGHT;
      ctx.fillText(line, 10, y);
    }
  }
}

// ----------- MENU -----------
class MenuItem {
  constructor(text) {
    this.text = text;
  }
}

class Menu {
  constructor(width) {
    this.width = width;
    this.items = [];
    this.wrappedText = [];
    this.currentlySelected = 0;
    this.unfocus();
  }

  addItem(item) {
    this.items.push(item);
    if (game.contextMenu === contextMenus.MENU) {
      this.focus();
    } else {
      this.unfocus();
    }
  }

  focus() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      ["Press M to close the menu, arrow keys to pick an option, and <enter> to choose.",
      ...this.items.map((item, i) =>
        i === this.currentlySelected ?
          ">" + item.text :
          item.text)].join(" \n ----- \n "), this.width);
  }

  unfocus() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      "Press M to open the menu!", this.width);
  }

  cursorUp() {
    this.currentlySelected--;
    if (this.currentlySelected < 0) {
      this.currentlySelected = 0;
    }
    this.focus();
  }

  cursorDown() {
    this.currentlySelected++;
    if (this.currentlySelected >= this.items.length) {
      this.currentlySelected = this.items.length - 1;
    }
    this.focus();
  }

  render() {
    const LINE_HEIGHT = 24,
          ctx         = game.canvasCtx,
          startingX = game.getScaledWidth() - this.width - 20;
    let y = 0;
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(startingX, y, this.width + 20, LINE_HEIGHT*this.wrappedText.length + 5);

    ctx.fillStyle = "rgb(255, 255, 255)";
    for (const line of this.wrappedText) {
      y += LINE_HEIGHT;
      ctx.fillText(line, startingX + 10, y);
    }
  }
}

// ----------- ENTRY POINT -----------
function startGame() {
  let username = document.getElementById("username").value;
  let ws = new WebSocket("wss://terrekin.kroiririoroirkk.repl.co");
  game = new Game(ws, username);
  main();
}

// ----------- GAME LOGIC -----------
function initialize() {
  game.gameLog = new GameLog(250);
  game.menu = new Menu(250);
  game.menu.addItem(new MenuItem("Profile"));
  game.menu.addItem(new MenuItem("Inventory"));
}

function handleWSMessage(e) {
  if (e.data.startsWith("world|")) {
    let parts  = e.data.split("|"),
        spawnX = parseFloat(parts[1]),
        spawnY = parseFloat(parts[2]),
        spawn  = new Vec(spawnX, spawnY),
        map    = parts.slice(3);
    game.clearGameObjs();
    for (let j = 0; j < map.length; j++) {
      for (let i = 0; i < map[j].length; i++) {
        let pos = new Vec(i * BLOCK_WIDTH, j * BLOCK_WIDTH);
        switch(map[j][i]) {
          case "g":
            game.addGameObj(new Grass(pos));
            break;
          case "G":
            game.addGameObj(new WildGrass(pos));
            break;
          case "w":
            game.addGameObj(new Wall(pos));
            break;
          case "p":
            game.addGameObj(new Portal(pos));
            break;
          case "s":
            game.addGameObj(new Sign(pos));
            break;
        }
      }
    }
    if (game.playerObj) {
      game.playerObj.pos = spawn;
    } else {
      game.playerObj = new Player(spawn);
    }
  } else if (e.data.startsWith("movedto|")) {
    let parts = e.data.split("|"),
        newX  = parseFloat(parts[1]),
        newY  = parseFloat(parts[2]);
    game.playerObj.moveTo(new Vec(newX, newY));
  } else if (e.data.startsWith("signtext|")) {
    let parts = e.data.split("|"),
        text  = parts[1];
    game.gameLog.addMsg("The sign reads: " + text);
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
  }
}

function update(dt) {
  if (game.contextMenu === contextMenus.MAP) {
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
      game.playerObj.facing = dirs.LEFT;
    }
    if (game.pressedKeys.has(KEY_RIGHT)) {
      moveStr += "r";
      game.playerObj.move(new Vec(PLAYER_SPEED*dt*multiplier, 0));
      game.playerObj.facing = dirs.RIGHT;
    }
    if (game.pressedKeys.has(KEY_UP)) {
      moveStr += "u";
      game.playerObj.move(new Vec(0, -PLAYER_SPEED*dt*multiplier));
      game.playerObj.facing = dirs.UP;
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      moveStr += "d";
      game.playerObj.move(new Vec(0, PLAYER_SPEED*dt*multiplier));
      game.playerObj.facing = dirs.DOWN;
    }
    if (moveStr) {
      if (fastmove) {
        game.ws.send("fastmove|" + moveStr);
      } else {
        game.ws.send("move|" + moveStr);
      }
    }
    if (game.pressedKeys.has(SPACE)) {
      game.ws.send("interact");
      game.pressedKeys.delete(SPACE);
    }
  } else if (game.contextMenu === contextMenus.LOG) {
    if (game.pressedKeys.has(KEY_UP)) {
      game.gameLog.scrollUp();
      game.pressedKeys.delete(KEY_UP);
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      game.gameLog.scrollDown();
      game.pressedKeys.delete(KEY_DOWN);
    }
    if (game.pressedKeys.has(C_KEY)) {
      game.gameLog.clear();
      game.pressedKeys.delete(C_KEY);
    }
  } else if (game.contextMenu === contextMenus.MENU) {
    if (game.pressedKeys.has(KEY_UP)) {
      game.menu.cursorUp();
      game.pressedKeys.delete(KEY_UP);
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      game.menu.cursorDown();
      game.pressedKeys.delete(KEY_DOWN);
    }
  }

  if (game.pressedKeys.has(L_KEY)) {
    if (game.contextMenu === contextMenus.LOG) {
      game.contextMenu = contextMenus.MAP;
      game.gameLog.unfocus();
    } else {
      game.contextMenu = contextMenus.LOG;
      game.gameLog.focus();
    }
    game.pressedKeys.delete(L_KEY);
  } else if (game.pressedKeys.has(M_KEY)) {
    if (game.contextMenu === contextMenus.MENU) {
      game.contextMenu = contextMenus.MAP;
      game.menu.unfocus();
    } else {
      game.contextMenu = contextMenus.MENU;
      game.menu.focus();
    }
    game.pressedKeys.delete(M_KEY);
  }
}

function render() {
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

  game.scale();
  for (const obj of game.gameObjs) {
    obj.render();
  }
  for (const obj of game.otherPlayerObjs) {
    obj.render();
  }
  if (game.playerObj) {
    game.playerObj.render();
  }

  game.unscale();
  ctx.font = "20px san-serif";
  const text = "Your username is " + game.username + ".";
  ctx.fillStyle = "rgb(80, 0, 80)";
  ctx.fillRect(0, 0, ctx.measureText(text).width + 20, 30);
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillText(text, 10, 20);

  game.gameLog.render();
  game.menu.render();
}

function main() {
  let w = window;
  let requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

  initialize();
  game.ws.onopen = function(e) {
    game.ws.send(game.username);
    let gameLoop = function(then) {
      return function(now) {
        update((now - then)/1000);
        render();
        requestAnimationFrame(gameLoop(now));
      };
    };
    requestAnimationFrame(gameLoop(null));
    let ping = function() {
      game.ws.send("ping");
      setTimeout(ping, 333);
    }
    ping();
  };
  game.ws.onmessage = handleWSMessage;
}

