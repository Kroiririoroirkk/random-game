import json

from tile import tile_from_JSON
from world import TileXY, World, worlds

"""
def load_world(w):
  world_map = w.text.split("|")
  tiles = []
  tile_metadata = w.tile_metadata
  entities = []
  for line in world_map:
    rowTiles = []
    for char in line:
      if char == " ":
        rowTiles.append(tile.Empty())
      elif char == "g":
        rowTiles.append(tile.Grass())
      elif char == "G":
        rowTiles.append(tile.WildGrass())
      elif char == "w":
        rowTiles.append(tile.Wall())
      elif char == "p":
        rowTiles.append(tile.Portal(tile_metadata.pop(0)))
      elif char == "s":
        rowTiles.append(tile.Sign(tile_metadata.pop(0)))
    tiles.append(rowTiles)
  world_obj = World(w.w_id, w.text, tiles, entities, w.spawn_posits)
  worlds[w.w_id] = world_obj
  return world_obj

STARTING_WORLD_DATA = WorldData("starting_world",
  "        wwwwwwwwwwwwwwwwwwww        |"
  "      wwwwwwwwwwwwwwwwwwwwwwww      |"
  "   wwwwwwggggggggggggggggggwwwwww   |"
  "  wwwwggggggggggggggggggggggggwwww  |"
  " wwwggggggggggggggggggggggggggggwww |"
  " wwggggggggggggggggggggggggggggggww |"
  "wwwggggggggggggggggggggggggggggggwww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwgggggggggggggggggggggggggggpggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwgggggggGggggGgggggGGGGGGGgggggggww|"
  "wwgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGGGGGGggggggggGggggggggggww|"
  "wpgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGggggGgggggGGGGGGGggssgggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwgggggggggggggggggggggggggggpggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwwggggggggggggggggggggggggggggggwww|"
  " wwggggggggggggggggggggggggggggggww |"
  " wwwggggggggggggggggggggggggggggwww |"
  "  wwwwggggggggggggggggggggggggwwww  |"
  "   wwwwwwggggggggsgggggggggwwwwww   |"
  "      wwwwwwwwwwwwpwwwwwwwwwww      |"
  "        wwwwwwwwwwwwwwwwwwww        ",
  {"center_spawn": TileXY(18,18),
   "bottom_portal": TileXY(18,34),
   "left_portal": TileXY(1,18),
   "top_right_portal": TileXY(29,12),
   "bottom_right_portal": TileXY(29,26)},
  [tile.PortalData("starting_world", "bottom_right_portal"),
   tile.PortalData("second_world", "bottom_left_portal"),
   tile.SignData("Hello,", tile.WildGrass()),
   tile.SignData("World!", tile.WildGrass()),
   tile.PortalData("starting_world", "top_right_portal"),
   tile.SignData("Enter the portal!", tile.Grass()),
   tile.PortalData("second_world", "top_right_portal")])
SECOND_WORLD_DATA = WorldData("second_world",
  "wwww|"
  "wgpw|"
  "wpGw|"
  "wwww",
  {"bottom_left_portal": TileXY(1,2),
   "top_right_portal": TileXY(2,1)},
  [tile.PortalData("starting_world", "bottom_portal"),
   tile.PortalData("starting_world", "left_portal")])
"""

def load_world(world_id, w):
  assert w["version"] == "0.0.0"
  tiles = []
  for row in w["tiles"]:
    row_tiles = []
    for t in row:
      row_tiles.append(tile_from_JSON(t))
    tiles.append(row_tiles)

  spawn_points = {spawn_id:
    TileXY(spawn_tileXY["block_x"], spawn_tileXY["block_y"])
    for spawn_id, spawn_tileXY in w["spawn_points"].items()}
  worlds[world_id] = World(world_id, tiles, spawn_points)

def load_file(world_id):
  with open(f"{world_id}.json") as f:
    load_world(world_id, json.load(f))

def load_worlds():
  load_file("starting_world")
  load_file("second_world")

