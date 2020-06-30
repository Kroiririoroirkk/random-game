"use strict";

var map;
var context;
window.onload = function() {
  document.getElementById("map").addEventListener("click", handleClick, false);
  document.getElementById("spawnpointmap").addEventListener("click", handleClick, false);
  initializeToolbar();
};

const TILE_COLORS = {
  "empty": "#000000",
  "grass": "#00FF00",
  "wild_grass": "#3DB846",
  "wall": "#606060",
  "portal": "#C996FF",
  "sign": "#FFFF00",
  "deep_water": "#0000A0",
  "shallow_water": "#64B3F4",
  "dirt": "#645A28",
  "desert": "#DAD79C",
  "lava": "#EC731C",
  "floor": "#DDDDDD",
  "indoor_wall": "#00711A",
  "barrier": "#B0B0B0"
};

const DEFAULT_TILE_ID = "grass";

const SELF = 1;

class TileCoord {
  constructor(rowNum, colNum) {
    this.rowNum = rowNum;
    this.colNum = colNum;
  }

  static fromJSON(obj) {
    return new TileCoord(obj["block_y"], obj["block_x"]);
  }

  toJSON() {
    return {
      "block_x": this.colNum,
      "block_y": this.rowNum
    };
  }

  equals(other) {
    return this.rowNum === other.rowNum && this.colNum === other.colNum;
  }
}

class Selection {
  constructor(upperLeft, lowerRight) {
    this.upperLeft = upperLeft;
    this.lowerRight = lowerRight;
  }
}

class Context {
  constructor() {
    this._viewMode = DisplayMode.MAP;
    this._mode = ContextMode.DRAW;
    this.selection = null;
  }

  get viewMode() {
    return this._viewMode;
  }

  set viewMode(m) {
    this._viewMode.onexit();
    this._viewMode = m;
    this._viewMode.onenter();
  }

  get mode() {
    return this._mode;
  }

  set mode(m) {
    this._mode.onexit();
    this._mode = m;
    this._mode.onenter();
  }

  setSelection(s) {
    this.clearSelection();
    this.selection = s;
    for (let colNum = s.upperLeft.colNum;
         colNum <= s.lowerRight.colNum;
         colNum++) {
      map.getTileHTML(s.upperLeft.rowNum, colNum).classList.add("top");
      if (s.upperLeft.rowNum > 0) {
        map.getTileHTML(s.upperLeft.rowNum-1, colNum).classList.add("bottom");
      }
      map.getTileHTML(s.lowerRight.rowNum, colNum).classList.add("bottom");
      if (s.lowerRight.rowNum < map.tiles.length-1) {
        map.getTileHTML(s.lowerRight.rowNum+1, colNum).classList.add("top");
      }
    }
    for (let rowNum = s.upperLeft.rowNum;
         rowNum <= s.lowerRight.rowNum;
         rowNum++) {
      map.getTileHTML(rowNum, s.upperLeft.colNum).classList.add("left");
      if (s.upperLeft.colNum > 0) {
        map.getTileHTML(rowNum, s.upperLeft.colNum-1).classList.add("right");
      }
      map.getTileHTML(rowNum, s.lowerRight.colNum).classList.add("right");
      if (s.upperLeft.colNum < map.tiles[0].length-1) {
        map.getTileHTML(rowNum, s.lowerRight.colNum+1).classList.add("left");
      }
    }
  }

  clearSelection() {
    if (!this.selection) {return;}
    const s = this.selection;
    for (let colNum = s.upperLeft.colNum;
         colNum <= s.lowerRight.colNum;
         colNum++) {
      map.getTileHTML(s.upperLeft.rowNum, colNum).classList.remove("top");
      if (s.upperLeft.rowNum > 0) {
        map.getTileHTML(s.upperLeft.rowNum-1, colNum).classList.remove("bottom");
      }
      map.getTileHTML(s.lowerRight.rowNum, colNum).classList.remove("bottom");
      if (s.lowerRight.rowNum < map.tiles.length-1) {
        map.getTileHTML(s.lowerRight.rowNum+1, colNum).classList.remove("top");
      }
    }
    for (let rowNum = s.upperLeft.rowNum;
         rowNum <= s.lowerRight.rowNum;
         rowNum++) {
      map.getTileHTML(rowNum, s.upperLeft.colNum).classList.remove("left");
      if (s.upperLeft.colNum > 0) {
        map.getTileHTML(rowNum, s.upperLeft.colNum-1).classList.remove("right");
      }
      map.getTileHTML(rowNum, s.lowerRight.colNum).classList.remove("right");
      if (s.upperLeft.colNum < map.tiles[0].length-1) {
        map.getTileHTML(rowNum, s.lowerRight.colNum+1).classList.remove("left");
      }
    }
    this.selection = null;
  }

  setDrawTile(tile) {
    let tileId = document.getElementById("tile_id"),
        tileColor = document.getElementById("tile_color");
    tileId.value = tile.tileId;
    tileColor.value = tile.color;
  }

  drawPixel(rowNum, colNum) {
    let tileId = document.getElementById("tile_id").value,
        tileColor = document.getElementById("tile_color").value,
        tile = new Tile(tileId, tileColor);
    map.setTile(rowNum, colNum, tile);
  }

  fillSelection() {
    if (context.selection) {
      for (let rowNum = context.selection.upperLeft.rowNum;
           rowNum <= context.selection.lowerRight.rowNum;
           rowNum++) {
        for (let colNum = context.selection.upperLeft.colNum;
             colNum <= context.selection.lowerRight.colNum;
             colNum++) {
          this.drawPixel(rowNum, colNum);
        }
      }
    }
  }

  drawLine(coord1, coord2) {
    let x1 = coord1.colNum,
        y1 = coord1.rowNum,
        x2 = coord2.colNum,
        y2 = coord2.rowNum,
        dx = Math.abs(x2 - x1),
        dy = Math.abs(y2 - y1),
        sx = (x1 < x2) ? 1 : -1,
        sy = (y1 < y2) ? 1 : -1,
        err = dx - dy;
    while (true) {
      this.drawPixel(y1, x1);
      if ((x1 === x2) && (y1 === y2)) {break;}
      let e2 = 2*err;
      if (e2 > -dy) {
        err -= dy;
        x1  += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1  += sy;
      }
    }
  }
}

class DisplayMode {
  constructor(name, onenter=function(){}, onexit=function(){}) {
    this.name = name;
    this.onenter = onenter;
    this.onexit = onexit;
  }
}

DisplayMode.MAP = new DisplayMode("map",
  function() {
    document.getElementById("map").style.display = "";
  },
  function() {
    document.getElementById("map").style.display = "none";
  });
DisplayMode.SPAWNPOINTS = new DisplayMode("spawnpoints",
  function() {
    document.getElementById("spawnpointmap").style.display = "";
  },
  function() {
    document.getElementById("spawnpointmap").style.display = "none";
  });

class ContextMode {
  constructor(name, onenter=function(){}, onexit=function(){}) {
    this.name = name;
    this.onenter = onenter;
    this.onexit = onexit;
  }
}

ContextMode.DRAW = new ContextMode("draw", function() {
  context.viewMode = DisplayMode.MAP;
});
ContextMode.PICKER = new ContextMode("picker", function() {
  context.viewMode = DisplayMode.MAP;
});
ContextMode.SELECT_ONE = new ContextMode("selectOne");
ContextMode.SELECT_TWO = new ContextMode("selectTwo");
ContextMode.FILL = new ContextMode("fill", function() {
  context.viewMode = DisplayMode.MAP;
});
ContextMode.LINE_ONE = new ContextMode("lineOne", function() {
  context.viewMode = DisplayMode.MAP;
});
ContextMode.LINE_TWO = new ContextMode("lineTwo", function() {
  context.viewMode = DisplayMode.MAP;
});
ContextMode.ADD_SPAWNPOINT = new ContextMode("addSpawnpoint",
  function() {
    context.viewMode = DisplayMode.SPAWNPOINTS;
    document.getElementById("tooloptionsdiv").style.display = "";
    document.getElementById("spawnpointoptions").style.display = "";
  },
  function() {
    document.getElementById("tooloptionsdiv").style.display = "none";
    document.getElementById("spawnpointoptions").style.display = "none";
  });
ContextMode.REMOVE_SPAWNPOINT = new ContextMode("removeSpawnpoint", function() {
  context.viewMode = DisplayMode.SPAWNPOINTS;
});
ContextMode.VIEW_SPAWNPOINT_NAME = new ContextMode("viewSpawnpointName",
  function() {
    context.viewMode = DisplayMode.SPAWNPOINTS;
    document.getElementById("tooloptionsdiv").style.display = "";
    document.getElementById("spawnpointname").style.display = "";
  },
  function() {
    document.getElementById("tooloptionsdiv").style.display = "none";
    document.getElementById("spawnpointname").style.display = "none";
  });
ContextMode.SET_GROUND_TILE = new ContextMode("setGroundTile", function() {
  context.viewMode = DisplayMode.MAP;
});
ContextMode.LINK_PORTAL_ONE = new ContextMode("linkPortalOne", function() {
  context.viewMode = DisplayMode.MAP;
});
ContextMode.LINK_PORTAL_TWO = new ContextMode("linkPortalTwo", function() {
  context.viewMode = DisplayMode.SPAWNPOINTS;
});

function createToolbarButton(label, callback) {
  let b = document.createElement("BUTTON");
  b.type = "button";
  b.innerHTML = label;
  b.addEventListener("click", callback, false);
  return b;
}

function initializeToolbar() {
  context = new Context();
  let toolbar = document.getElementById("toolbardiv"),
      viewbar = document.getElementById("viewbar"),
      tilesDiv = document.createElement("FORM");

  viewbar.append(createToolbarButton("View map", function(e) {
    context.viewMode = DisplayMode.MAP;
  }));
  viewbar.append(createToolbarButton("View spawnpoints", function(e) {
    context.viewMode = DisplayMode.SPAWNPOINTS;
  }));

  for (const tileId of Object.keys(TILE_COLORS)) {
    let button = createToolbarButton(tileId.replace("_", " "), function(e) {
      let tile_id = document.getElementById("tile_id"),
          tile_color = document.getElementById("tile_color");
      tile_id.value = tileId;
      tile_color.value = TILE_COLORS[tileId];
    });
    if (/[0-9A].[0-9A].[0-9A]./.test(TILE_COLORS[tileId])) {
      button.style = `color: white; background-color: ${TILE_COLORS[tileId]};`;
    }
    else {
      button.style = `color: black; background-color: ${TILE_COLORS[tileId]};`;
    }
    tilesDiv.append(button);
  }
  toolbar.append(tilesDiv);

  toolbar.append(createToolbarButton("Draw", function(e) {
    context.mode = ContextMode.DRAW;
  }));
  toolbar.append(createToolbarButton("Pick a tile", function(e) {
    context.mode = ContextMode.PICKER;
  }));
  toolbar.append(createToolbarButton("Select a region", function(e) {
    context.mode = ContextMode.SELECT_ONE;
  }));
  toolbar.append(createToolbarButton("Clear selection", function(e) {
    context.clearSelection();
  }));
  toolbar.append(createToolbarButton("Fill selection", function(e) {
    context.fillSelection();
  }));
  toolbar.append(createToolbarButton("Draw a line", function(e) {
    context.mode = ContextMode.LINE_ONE;
  }));
  toolbar.append(createToolbarButton("Add spawnpoint", function(e) {
    context.mode = ContextMode.ADD_SPAWNPOINT;
  }));
  toolbar.append(createToolbarButton("Remove spawnpoint", function(e) {
    context.mode = ContextMode.REMOVE_SPAWNPOINT;
  }));
  toolbar.append(createToolbarButton("View spawnpoint name", function(e) {
    context.mode = ContextMode.VIEW_SPAWNPOINT_NAME;
  }));
  toolbar.append(createToolbarButton("Set ground tile", function(e) {
    context.mode = ContextMode.SET_GROUND_TILE;
  }));
  toolbar.append(createToolbarButton("Link portal", function(e) {
    context.mode = ContextMode.LINK_PORTAL_ONE;
  }));
}

class Tile {
  constructor(tileId, color="#FF00FF") {
    this.tileId = tileId;
    this.color = color;
    this.tileData = new Map();
  }

  toJSON() {
    if (this.tileData.size == 0) {
      return {"tile_id": this.tileId};
    }
    let tileDataJSON = Object.fromEntries(this.tileData);
    if (this.tileData.has("world_id") && tileDataJSON["world_id"] === SELF) {
      tileDataJSON["world_id"] = document.getElementById("worldname").value;
    }
    return {"tile_id": this.tileId, "tile_data": tileDataJSON};
  }

  setMetadata(prop, value) {
    this.tileData.set(prop, value);
  }
}

class World {
  constructor(width=0, height=0) {
    this.tiles = [];
    this.mapElem = document.getElementById("map");
    this.spawnpointMapElem = document.getElementById("spawnpointmap");
    document.getElementById("toolbardiv").style.display = "";
    document.getElementById("mapdiv").style.display = "";
    this.mapElem.innerHTML = "";
    this.spawnpointMapElem.innerHTML = "";
    this.spawnpoints = new Map();
    for (let i = 0; i < height; i++) {
      this.addRow();
      for (let j = 0; j < width; j++) {
        this.addTile(i);
      }
    }
  }

  get width() {
    if (this.tiles.length > 0) {
      return this.tiles[0].length;
    } else {
      return 0;
    }
  }

  get height() {
    if (this.tiles.length > 0) {
      return this.tiles.length;
    } else {
      return 0;
    }
  }

  static makeDefaultTile() {
    return new Tile(DEFAULT_TILE_ID, TILE_COLORS[DEFAULT_TILE_ID]);
  }

  addRow() {
    this.tiles.push([]);
    let row = document.createElement("TR");
    this.mapElem.appendChild(row);
    let spawnpointRow = document.createElement("TR");
    this.spawnpointMapElem.appendChild(spawnpointRow);
  }

  popRow() {
    this.tiles.pop();
    this.mapElem.removeChild(this.mapElem.lastChild);
    this.spawnpointMapElem.removeChild(this.spawnpointMapElem.lastChild);
  }

  addRowTop() {
    this.tiles.unshift([]);
    let row = document.createElement("TR");
    this.mapElem.prepend(row);
    let spawnpointRow = document.createElement("TR");
    this.spawnpointMapElem.prepend(spawnpointRow);
  }

  popRowTop() {
    this.tiles.shift();
    this.mapElem.removeChild(this.mapElem.firstChild);
    this.spawnpointMapElem.removeChild(this.spawnpointMapElem.firstChild);
  }

  getRowHTML(rowNum) {
    return this.mapElem.children[rowNum];
  }

  getSpawnpointRowHTML(rowNum) {
    return this.spawnpointMapElem.children[rowNum];
  }

  addTile(rowNum) {
    let tile = World.makeDefaultTile();
    this.tiles[rowNum].push(tile);
    let row = this.getRowHTML(rowNum),
        elem = document.createElement("TD");
    elem.style.backgroundColor = tile.color;
    row.appendChild(elem);
    let spawnpointRow = this.getSpawnpointRowHTML(rowNum),
        spawnpointElem = document.createElement("TD");
    spawnpointRow.appendChild(spawnpointElem);
  }

  popTile(rowNum) {
    this.tiles[rowNum].pop();
    let row = this.getRowHTML(rowNum);
    row.removeChild(row.lastChild);
    let spawnpointRow = this.getSpawnpointRowHTML(rowNum);
    spawnpointRow.removeChild(spawnpointRow.lastChild);
  }

  addTileLeft(rowNum) {
    let tile = World.makeDefaultTile();
    this.tiles[rowNum].unshift(tile);
    let row = this.getRowHTML(rowNum),
        elem = document.createElement("TD");
    elem.style.backgroundColor = tile.color;
    row.prepend(elem);
    let spawnpointRow = this.getSpawnpointRowHTML(rowNum),
        spawnpointElem = document.createElement("TD");
    spawnpointRow.prepend(spawnpointElem);
  }

  popTileLeft(rowNum) {
    this.tiles[rowNum].shift();
    let row = this.getRowHTML(rowNum);
    row.removeChild(row.firstChild);
    let spawnpointRow = this.getSpawnpointRowHTML(rowNum);
    spawnpointRow.removeChild(spawnpointRow.firstChild);
  }

  getTile(rowNum, colNum) {
    return this.tiles[rowNum][colNum];
  }

  getTileHTML(rowNum, colNum) {
    return this.mapElem.children[rowNum].children[colNum];
  }

  getTileSpawnpointHTML(rowNum, colNum) {
    return this.spawnpointMapElem.children[rowNum].children[colNum];
  }

  setTile(rowNum, colNum, tile) {
    let elem = this.getTileHTML(rowNum, colNum);
    elem.style.backgroundColor = tile.color;
    this.tiles[rowNum][colNum] = tile;
  }

  getSpawnpointByCoord(tileCoord) {
    for (const [spawnId, spawnpointCoord] of this.spawnpoints) {
      if (spawnpointCoord.equals(tileCoord)) {
        return spawnId;
      }
    }
    return null;
  }

  setSpawnpoint(spawnId, tileCoord) {
    if (this.spawnpoints.has(spawnId)) {
      this.removeSpawnpoint(spawnId);
    }
    this.removeSpawnpointByCoord(tileCoord);
    this.spawnpoints.set(spawnId, tileCoord);
    this.getTileSpawnpointHTML(tileCoord.rowNum, tileCoord.colNum).classList.add("hasspawn");
  }

  removeSpawnpoint(spawnId) {
    let tc = this.spawnpoints.get(spawnId);
    if (tc) {
      this.getTileSpawnpointHTML(tc.rowNum, tc.colNum).classList.remove("hasspawn");
      this.spawnpoints.delete(spawnId);
    }
  }

  removeSpawnpointByCoord(tileCoord) {
    let spawn_id = this.getSpawnpointByCoord(tileCoord);
    if (spawn_id) {
      this.removeSpawnpoint(spawn_id);
    }
  }
}

function handleClick(e) {
  let cellClicked = e.target,
      rowClicked = cellClicked.parentNode,
      table = rowClicked.parentNode,
      colNum = Array.from(rowClicked.children).indexOf(cellClicked),
      rowNum = Array.from(table.children).indexOf(rowClicked),
      clickedTileCoord = new TileCoord(rowNum, colNum);
  if (context.mode === ContextMode.DRAW) {
    context.drawPixel(rowNum, colNum);
  } else if (context.mode === ContextMode.PICKER) {
    let tile = map.getTile(rowNum, colNum);
    context.setDrawTile(tile);
    context.mode = ContextMode.DRAW;
  } else if (context.mode === ContextMode.SELECT_ONE) {
    context.setSelection(new Selection(clickedTileCoord, clickedTileCoord));
    context.mode = ContextMode.SELECT_TWO;
  } else if (context.mode === ContextMode.SELECT_TWO) {
    if (context.selection) {
      let startTileCoord = context.selection.upperLeft,
          minRow = Math.min(startTileCoord.rowNum, clickedTileCoord.rowNum),
          maxRow = Math.max(startTileCoord.rowNum, clickedTileCoord.rowNum),
          minCol = Math.min(startTileCoord.colNum, clickedTileCoord.colNum),
          maxCol = Math.max(startTileCoord.colNum, clickedTileCoord.colNum);
      context.setSelection(new Selection(
        new TileCoord(minRow, minCol),
        new TileCoord(maxRow, maxCol)));
    }
    context.mode = ContextMode.SELECT_ONE;
  } else if (context.mode === ContextMode.LINE_ONE) {
    context.setSelection(new Selection(clickedTileCoord, clickedTileCoord));
    context.mode = ContextMode.LINE_TWO;
  } else if (context.mode === ContextMode.LINE_TWO) {
    if (context.selection) {
      let startCoord = context.selection.upperLeft;
      context.drawLine(startCoord, clickedTileCoord);
      context.clearSelection();
    }
    context.mode = ContextMode.LINE_ONE;
  } else if (context.mode === ContextMode.ADD_SPAWNPOINT) {
    let spawnId = document.getElementById("spawn_id").value;
    if (/^[a-zA-Z0-9_]+$/.test(spawnId)) {
      map.setSpawnpoint(spawnId, clickedTileCoord);
    }
  } else if (context.mode === ContextMode.REMOVE_SPAWNPOINT) {
    map.removeSpawnpointByCoord(clickedTileCoord);
  } else if (context.mode === ContextMode.VIEW_SPAWNPOINT_NAME) {
    let spawnName = document.getElementById("spawn_name"),
        spawnId = map.getSpawnpointByCoord(clickedTileCoord);
    if (spawnId) {
      spawnName.innerText = spawnId;
    }
  } else if (context.mode === ContextMode.SET_GROUND_TILE) {
    let groundTileId = document.getElementById("tile_id").value,
        groundTile = {"tile_id": tileId},
        tile = map.getTile(rowNum, colNum);
    tile.setMetadata("ground_tile", groundTile);
  } else if (context.mode === ContextMode.LINK_PORTAL_ONE) {
    context.setSelection(new Selection(clickedTileCoord, clickedTileCoord));
    context.mode = ContextMode.LINK_PORTAL_TWO;
  } else if (context.mode === ContextMode.LINK_PORTAL_TWO) {
    let spawnId = map.getSpawnpointByCoord(clickedTileCoord),
        portalCoord = context.selection.upperLeft,
        portal = map.getTile(portalCoord.rowNum, portalCoord.colNum);
    if (spawnId) {
      portal.setMetadata("world_id", SELF);
      portal.setMetadata("spawn_id", spawnId);
    }
    context.mode = ContextMode.LINK_PORTAL_ONE;
  }
}

function expandLeft() {
  if (map.height === 0) {
    map.addRow();
  }
  for (let i = 0; i < map.height; i++) {
    map.addTileLeft(i);
  }
}

function shrinkLeft() {
  if (map.width > 0) {
    for (let i = 0; i < map.height; i++) {
      map.popTileLeft(i);
    }
  }
}

function expandRight() {
  if (map.height === 0) {
    map.addRow();
  }
  for (let i = 0; i < map.height; i++) {
    map.addTile(i);
  }
}

function shrinkRight() {
  if (map.width > 0) {
    for (let i = 0; i < map.height; i++) {
      map.popTile(i);
    }
  }
}

function expandTop() {
  let w = Math.max(1, map.width);
  map.addRowTop();
  for (let i = 0; i < w; i++) {
    map.addTile(0);
  }
}

function shrinkTop() {
  if (map.height > 0) {
    map.popRowTop();
  }
}

function expandBottom() {
  let w = Math.max(1, map.width),
      h = map.height;
  map.addRow();
  for (let i = 0; i < w; i++) {
    map.addTile(h);
  }
}

function shrinkBottom() {
  if (map.height > 0) {
    map.popRow();
  }
}

function importMap() {
  let mapJson = document.getElementById("import").value,
      mapObj = JSON.parse(mapJson),
      mapArr = mapObj["tiles"],
      spawnpoints = mapObj["spawn_points"],
      tiles = [];
  map = new World();
  for (let row = 0; row < mapArr.length; row++) {
    map.addRow()
    for (let col = 0; col < mapArr[row].length; col++) {
      let tile = mapArr[row][col],
          tileId = tile["tile_id"],
          tileData = tile["tile_data"],
          tileColor = TILE_COLORS[tileId];
      map.addTile(row);
      map.setTile(row, col, new Tile(tileId, tileColor, tileData));
    }
  }
  for (const spawnId of Object.keys(spawnpoints)) {
    map.setSpawnpoint(spawnId.replaceAll(/[^a-zA-Z0-9_]/, ""),
      TileCoord.fromJSON(spawnpoints[spawnId]));
  }
}

function makeMap() {
  const width = parseInt(document.getElementById("width").value),
        height = parseInt(document.getElementById("height").value);
  map = new World(width, height);
}

function makeOutput() {
  const outputDiv = document.getElementById("outputdiv"),
        outputBox = document.getElementById("output");
  outputDiv.style.display = "";
  let outputObj = {},
      jsonTiles = map.tiles.map(row => row.map(tile => tile.toJSON())),
      jsonSpawnpoints = {};
  for (const [spawnId, spawnpointCoord] of map.spawnpoints) {
    jsonSpawnpoints[spawnId] = spawnpointCoord.toJSON();
  }
  outputObj["version"] = "0.3.0";
  outputObj["tiles"] = jsonTiles;
  outputObj["entities"] = [];
  outputObj["spawn_points"] = jsonSpawnpoints;
  outputObj["cutscenes"] = [];
  outputObj["patches"] = {}
  outputBox.value = JSON.stringify(outputObj);
}
