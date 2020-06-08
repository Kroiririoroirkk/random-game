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
}

const ContextModes = {
  DRAW: 1,
  PICKER: 2,
  SELECT_ONE: 3,
  SELECT_TWO: 4,
  FILL: 5
};

function initializeToolbar() {
  context = new Context();
  let toolbar = document.getElementById("toolbardiv"),
      tilesDiv = document.createElement("FORM");
  for (const tileId of Object.keys(TILE_COLORS)) {
    let button = document.createElement("BUTTON");
    button.type = "button";
    button.innerHTML = tileId.replace("_", " ");
    if (/[0-9A].[0-9A].[0-9A]./.test(TILE_COLORS[tileId])) {
      button.style = `color: white; background-color: ${TILE_COLORS[tileId]};`;
    }
    else {
      button.style = `color: black; background-color: ${TILE_COLORS[tileId]};`;
    }
    button.addEventListener("click", function(e) {
      let tile_id = document.getElementById("tile_id"),
          tile_color = document.getElementById("tile_color");
      tile_id.value = tileId;
      tile_color.value = TILE_COLORS[tileId];
      context.mode = ContextModes.DRAW;
    }, false);
    tilesDiv.append(button);
  }
  toolbar.append(tilesDiv);

  let tilePicker = document.createElement("BUTTON");
  tilePicker.type = "button";
  tilePicker.innerHTML = "Pick a tile!";
  tilePicker.addEventListener("click", function(e) {
    context.mode = ContextModes.PICKER;
  }, false);
  toolbar.append(tilePicker);

  let selectButton = document.createElement("BUTTON");
  selectButton.type = "button";
  selectButton.innerHTML = "Select a region!";
  selectButton.addEventListener("click", function(e) {
    context.mode = ContextModes.SELECT_ONE;
  }, false);
  toolbar.append(selectButton);

  let clearSelectionButton = document.createElement("BUTTON");
  clearSelectionButton.type = "button";
  clearSelectionButton.innerHTML = "Clear selection!";
  clearSelectionButton.addEventListener("click", function(e) {
    context.clearSelection();
  }, false);
  toolbar.append(clearSelectionButton);

  let fillSelectionButton = document.createElement("BUTTON");
  fillSelectionButton.type = "button";
  fillSelectionButton.innerHTML = "Fill selection!";
  fillSelectionButton.addEventListener("click", function(e) {
    fillSelection();
  }, false);
  toolbar.append(fillSelectionButton);
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
    let tileId = document.getElementById("tile_id").value,
        tileColor = document.getElementById("tile_color").value,
        tile = new Tile(tileId, tileColor);
    map.setTile(rowNum, colNum, tile);
  } else if (context.mode === ContextModes.PICKER) {
    let tile = map.getTile(rowNum, colNum),
        tileId = document.getElementById("tile_id"),
        tileColor = document.getElementById("tile_color");
    tileId.value = tile.tileId;
    tileColor.value = tile.color;
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
  }
}

function fillSelection() {
  let tileId = document.getElementById("tile_id").value,
  tileColor = document.getElementById("tile_color").value,
  tile = new Tile(tileId, tileColor);
  if (context.selection) {
    for (let rowNum = context.selection.upperLeft.rowNum;
         rowNum <= context.selection.lowerRight.rowNum;
         rowNum++) {
      for (let colNum = context.selection.upperLeft.colNum;
           colNum <= context.selection.lowerRight.colNum;
           colNum++) {
        map.setTile(rowNum, colNum, tile);
      }
    }
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
