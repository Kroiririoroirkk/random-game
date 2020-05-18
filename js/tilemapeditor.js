function charToObj(char) {
  let tile = {},
      tile_id = "",
      tile_data = {};
  if (char === " ") {
    tile_id = "empty";
  } else if (char === "g") {
    tile_id = "grass";
  } else if (char === "G") {
    tile_id = "wild_grass";
  } else if (char === "w") {
    tile_id = "wall";
  } else if (char === "p") {
    tile_id = "portal";
    tile_data.w_id = prompt("Portal destination world?");
    tile_data.spawn_id = prompt("Portal spawn ID?");
  } else if (char === "s") {
    tile_id = "sign";
    tile_data.text = prompt("Sign text?");
    tile_data.ground_tile = charToObj(prompt("Sign ground tile?"));
  }
  tile.tile_id = tile_id;
  if (Object.keys(tile_data).length !== 0) {
    tile.tile_data = tile_data;
  }
  return tile;
}

function makeMap() {
  let map = document.getElementById("map").value,
      lines = map.split(/\r?\n/g),
      obj = {version: "0.0.0"};

  let tiles = [];
  for (const line of lines) {
    let rowTiles = []
    for (const char of line) {
      rowTiles.push(charToObj(char));
    }
    tiles.push(rowTiles);
  }
  obj.tiles = tiles;

  let spawnPoints = {},
      inputSpawnPoints = true;
  while(inputSpawnPoints) {
    let spawnPointId = prompt("Spawn point ID?"),
        spawnPoint = {
          "block_x": parseInt(prompt("Spawn point block_x?")),
          "block_y": parseInt(prompt("Spawn point block_y?"))
        };
    spawnPoints[spawnPointId] = spawnPoint;
    inputSpawnPoints = prompt("More spawn points?") === "y";
  }
  obj.spawn_points = spawnPoints;

  document.getElementById("outputPara").display = "block";
  outputTextarea = document.getElementById("output");
  outputTextarea.style.display = "block";
  outputTextarea.value = JSON.stringify(obj);
}

