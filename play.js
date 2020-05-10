'use strict';

// ----------- CONSTANTS -----------
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

const WIDTH = 512;
const HEIGHT = 480;

// ----------- GAME -----------
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
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
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

  addGameObj(obj) {
    this.gameObjs.push(obj);
  }
}

class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  relativeTo(p) {
    return new Vec(this.x - p.x, this.y - p.y);
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

  render(game) {
    const ctx = game.canvasCtx;
    ctx.strokeStyle = 'rgb(50, 50, 50)';
    ctx.fillStyle = 'rgb(50, 50, 50)';
    ctx.beginPath();
    var relPos = this.pos.relativeTo(game.playerObj.pos);
    ctx.arc(relPos.x, relPos.y, 16, 0, 2*Math.PI);
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

  render(game) {
    const ctx = game.canvasCtx;
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.beginPath();
    ctx.arc(WIDTH/2, HEIGHT/2, 16, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();
  }
}

// ----------- ENTRY POINT -----------
function startGame() {
  var username = document.getElementById('username').value;
  var ws = new WebSocket("ws://bokemon.kroiririoroirkk.repl.co");
  ws.onopen = function(e) {
    ws.send(username);
  };

  main(new Game(ws));
}

// ----------- GAME LOGIC -----------
function initialize(game) {
  game.playerObj = new Player(new Vec(0, 0));
  //Arbitrary test objects
  game.addGameObj(new Entity(new Vec(50, 50)));
  game.addGameObj(new Entity(new Vec(-40, 100)));
}

function update(game, dt) {
  if (game.pressedKeys.has(KEY_LEFT)) {
    game.playerObj.move(new Vec(-10/dt, 0));
  }
  if (game.pressedKeys.has(KEY_UP)) {
    game.playerObj.move(new Vec(0, -10/dt));
  }
  if (game.pressedKeys.has(KEY_RIGHT)) {
    game.playerObj.move(new Vec(10/dt, 0));
  }
  if (game.pressedKeys.has(KEY_DOWN)) {
    game.playerObj.move(new Vec(0, 10/dt));
  }
}

function render(game) {
  game.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  if (game.playerObj) {
    game.playerObj.render(game);
  }
  for (const obj of game.gameObjs) {
    obj.render(game);
  }
};

function main(game) {
  var w = window;
  var requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

  initialize(game);
  var gameLoop = function(then) {
    return function(now) {
      update(game, now - then);
      render(game);
      requestAnimationFrame(gameLoop(now));
    };
  };
  requestAnimationFrame(gameLoop(null));
}
