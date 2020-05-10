'use strict';

// ----------- CONSTANTS -----------
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

const WIDTH = 512;
const HEIGHT = 480;

const BLOCK_WIDTH = 16;
const PLAYER_SPEED = 10;

// ----------- GAME -----------
var game;

class Game {
  constructor(ws) {
    this.ws = ws;
    this.canvasCtx = this.makeCanvas();
    this.pressedKeys = new Set();
    this.playerObj = null;
    this.gameObjs = [];
    this.registerKeyListeners();
  }

  makeCanvas() {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.innerHTML = 'Oops! Something went wrong. Your browser might not support this game.';
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    document.body.innerHTML = '';
    document.body.style.backgroundColor = 'white';
    document.body.appendChild(canvas);
    return ctx;
  }

  registerKeyListeners() {
    addEventListener('keydown', e => this.pressedKeys.add(e.keyCode), false);
    addEventListener('keyup', e => this.pressedKeys.delete(e.keyCode), false);
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
    return this.relativeTo(game.playerObj.pos).add(new Vec(WIDTH/2, HEIGHT/2));
  }

  add(p) {
    return new Vec(this.x + p.x, this.y + p.y);
  }
}

// ----------- ENTITY -----------
class Entity {
  constructor(pos) {
    this.pos = pos;
  }

  render() {
    const ctx = game.canvasCtx;
    ctx.strokeStyle = 'rgb(50, 50, 50)';
    ctx.fillStyle = 'rgb(50, 50, 50)';
    ctx.beginPath();
    let relPos = this.pos.relToPlayer();
    ctx.arc(relPos.x, relPos.y, BLOCK_WIDTH/2, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();
  }

  move(offset) {
    this.pos = this.pos.add(offset);
  }
}

// ----------- PLAYER -----------
class Player extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    const ctx = game.canvasCtx;
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.beginPath();
    ctx.arc(WIDTH/2, HEIGHT/2, BLOCK_WIDTH/2, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();
  }
}

// ----------- GRASS -----------
class Grass extends Entity {
  constructor(pos) {
    super(pos);
  }

  render() {
    const ctx = game.canvasCtx;
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.beginPath();
    let relPos = this.pos.relToPlayer();
    ctx.rect(relPos.x, relPos.y, BLOCK_WIDTH, BLOCK_WIDTH);
    ctx.stroke();
    ctx.fill();
  }
}

// ----------- ENTRY POINT -----------
function startGame() {
  let username = document.getElementById('username').value;
  let ws = new WebSocket("wss://bokemon.kroiririoroirkk.repl.co");
  ws.onopen = function(e) {
    ws.send(username);
  };
  ws.onmessage = handleWSMessage;
  game = new Game(ws);
  main();
}

// ----------- GAME LOGIC -----------
function handleWSMessage(e) {
  console.log(e);
  if (e.data.startsWith('world|')) {
    let msg        = e.data.slice('world|'.length),
        parts      = msg.split('|'),
        spawnCoord = parts[0],
        spawnX     = parseInt(spawnCoord.split(',')[0]),
        spawnY     = parseInt(spawnCoord.split(',')[1]),
        origin     = new Vec(spawnX * BLOCK_WIDTH + BLOCK_WIDTH/2, spawnY * BLOCK_WIDTH + BLOCK_WIDTH/2),
        map        = parts.slice(1);
    game.clearGameObjs();
    for (let j = 0; j < map.length; j++) {
      for (let i = 0; i < map[j].length; i++) {
        switch(map[j][i]) {
          case 'g':
            let pos = new Vec(i * BLOCK_WIDTH, j * BLOCK_WIDTH);
            pos = pos.relativeTo(origin);
            game.addGameObj(new Grass(pos));
        }
      }
    }
    console.log(game.gameObjs);
  }
}

function initialize() {
  game.playerObj = new Player(new Vec(0, 0));
}

function update(dt) {
  if (game.pressedKeys.has(KEY_LEFT)) {
    game.playerObj.move(new Vec(-PLAYER_SPEED/dt, 0));
  }
  if (game.pressedKeys.has(KEY_UP)) {
    game.playerObj.move(new Vec(0, -PLAYER_SPEED/dt));
  }
  if (game.pressedKeys.has(KEY_RIGHT)) {
    game.playerObj.move(new Vec(PLAYER_SPEED/dt, 0));
  }
  if (game.pressedKeys.has(KEY_DOWN)) {
    game.playerObj.move(new Vec(0, PLAYER_SPEED/dt));
  }
}

function render() {
  game.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  for (const obj of game.gameObjs) {
    obj.render();
  }
  if (game.playerObj) {
    game.playerObj.render();
  }
};

function main() {
  let w = window;
  let requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

  initialize();
  let gameLoop = function(then) {
    return function(now) {
      update(now - then);
      render();
      requestAnimationFrame(gameLoop(now));
    };
  };
  requestAnimationFrame(gameLoop(null));
}
