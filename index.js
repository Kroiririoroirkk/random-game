"use strict";

// ----------- CONSTANTS -----------
const SHIFT = 16;
const SPACE = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const C_KEY = 67;

const BLOCK_WIDTH = 32;
const PLAYER_WIDTH = 28;
var SCALE_FACTOR = 0.8;

const PLAYER_SPEED = BLOCK_WIDTH*3;
const SPEED_MULTIPLIER = 2;

// ----------- IMAGES -----------
var images = Object.create(null);

const LOADING = "LOADING";

function loadImage(filename) {
  const image = new Image();
  image.onload = function(){images[filename] = image;};
  image.src = 'img/' + filename;
  images[filename] = LOADING;
}

function getImage(...filenames) {
  for (const filename in filenames) {
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

// ----------- GAME -----------
var game;

class Game {
  constructor(ws, username) {
    this.ws = ws;
    this.canvasCtx = this.makePage(username);
    this.pressedKeys = new Set();
    this.playerObj = null;
    this.otherPlayerObjs = [];
    this.gameObjs = [];
    this.username = username;
    this.gameLog = new GameLog();
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

  getScaledWidth() {
    return this.canvasCtx.canvas.width / SCALE_FACTOR;
  }

  getScaledHeight() {
    return this.canvasCtx.canvas.height / SCALE_FACTOR;
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
    drawRect(game.canvasCtx, this.pos.relToPlayer(), "rgb(210, 105, 30)");
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

// ----------- GAME LOG -----------
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
        currentLine = words[i] + ' ';
      }
    }
  }
  lines.push(currentLine);
  return lines;
}

class GameLog {
  constructor() {
    this.messageLog = [];
  }

  addMsg(msg) {
    this.messageLog.unshift(msg);
  }

  clear() {
    this.messageLog = [];
  }

  render() {
    if (this.messageLog.length > 0) {
      const BOX_WIDTH   = 100,
            LINE_HEIGHT = 15,
            ctx         = game.canvasCtx,
            text = ["Press c to clear!", ...this.messageLog]
              .join(" \n ----- \n ");
      ctx.font = "12px san-serif";
      const textLines = wrapText(ctx, text, BOX_WIDTH);
      ctx.fillStyle = "rgb(80, 0, 80)";
      ctx.fillRect(0, 40, BOX_WIDTH + 20, LINE_HEIGHT*textLines.length + 5);
      ctx.fillStyle = "rgb(255, 255, 255)";
      let y = 40;
      for (const line of textLines) {
        y += LINE_HEIGHT;
        ctx.fillText(line, 10, y);
      }
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
        text  = parts[3];
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
  if (game.pressedKeys.has(KEY_UP)) {
    moveStr += "u";
    game.playerObj.move(new Vec(0, -PLAYER_SPEED*dt*multiplier));
    game.playerObj.facing = dirs.UP;
  }
  if (game.pressedKeys.has(KEY_RIGHT)) {
    moveStr += "r";
    game.playerObj.move(new Vec(PLAYER_SPEED*dt*multiplier, 0));
    game.playerObj.facing = dirs.RIGHT;
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
  if (game.pressedKeys.has(C_KEY)) {
    game.gameLog.clear();
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

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, width, height);

  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
  for (const obj of game.gameObjs) {
    obj.render();
  }
  for (const obj of game.otherPlayerObjs) {
    obj.render();
  }
  if (game.playerObj) {
    game.playerObj.render();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const fontSize = Math.floor(20);
  ctx.font = `${fontSize}px san-serif`;
  let text = "Your username is " + game.username + ".";
  ctx.fillStyle = "rgb(80, 0, 80)";
  ctx.fillRect(0, 0, ctx.measureText(text).width + 20, 30);
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillText(text, 10, 20);

  game.gameLog.render();
}

function main() {
  let w = window;
  let requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

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

