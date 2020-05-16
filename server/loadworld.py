from world import worlds, TileXY, World, WorldData
import tile

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
  [TileXY(18,18),
   TileXY(18,34),
   TileXY(1,18),
   TileXY(29,12),
   TileXY(29,26)],
  [tile.PortalData("starting_world", 4),
   tile.PortalData("second_world", 0),
   tile.SignData("Hello,", tile.WildGrass()),
   tile.SignData("World!", tile.WildGrass()),
   tile.PortalData("starting_world", 3),
   tile.SignData("Enter the portal!", tile.Grass()),
   tile.PortalData("second_world", 1)])
SECOND_WORLD_DATA = WorldData("second_world",
  "wwww|"
  "wgpw|"
  "wpGw|"
  "wwww",
  [TileXY(1,2),
   TileXY(2,1)],
  [tile.PortalData("starting_world", 1),
   tile.PortalData("starting_world", 2)])

def load_worlds():
  load_world(STARTING_WORLD_DATA)
  load_world(SECOND_WORLD_DATA)

