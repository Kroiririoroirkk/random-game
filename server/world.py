from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import Vec
import entity

worlds = {}

class SpawnPoint:
  def __init__(self, block_x, block_y):
    self.block_x = block_x
    self.block_y = block_y

  def get_spawn_pos(self):
    return Vec(self.block_x * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2,
               self.block_y * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2)

class World:
  def __init__(self, w_id, text, game_objs, wall_objs, portal_objs, sign_objs, spawn_posits):
    self.w_id = w_id
    self.text = text
    self.game_objs = game_objs
    self.wall_objs = wall_objs
    self.portal_objs = portal_objs
    self.sign_objs = sign_objs
    self.spawn_posits = spawn_posits

class WorldData:
  def __init__(self, w_id, text, spawn_posits, entity_metadata):
    self.w_id = w_id
    self.text = text
    self.spawn_posits = spawn_posits
    self.entity_metadata = entity_metadata

def load_world(w):
  world_map = w.text.split("|")
  game_objs = []
  wall_objs = []
  portal_objs = []
  sign_objs = []
  entity_metadata = w.entity_metadata
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
        portal_objs.append(entity.Portal(pos, entity_metadata.pop(0)))
      elif char == "s":
        sign_objs.append(entity.Sign(pos, entity_metadata.pop(0).text))
  world_obj = World(w.w_id, w.text, game_objs, wall_objs, portal_objs, sign_objs, w.spawn_posits)
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
  "wwgggggggGggggGgggggGGGGGGGggssgggww|"
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
  "   wwwwwwggggggggsgggggggggwwwwww   |"
  "      wwwwwwwwwwwwpwwwwwwwwwww      |"
  "        wwwwwwwwwwwwwwwwwwww        ",
  [SpawnPoint(18,18),
   SpawnPoint(18,34),
   SpawnPoint(1,18)],
  [entity.PortalDest("second_world", 0),
   entity.SignText("Hello,"),
   entity.SignText("World!"),
   entity.SignText("Enter the portal!"),
   entity.PortalDest("second_world", 1)])
SECOND_WORLD_DATA = WorldData("second_world",
  "wwww|"
  "wgpw|"
  "wpGw|"
  "wwww",
  [SpawnPoint(1,2),
   SpawnPoint(2,1)],
  [entity.PortalDest("starting_world", 1),
   entity.PortalDest("starting_world", 2)])

STARTING_WORLD = load_world(STARTING_WORLD_DATA)
SECOND_WORLD = load_world(SECOND_WORLD_DATA)
