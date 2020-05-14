"use strict";

// ----------- CONSTANTS -----------
const SHIFT = 16;
const SPACE = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const C_KEY = 67;

const BLOCK_WIDTH = 16;

const PLAYER_SPEED = 48;
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

function getImage(filename) {
  if (filename in images) {
    if (images[filename] === LOADING) {
      return null;
    } else {
      return images[filename];
    }
  } else {
    loadImage(filename);
    return null;
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
    return this.relativeTo(game.playerObj.pos).add(new Vec(game.canvasCtx.canvas.width/2, game.canvasCtx.canvas.height/2));
  }

  add(p) {
    return new Vec(this.x + p.x, this.y + p.y);
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
  }

  render() {
    const ctx = game.canvasCtx,
          startingX = Math.floor(ctx.canvas.width/2),
          startingY = Math.floor(ctx.canvas.height/2),
          img = getImage("char-down-still.png");
    if (img) {
      ctx.drawImage(img, startingX, startingY);
    } else {
      const width = BLOCK_WIDTH*7/8;
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(startingX, startingY, width, width);
      ctx.fillStyle = "rgb(255, 0, 0)";
      ctx.fillRect(startingX+1, startingY+1, width-2, width-2);
    }
  }
}

// ----------- ENTITIES -----------
class Grass extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    drawRect(game.canvasCtx, this.pos.relToPlayer(), "rgb(0, 255, 0)");
  }
}

class WildGrass extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    drawRect(game.canvasCtx, this.pos.relToPlayer(), "rgb(0, 180, 0)");
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
    const width = BLOCK_WIDTH*7/8,
          ctx = game.canvasCtx,
          startingX = Math.floor(this.pos.relToPlayer().x),
          startingY = Math.floor(this.pos.relToPlayer().y);
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(startingX, startingY, width, width);
    ctx.fillStyle = "rgb(255, 20, 147)";
    ctx.fillRect(startingX+1, startingY+1, width-2, width-2);
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
            ctx         = game.canvasCtx;
      let text = ["Press c to clear!", ...this.messageLog]
        .join(" \n ----- \n ");
      ctx.font = "12px san-serif";
      let textLines = wrapText(ctx, text, BOX_WIDTH);
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
  }
  if (game.pressedKeys.has(KEY_UP)) {
    moveStr += "u";
    game.playerObj.move(new Vec(0, -PLAYER_SPEED*dt*multiplier));
  }
  if (game.pressedKeys.has(KEY_RIGHT)) {
    moveStr += "r";
    game.playerObj.move(new Vec(PLAYER_SPEED*dt*multiplier, 0));
  }
  if (game.pressedKeys.has(KEY_DOWN)) {
    moveStr += "d";
    game.playerObj.move(new Vec(0, PLAYER_SPEED*dt*multiplier));
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

  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, width, height);
  for (const obj of game.gameObjs) {
    obj.render();
  }
  for (const obj of game.otherPlayerObjs) {
    obj.render();
  }
  if (game.playerObj) {
    game.playerObj.render();
  }

  ctx.font = "20px san-serif";
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

