"use strict";

var map;
window.onload = function() {
  document.getElementById("map").addEventListener("click", handleClick, false);
};

class Tile {
  constructor(tileId, color, toJSON=this.defaultJSON) {
    this.tileId = tileId;
    this.color = color;
    this.toJSON = toJSON;
  }

  defaultJSON() {
    return {"tile_id": this.tileId};
  }
}

class Map {
  constructor(width, height) {
    this.tiles = [];
    this.mapElem = document.getElementById("map");
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
    this.tiles[rowNum].push(new Tile("grass", "#00ff00"));
    let row = this.getRow(rowNum),
        elem = document.createElement("TD");
    elem.style.backgroundColor = "#00ff00";
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
