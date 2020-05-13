from config import BLOCK_WIDTH
from geometry import Vec
import entity

worlds = {}

class World:
  def __init__(self, w_id, text, game_objs, wall_objs, portal_objs, spawn_posits):
    self.w_id = w_id
    self.text = text
    self.game_objs = game_objs
    self.wall_objs = wall_objs
    self.portal_objs = portal_objs
    self.spawn_posits = spawn_posits

class WorldData:
  def __init__(self, w_id, text, spawn_posits, linked_dests):
    self.w_id = w_id
    self.text = text
    self.spawn_posits = spawn_posits
    self.linked_dests = linked_dests

def load_world(w):
  world_map = w.text.split("|")
  game_objs = []
  wall_objs = []
  portal_objs = []
  linked_dests = w.linked_dests
  for j, line in enumerate(world_map):
    for i, char in enumerate(line):
      pos = Vec(i * BLOCK_WIDTH, j * BLOCK_WIDTH)
      if char == "g":
        game_objs.append(entity.Grass(pos))
      elif char == "G":
        game_objs.append(entity.WildGrass(pos))
      elif char == "w":
        wall_objs.append(entity.Wall(pos))
      elif char == "p":
        portal_objs.append(entity.Portal(pos, linked_dests.pop(0)))
  world_obj = World(w.w_id, w.text, game_objs, wall_objs, portal_objs, w.spawn_posits)
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
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwgggggggGggggGgggggGGGGGGGgggggggww|"
  "wwgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGGGGGGggggggggGggggggggggww|"
  "wpgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGggggGggggggggGggggggggggww|"
  "wwgggggggGggggGgggggGGGGGGGgggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwggggggggggggggggggggggggggggggggww|"
  "wwwggggggggggggggggggggggggggggggwww|"
  " wwggggggggggggggggggggggggggggggww |"
  " wwwggggggggggggggggggggggggggggwww |"
  "  wwwwggggggggggggggggggggggggwwww  |"
  "   wwwwwwggggggggggggggggggwwwwww   |"
  "      wwwwwwwwwwwwpwwwwwwwwwww      |"
  "        wwwwwwwwwwwwwwwwwwww        ",
  [Vec(18,34).blocks_to_px(),
   Vec(18,18).blocks_to_px(),
   Vec(1,18).blocks_to_px()],
  [entity.PortalDest("second_world", 0),
   entity.PortalDest("second_world", 1)])
SECOND_WORLD_DATA = WorldData("second_world",
  "wwww|"
  "wgpw|"
  "wpGw|"
  "wwww",
  [Vec(1,2).blocks_to_px(),
   Vec(2,1).blocks_to_px()],
  [entity.PortalDest("starting_world", 1),
   entity.PortalDest("starting_world", 2)])

STARTING_WORLD = load_world(STARTING_WORLD_DATA)
SECOND_WORLD = load_world(SECOND_WORLD_DATA)
