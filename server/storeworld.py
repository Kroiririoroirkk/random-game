import json

from tile import tile_to_JSON
from world import tileXY_to_pos

def world_to_client_JSON(world, spawn_pos):
  tiles_list = []
  for row in world.tiles:
    row_tiles = []
    for tile in row:
      row_tiles.append(tile_to_JSON(tile, True))
    tiles_list.append(row_tiles)

  obj = {
    "version": "0.0.0",
    "tiles": tiles_list,
    "spawn_pos": {
      "x": spawn_pos.x,
      "y": spawn_pos.y
    }
  }

  return json.dumps(obj, separators=(',', ':'))

def world_to_save_JSON(world):
  tiles_list = []
  for row in world.tiles:
    row_tiles = []
    for tile in row:
      row_tiles.append(tile_to_JSON(tile, False))
    tiles_list.append(row_tiles)

  obj = {
    "version": "0.0.0",
    "tiles": tiles_list,
    "spawn_points": {spawn_id:
      {"block_x": spawn_point.block_x, "block_y": spawn_point.block_y}
      for spawn_id, spawn_point in world.spawn_points.items()}
  }

  return json.dumps(obj, separators=(',', ':'))
