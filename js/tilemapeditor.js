"use strict";

var map;
var context;
window.onload = function() {
  document.getElementById("map").addEventListener("click", handleClick, false);
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

const DEFAULT_TILE = "grass";

class TileCoord {
  constructor(rowNum, colNum) {
    this.rowNum = rowNum;
    this.colNum = colNum;
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
    this.mode = ContextModes.DRAW;
    this.selection = null;
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

class ContextModes {}

ContextModes.DRAW = 1;
ContextModes.PICKER = 2;
ContextModes.SELECT_ONE = 3;
ContextModes.SELECT_TWO = 4;
ContextModes.FILL = 5;
ContextModes.LINE_ONE = 6;
ContextModes.LINE_TWO = 7;

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
      tilesDiv = document.createElement("FORM");
  for (const tileId of Object.keys(TILE_COLORS)) {
    let button = createToolbarButton(tileId.replace("_", " "), function(e) {
      let tile_id = document.getElementById("tile_id"),
          tile_color = document.getElementById("tile_color");
      tile_id.value = tileId;
      tile_color.value = TILE_COLORS[tileId];
      context.mode = ContextModes.DRAW;
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

  toolbar.append(createToolbarButton("Pick a tile!", function(e) {
    context.mode = ContextModes.PICKER;
  }));
  toolbar.append(createToolbarButton("Select a region!", function(e) {
    context.mode = ContextModes.SELECT_ONE;
  }));
  toolbar.append(createToolbarButton("Clear selection!", function(e) {
    context.clearSelection();
  }));
  toolbar.append(createToolbarButton("Fill selection!", function(e) {
    context.fillSelection();
  }));
  toolbar.append(createToolbarButton("Draw a line!", function(e) {
    context.mode = ContextModes.LINE_ONE;
  }));
}

class Tile {
  constructor(tileId, color="#FF00FF", tileData=undefined) {
    this.tileId = tileId;
    this.color = color;
    this.tileData = tileData;
  }

  toJSON() {
    if (this.tileData) {
      return {"tile_id": this.tileId, "tile_data": this.tileData};
    }
    return {"tile_id": this.tileId};
  }
}

class Map {
  constructor(width=0, height=0) {
    this.tiles = [];
    this.mapElem = document.getElementById("map");
    document.getElementById("toolbardiv").style.display = "block";
    document.getElementById("mapdiv").style.display = "block";
    this.mapElem.innerHTML = "";
    for (let i = 0; i < height; i++) {
      this.addRow();
      for (let j = 0; j < width; j++) {
        this.addTile(i);
      }
    }
  }

  addRow() {
    this.tiles.push([]);
    let row = document.createElement("TR");
    this.mapElem.appendChild(row);
  }

  getRowHTML(rowNum) {
    return this.mapElem.children[rowNum];
  }

  addTile(rowNum) {
    this.tiles[rowNum].push(new Tile(DEFAULT_TILE, TILE_COLORS[DEFAULT_TILE]));
    let row = this.getRowHTML(rowNum),
        elem = document.createElement("TD");
    elem.style.backgroundColor = TILE_COLORS[DEFAULT_TILE];
    row.appendChild(elem);
  }

  getTile(rowNum, colNum) {
    return this.tiles[rowNum][colNum];
  }

  getTileHTML(rowNum, colNum) {
    return this.mapElem.children[rowNum].children[colNum];
  }

  setTile(rowNum, colNum, tile) {
    let elem = this.getTileHTML(rowNum, colNum);
    elem.style.backgroundColor = tile.color;
    this.tiles[rowNum][colNum] = tile;
  }
}

function handleClick(e) {
  let cellClicked = e.target,
      rowClicked = cellClicked.parentNode,
      table = rowClicked.parentNode,
      colNum = Array.from(rowClicked.children).indexOf(cellClicked),
      rowNum = Array.from(table.children).indexOf(rowClicked);
  if (context.mode === ContextModes.DRAW) {
    context.drawPixel(rowNum, colNum);
  } else if (context.mode === ContextModes.PICKER) {
    let tile = map.getTile(rowNum, colNum);
    context.setDrawTile(tile);
    context.mode = ContextModes.DRAW;
  } else if (context.mode === ContextModes.SELECT_ONE) {
    let clickedTileCoord = new TileCoord(rowNum, colNum);
    context.setSelection(new Selection(clickedTileCoord, clickedTileCoord));
    context.mode = ContextModes.SELECT_TWO;
  } else if (context.mode === ContextModes.SELECT_TWO) {
    if (context.selection) {
      let clickedTileCoord = new TileCoord(rowNum, colNum);
      context.setSelection(new Selection(context.selection.upperLeft, clickedTileCoord));
    }
    context.mode = ContextModes.SELECT_ONE;
  } else if (context.mode === ContextModes.LINE_ONE) {
    let clickedTileCoord = new TileCoord(rowNum, colNum);
    context.setSelection(new Selection(clickedTileCoord, clickedTileCoord));
    context.mode = ContextModes.LINE_TWO;
  } else if (context.mode === ContextModes.LINE_TWO) {
    if (context.selection) {
      let startCoord = context.selection.upperLeft,
          endCoord = new TileCoord(rowNum, colNum);
      context.drawLine(startCoord, endCoord);
    }
    context.mode = ContextModes.LINE_ONE;
  }
}

function importMap() {
  let mapJson = document.getElementById("import").value,
      mapArr = JSON.parse(mapJson),
      tiles = [];
  map = new Map();
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
}

function makeMap() {
  const width = parseInt(document.getElementById("width").value),
        height = parseInt(document.getElementById("height").value);
  map = new Map(width, height);
}

function makeOutput() {
  const outputDiv = document.getElementById("outputdiv"),
        outputBox = document.getElementById("output");
  outputDiv.style.display = "block";
  let jsonTiles = map.tiles.map(row => row.map(tile => tile.toJSON()));
  outputBox.value = JSON.stringify(jsonTiles);
}
