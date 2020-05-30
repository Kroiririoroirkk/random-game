"use strict";

var map;
window.onload = function() {
  document.getElementById("map").addEventListener("click", handleClick, false);
  initializeToolbar();
};

const TILE_COLORS = {
  "empty": "#000000",
  "grass": "#00FF00",
  "wild_grass": "#00B400",
  "wall": "#D2691E",
  "portal": "#000000",
  "sign": "#FFFF00",
  "deep_water": "#000ABE",
  "shallow_water": "#005A78",
  "dirt": "#645A28",
  "desert": "#BEAA46",
  "lava": "#FF9600",
  "floor": "#8C643C",
  "indoor_wall": "#003200",
  "barrier": "#000000"
};

const DEFAULT_TILE = "grass";

function initializeToolbar() {
  let toolbar = document.getElementById("toolbardiv"),
      tilesDiv = document.createElement("DIV");
  for (const tileId of Object.keys(TILE_COLORS)) {
    let button = document.createElement("INPUT");
    button.type = "button";
    button.value = tileId;
    button.addEventListener("click", function(e) {
      let tile_id = document.getElementById("tile_id"),
          tile_color = document.getElementById("tile_color");
      tile_id.value = tileId;
      tile_color.value = TILE_COLORS[tileId];
    }, false);
    tilesDiv.append(button);
  }
  toolbar.append(tilesDiv);
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

  getRow(rowNum) {
    return this.mapElem.children[rowNum];
  }

  addTile(rowNum) {
    this.tiles[rowNum].push(new Tile(DEFAULT_TILE, TILE_COLORS[DEFAULT_TILE]));
    let row = this.getRow(rowNum),
        elem = document.createElement("TD");
    elem.style.backgroundColor = TILE_COLORS[DEFAULT_TILE];
    row.appendChild(elem);
  }

  getTile(rowNum, colNum) {
    return this.mapElem.children[rowNum].children[colNum];
  }

  setTile(rowNum, colNum, tile) {
    let elem = this.getTile(rowNum, colNum);
    elem.style.backgroundColor = tile.color;
    this.tiles[rowNum][colNum] = tile;
  }
}

function handleClick(e) {
  let cellClicked = e.target,
      rowClicked = cellClicked.parentNode,
      table = rowClicked.parentNode,
      colNum = Array.from(rowClicked.children).indexOf(cellClicked),
      rowNum = Array.from(table.children).indexOf(rowClicked),
      tileId = document.getElementById("tile_id").value,
      tileColor = document.getElementById("tile_color").value,
      tile = new Tile(tileId, tileColor);
  map.setTile(rowNum, colNum, tile);
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
