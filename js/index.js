"use strict";

// ----------- CONSTANTS -----------
const SERVER_URL = "wss://terrekin.kroiririoroirkk.repl.co";

const SHIFT = 16;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const A_KEY = 65;
const C_KEY = 67;
const Z_KEY = 90;

const BLOCK_WIDTH = 32;
const PLAYER_WIDTH = 28;
const SCALE_FACTOR = 2;

const PLAYER_SPEED = BLOCK_WIDTH*3;
const SPEED_MULTIPLIER = 2;

const MIN_SAMPLE_RATE = 0.1;
const MAX_SAMPLE_RATE = 20;
const DEFAULT_SAMPLE_RATE = 3;

// ----------- GAME -----------
var game;

const contextMenus = Object.freeze({MAP:1, LOG:2, MENU:3, DIALOGUE:4});

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
    this.scaled = false;
    this.contextMenu = contextMenus.MAP;
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
    if (game.playerObj) {
      return this.relativeTo(game.playerObj.pos).add(game.getPlayerDrawPos());
    } else {
      throw new Error("Player doesn't exist yet");
    }
  }

  add(p) {
    return new Vec(this.x + p.x, this.y + p.y);
  }
}

// ----------- DIRECTION -----------
const dirs = Object.freeze({LEFT:1, UP:2, RIGHT:3, DOWN:4});

function strToDir(d) {
  if (d === "l") {return dirs.LEFT;}
  if (d === "u") {return dirs.UP;}
  if (d === "r") {return dirs.RIGHT;}
  if (d === "d") {return dirs.DOWN;}
}

// ----------- RENDER -----------
class Render {
  constructor(render, groundY) {
    this.render = render;
    this.groundY = groundY;
  }

  withY(y) {
    return new Render(this.render, y);
  }

  static renders(renderList) {
    renderList.sort((r1, r2) => r1.groundY - r2.groundY);
    renderList.forEach(function(r) {
      r.render();
    });
  }
}

// ----------- IMAGES -----------
const images = new Map();

const LOADING = "LOADING";

function loadImage(filename) {
  const image = new Image();
  image.onload = function(){images.set(filename, image);};
  image.src = "data/img/" + filename;
  images.set(filename, LOADING);
}

function getImage(...filenames) {
  for (const filename of filenames) {
    if (images.has(filename)) {
      if (images.get(filename) !== LOADING) {
        return images.get(filename);
      }
    } else {
      loadImage(filename);
    }
  }
  return null;
}

// ----------- ANIMATIONS -----------
class Frame {
  constructor(time, ...sprites) {
    this.time = time;
    this.sprites = sprites;
  }
}

class Animation {
  constructor(...frames) {
    this.frames = frames;
    this.reset();
  }

  animate(dt) {
    this.frameDuration -= dt;
    while (this.frameDuration <= 0) {
      this.frameIndex++;
      if (this.frameIndex >= this.frames.length) {
        this.frameIndex %= this.frames.length;
      }
      this.frameDuration += this.frames[this.frameIndex].time;
    }
  }

  reset() {
    this.frameIndex = 0;
    this.frameDuration = this.frames[0].time;
  }

  getSprite() {
    return getImage(...this.frames[this.frameIndex].sprites);
  }
}

// ----------- ENTITY -----------
function drawRect(ctx, pos, fillStyle) {
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(Math.floor(pos.x), Math.floor(pos.y),
               BLOCK_WIDTH, BLOCK_WIDTH);
  ctx.fillStyle = fillStyle;
  ctx.fillRect(Math.floor(pos.x)+1, Math.floor(pos.y)+1,
               BLOCK_WIDTH-2, BLOCK_WIDTH-2);
}

var entities = new Map();

class Entity {
  constructor(uuid, pos, velocity, facing) {
    this.uuid = uuid;
    this.pos = pos;
    this.velocity = velocity;
    this.facing = facing;
    this.height = BLOCK_WIDTH;
  }

  render() {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(),
            spr = this.constructor._sprite,
            img = spr ? getImage(spr) : null;
      if (img) {
        ctx.drawImage(img, pos.x, pos.y);
      } else {
        drawRect(game.canvasCtx, pos, this.constructor._fillStyle);
      }
    }).bind(this), this.pos.y + this.height)];
  }

  move(offset) {
    this.pos = this.pos.add(offset);
  }

  moveTo(pos) {
    this.pos = pos;
  }
}

function registerEntity(entityId, entityClass,
                        sprite=null, fillStyle="rgb(50, 50, 50)") {
  if (entities.has(entityId)) {
    throw new Error(`Entity ID ${entityId} is already in use.`);
  } else {
    entities.set(entityId, entityClass);
    entityClass._sprite = sprite;
    entityClass._fillStyle = fillStyle;
  }
}

function getEntityById(entityId) {
  const entityClass = entities.get(entityId);
  if (entityClass) {
    return entityClass;
  } else {
    throw new Error(`Entity ID ${entityId} not found.`);
  }
}

function entityFromJSON(obj) {
  const entityId     = obj.entity_id,
        entityClass  = getEntityById(entityId),
        entityUuid   = obj.uuid,
        entityPos    = new Vec(obj.pos.x, obj.pos.y),
        entityVel    = new Vec(obj.velocity.x, obj.velocity.y),
        entityFacing = strToDir(obj.facing);
  return new entityClass(entityUuid, entityPos, entityVel, entityFacing);
}

class Walker extends Entity {}
registerEntity("walker", Walker);

class Stander extends Entity {}
registerEntity("stander", Stander);

// ----------- TILE -----------
var tiles = new Map();

class Tile {
  constructor(pos) {
    this.pos = pos;
  }

  render() {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(),
            spr = this.constructor._sprite,
            img = spr ? getImage(spr) : null;
      if (img) {
        ctx.drawImage(img, pos.x, pos.y);
      } else {
        drawRect(game.canvasCtx, pos, this.constructor._fillStyle);
      }
    }).bind(this), this.pos.y)];
  }

  static get hasMetadata() {
    return false;
  }

  animate() {}
}

function registerTile(tileId, tileClass,
                      sprite=null, fillStyle="rgb(50, 50, 50)") {
  if (tiles.has(tileId)) {
    throw new Error(`Tile ID ${tileId} is already in use.`);
  } else {
    tiles.set(tileId, tileClass);
    tileClass._sprite = sprite;
    tileClass._fillStyle = fillStyle;
  }
}

function getTileById(tileId) {
  const tileClass = tiles.get(tileId);
  if (tileClass) {
    return tileClass;
  } else {
    throw new Error(`Tile ID ${tileId} not found.`);
  }
}

function tileFromJSON(obj, pos) {
  const tileId    = obj.tile_id,
        tileClass = getTileById(tileId);
  if (tileClass.hasMetadata) {
    return new tileClass(pos, tileClass.dataFromJSON(obj.tile_data, pos));
  } else {
    return new tileClass(pos);
  }
}

class TilePlus extends Tile {
  constructor(pos, data) {
    super(pos);
    this.data = data;
  }

  static get hasMetadata() {
    return true;
  }

  static dataFromJSON(obj, pos) {
    throw new Error("Method dataFromJSON not implemented by "
                    + this.constructor.name);
  }
}

// ----------- PLAYER -----------
class Player extends Entity {
  constructor(pos) {
    super(null, pos, null, dirs.DOWN);
    this.moving = false;
    this.running = false;
    this.leftAnimation = new Animation(
      new Frame(0.2, "char-left-walk1.png", "char-left-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-left-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-left-walk2.png", "char-left-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-left-still.png", "char-down-still1.png")
    );
    this.upAnimation = new Animation(
      new Frame(0.2, "char-up-walk1.png", "char-up-still1.png", "char-down-still1.png"),
      new Frame(0.2, "char-up-still2.png", "char-up-still1.png", "char-down-still1.png"),
      new Frame(0.2, "char-up-walk2.png", "char-up-still1.png", "char-down-still1.png"),
      new Frame(0.2, "char-up-still1.png", "char-down-still1.png")
    );
    this.rightAnimation = new Animation(
      new Frame(0.2, "char-right-walk1.png", "char-right-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-right-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-right-walk2.png", "char-right-still.png", "char-down-still1.png"),
      new Frame(0.2, "char-right-still.png", "char-down-still1.png")
    );
    this.downAnimation = new Animation(
      new Frame(0.2, "char-down-walk1.png", "char-down-still1.png"),
      new Frame(0.2, "char-down-still2.png", "char-down-still1.png"),
      new Frame(0.2, "char-down-walk2.png", "char-down-still1.png"),
      new Frame(0.2, "char-down-still1.png")
    );
  }

  getAnimation() {
    if (this.facing === dirs.LEFT)  {return this.leftAnimation;}
    if (this.facing === dirs.UP)    {return this.upAnimation;}
    if (this.facing === dirs.RIGHT) {return this.rightAnimation;}
    if (this.facing === dirs.DOWN)  {return this.downAnimation;}
  }

  getSprite() {
    if (this.moving) {
      return this.getAnimation().getSprite();
    } else {
      if (this.facing === dirs.LEFT)  {return getImage("char-left-still.png", "char-down-still1.png");}
      if (this.facing === dirs.UP)    {return getImage("char-up-still1.png", "char-down-still1.png");}
      if (this.facing === dirs.RIGHT) {return getImage("char-right-still.png", "char-down-still1.png");}
      if (this.facing === dirs.DOWN)  {return getImage("char-down-still1.png");}
    }
  }

  move(offset) {
    super.move(offset);
    if (!this.moving) {
      this.startMoving();
    }
  }

  animate(dt) {
    if (this.running) {dt = 2*dt;}
    this.getAnimation().animate(dt);
  }

  startMoving() {
    this.getAnimation().reset();
    this.moving = true;
  }

  stopMoving() {
    this.running = false;
    this.moving = false;
  }

  render() {
    return [new Render((function() {
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
    }).bind(this), this.pos.y + PLAYER_WIDTH)];
  }
}

class OtherPlayer extends Entity {
  constructor(pos, username) {
    super(null, pos, null, null);
    this.username = username;
  }

  render() {
    return [new Render((function() {
      const ctx = game.canvasCtx,
            startingX = Math.floor(this.pos.relToPlayer().x),
            startingY = Math.floor(this.pos.relToPlayer().y);
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(startingX, startingY, PLAYER_WIDTH, PLAYER_WIDTH);
      ctx.fillStyle = "rgb(255, 20, 147)";
      ctx.fillRect(startingX+1, startingY+1, PLAYER_WIDTH-2, PLAYER_WIDTH-2);
    }).bind(this), this.pos.y + PLAYER_WIDTH)];
  }
}

// ----------- TILES -----------
class Empty extends Tile {}
registerTile("empty", Empty, null, "rgb(0, 0, 0)");

class Grass extends Tile {}
registerTile("grass", Grass, "grass.png", "rgb(0, 255, 0)");

class WildGrass extends Tile {}
registerTile("wild_grass", WildGrass, "wild-grass.png", "rgb(0, 180, 0)");

class Wall extends Tile {}
registerTile("wall", Wall, "wall.png", "rgb(210, 105, 30)");

class PortalData {
  constructor(groundTile) {
    this.groundTile = groundTile;
  }
}

class Portal extends TilePlus {
  constructor(pos, data) {
    super(pos, data);
    this.animation = new Animation(
      new Frame(0.28, "portal-1.png"),
      new Frame(0.28, "portal-2.png", "portal-1.png"),
      new Frame(0.28, "portal-3.png", "portal-1.png"),
      new Frame(0.28, "portal-4.png", "portal-1.png")
    );
  }

  static dataFromJSON(obj, pos) {
    return new PortalData(tileFromJSON(obj.ground_tile, pos));
  }

  animate(dt) {
    this.animation.animate(dt);
  }

  render() {
    return [...this.data.groundTile.render(), new Render((function() {
      const ctx = game.canvasCtx,
            pos = this.pos.relToPlayer(),
            img = this.animation.getSprite();
      if (img) {
        ctx.drawImage(img, pos.x, pos.y);
      } else {
        drawRect(game.canvasCtx, pos, this.constructor._fillStyle);
      }
    }).bind(this), this.pos.y)];
  }
}
registerTile("portal", Portal, null, "rgb(0, 0, 0)");

class SignData {
  constructor(groundTile) {
    this.groundTile = groundTile;
  }
}

class Sign extends TilePlus {
  static dataFromJSON(obj, pos) {
    return new SignData(tileFromJSON(obj.ground_tile, pos));
  }

  render() {
    const SIGN_HEIGHT = 27;
    return [...this.data.groundTile.render(),
            ...(super.render().map(r => r.withY(this.pos.y + SIGN_HEIGHT)))];
  }
}
registerTile("sign", Sign, "sign.png", "rgb(255, 255, 0)");

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

// ----------- USERNAME NOTICE -----------
class UsernameNotice {
  render() {
    const ctx = game.canvasCtx,
          text = "Your username is " + game.username + ".";
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(0, 0, ctx.measureText(text).width + 20, 30);
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillText(text, 10, 20);
  }
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
    if (this.lineStart > this.wrappedText.length-1) {
      this.lineStart = this.wrappedText.length-1;
    }
  }

  focus() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      ["Press A to exit the log, C to clear, and arrow keys to scroll.",
      ...this.messageLog]
        .join(" \n ----- \n "), this.width);
  }

  unfocus() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    const openMsg = "Press A to open the log!";
    const text = this.messageLog.length > 0 ?
      `${openMsg} \n ----- \n ${this.messageLog[0]}` :
      openMsg;
    this.wrappedText = wrapText(ctx, text, this.width);
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
      ["Press C to close the menu, arrow keys to pick an option, and Z to choose.",
      ...this.items.map((item, i) =>
        i === this.currentlySelected ?
          ">" + item.text :
          item.text)].join(" \n ----- \n "), this.width);
  }

  unfocus() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      "Press C to open the menu!", this.width);
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
    ctx.fillRect(startingX, y, this.width + 20,
                 LINE_HEIGHT*this.wrappedText.length + 5);

    ctx.fillStyle = "rgb(255, 255, 255)";
    for (const line of this.wrappedText) {
      y += LINE_HEIGHT;
      ctx.fillText(line, startingX + 10, y);
    }
  }
}

// ----------- DIALOGUE BOX -----------
const dialogueState = Object.freeze({TEXT:1, CHOOSE:2});

class DialogueBox {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.state = null;
    this.text = null;
    this.options = null;
    this.lineStart = 0;
    this.currentlySelected = 0;
    this.wrappedText = [];
    this.entityUuid = null;
  }

  setText(text, entityUuid) {
    this.options = null;
    this.text = text;
    this.state = dialogueState.TEXT;
    this.entityUuid = entityUuid;
    this.lineStart = 0;
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx, text, this.width);
  }

  setOptions(options, entityUuid) {
    this.text = null;
    this.options = options;
    this.lineStart = 0;
    this.state = dialogueState.CHOOSE;
    this.entityUuid = entityUuid;
    this.currentlySelected = 0;
    this.redrawOptions();
  }

  redrawOptions() {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      this.options.map((option, i) =>
        i === this.currentlySelected ?
          ">" + option :
          option).join(" \n "), this.width);
  }

  getOptionSelected() {
    return this.currentlySelected;
  }

  endDialogue() {
    this.text = null;
    this.options = null;
    this.state = null;
  }

  onUpArrow() {
    if (this.state === dialogueState.TEXT) {
      this.lineStart--;
      if (this.lineStart < 0) {
        this.lineStart = 0;
      }
    } else if (this.state === dialogueState.CHOOSE) {
      this.currentlySelected --;
      if (this.currentlySelected < 0) {
        this.currentlySelected = 0;
      }
      this.redrawOptions();
    }
  }

  onDownArrow() {
    if (this.state === dialogueState.TEXT) {
      this.lineStart++;
      if (this.lineStart > this.wrappedText.length-1) {
        this.lineStart = this.wrappedText.length-1;
      }
    } else if (this.state === dialogueState.CHOOSE) {
      this.currentlySelected++;
      if (this.currentlySelected > this.wrappedText.length-1) {
        this.currentlySelected = this.wrappedText.length-1;
      }
      this.redrawOptions();
    }
  }

  render() {
    if (this.state !== null) {
      const LINE_HEIGHT  = 24,
            ctx          = game.canvasCtx,
            renderedText = this.wrappedText.slice(this.lineStart),
            startingY    = game.getScaledHeight() - this.height - 20,
            endingY      = startingY + this.height;

      ctx.font = "20px san-serif";
      ctx.fillStyle = "rgb(80, 0, 80)";
      ctx.fillRect(0, startingY, this.width + 20, this.height + 20);

      ctx.fillStyle = "rgb(255, 255, 255)";
      let y = startingY;
      for (const line of renderedText) {
        y += LINE_HEIGHT;
        if (y > endingY) {return;}
        ctx.fillText(line, 10, y);
      }
    }
  }
}

// ----------- SAMPLE RATE SLIDER -----------
class SampleRateSlider {
  constructor() {
    this.startX = -250;
    this.endX = -50;
    this.y = -50;
    this.active = false;
    this.registerKeyListeners();
  }

  getSliderX() {
    let p =
      (game.sampleRate - MIN_SAMPLE_RATE)
      / (MAX_SAMPLE_RATE - MIN_SAMPLE_RATE);
    return p * (this.endX - this.startX) + this.startX;
  }

  setSliderX(x) {
    let p =
      (x - (game.getScaledWidth() + this.startX))
      / (this.endX - this.startX);
    game.sampleRate = p * (MAX_SAMPLE_RATE - MIN_SAMPLE_RATE) + MIN_SAMPLE_RATE;
  }

  registerKeyListeners() {
    addEventListener("mousedown", e => {
      const width = game.getScaledWidth(),
            height = game.getScaledHeight();
      if (e.clientX >= width + this.startX
          && e.clientX <= width + this.endX
          && e.clientY >= height + this.y - 10
          && e.clientY <= height + this.y + 10) {
        this.active = true;
      }
    }, false);
    addEventListener("mousemove", e => {
      if (this.active) {
        console.log(e);
        let sliderX = e.clientX;
        const width = game.getScaledWidth();
        if (sliderX < width + this.startX) {sliderX = width + startX;}
        if (sliderX > width + this.endX) {sliderX = width + endX;}
        this.setSliderX(e.clientX);
      }
    }, false);
    addEventListener("mouseup", e => {this.active = false;}, false);
  }

  render() {
    const ctx = game.canvasCtx,
          width = game.getScaledWidth(),
          renderStartX = width + this.startX,
          renderEndX = width + this.endX,
          renderX = width + this.getSliderX(),
          renderY = game.getScaledHeight() + this.y;
    ctx.strokeStyle = "rgb(100, 0, 0)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(renderStartX, renderY);
    ctx.lineTo(renderEndX, renderY);
    ctx.stroke();

    if (this.active) {
      ctx.fillStyle = "rgb(200, 0, 200)";
    } else {
      ctx.fillStyle = "rgb(150, 0, 150)";
    }
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(renderX - 10, renderY - 10, 20, 20);
    ctx.fill();
    ctx.stroke();
  }
}

// ----------- ENTRY POINT -----------
function startGame() {
  let username = document.getElementById("username").value;
  let ws = new WebSocket(SERVER_URL);
  game = new Game(ws, username);
  main();
}

// ----------- GAME LOGIC -----------
function initialize() {
  game.usernameNotice = new UsernameNotice();
  game.gameLog = new GameLog(250);
  game.menu = new Menu(250);
  game.menu.addItem(new MenuItem("Profile"));
  game.menu.addItem(new MenuItem("Inventory"));
  game.dialogueBox = new DialogueBox(500, 100);
  game.sampleRateSlider = new SampleRateSlider();
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
                t = tileFromJSON(tiles[j][i], pos);
          rowTiles.push(t);
        }
        map.push(rowTiles);
      }
      game.map = map;
      game.entities = world.entities.map(entityFromJSON);
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
  } else if (e.data.startsWith("entities|")) {
    let parts = e.data.split("|");
    game.entities = parts.slice(1)
                         .filter(Boolean)
                         .map(e => entityFromJSON(JSON.parse(e)));
  } else if (e.data.startsWith("dialogue|")) {
    let parts = e.data.split("|"),
        uuid = parts[1],
        text = parts.slice(2).join("|");
    game.contextMenu = contextMenus.DIALOGUE;
    game.dialogueBox.setText(text, uuid);
  } else if (e.data.startsWith("dialoguechoice|")) {
    let parts = e.data.split("|"),
        uuid = parts[1],
        textOptions = parts.slice(2);
    game.contextMenu = contextMenus.DIALOGUE;
    game.dialogueBox.setOptions(textOptions, uuid);
  } else if (e.data.startsWith("dialogueend")) {
    game.contextMenu = contextMenus.MAP;
    game.dialogueBox.endDialogue();
  } else if (e.data.startsWith("tag")) {
    let parts = e.data.split("|"),
        tagging_player = parts[1],
        tagged_player = parts[2];
    if (game.username === tagging_player) {
      game.gameLog.addMsg("You tagged " + tagged_player + "!");
    } else if (game.username === tagged_player) {
      game.gameLog.addMsg("You were tagged by " + tagging_player + "!");
    } else {
      game.gameLog.addMsg(tagging_player + " tagged " + tagged_player + "!");
    }
  }
}

function update(dt) {
  if (game.contextMenu === contextMenus.MAP) {
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
  } else if (game.contextMenu === contextMenus.DIALOGUE) {
    if (game.pressedKeys.has(KEY_UP)) {
      game.dialogueBox.onUpArrow();
      game.pressedKeys.delete(KEY_UP);
    }
    if (game.pressedKeys.has(KEY_DOWN)) {
      game.dialogueBox.onDownArrow();
      game.pressedKeys.delete(KEY_DOWN);
    }
    if (game.pressedKeys.has(Z_KEY)) {
      if (game.dialogueBox.state === dialogueState.CHOOSE) {
        let option = game.dialogueBox.getOptionSelected(),
            uuid   = game.dialogueBox.entityUuid;
        game.ws.send("dialoguechoose|"+uuid+"|"+option.toString());
      } else {
        game.ws.send("interact");
      }
      game.pressedKeys.delete(Z_KEY);
    }
  }
  if (game.contextMenu !== contextMenus.DIALOGUE) {
    if (game.pressedKeys.has(A_KEY)) {
      if (game.contextMenu === contextMenus.LOG) {
        game.contextMenu = contextMenus.MAP;
        game.gameLog.unfocus();
      } else {
        game.contextMenu = contextMenus.LOG;
        game.gameLog.focus();
      }
      game.pressedKeys.delete(A_KEY);
    } else if (game.pressedKeys.has(C_KEY)) {
      if (game.contextMenu === contextMenus.MENU) {
        game.contextMenu = contextMenus.MAP;
        game.menu.unfocus();
      } else {
        game.contextMenu = contextMenus.MENU;
        game.menu.focus();
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

  game.scale();

  if (game.playerObj) {
    let renderList = [];
    for (let j = 0; j < game.map.length; j++) {
      for (let i = 0; i < game.map[j].length; i++) {
        let tile = game.map[j][i];
        renderList.push(...tile.render());
        tile.animate(dt);
      }
    }
    for (const entity of game.entities) {
      renderList.push(...entity.render());
    }
    for (const obj of game.otherPlayerObjs) {
      renderList.push(...obj.render());
    }
    renderList.push(...game.playerObj.render());
    Render.renders(renderList);

    game.unscale();
    game.usernameNotice.render();
    game.gameLog.render();
    game.menu.render();
    game.dialogueBox.render();
    game.sampleRateSlider.render();
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
