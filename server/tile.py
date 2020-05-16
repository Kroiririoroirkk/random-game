from config import BLOCK_WIDTH
from geometry import BoundingBox, LineSegment, Vec
from world import worlds

class Tile:
  def __init__(self):
    self.blocks_movement = False

  async def on_move_on(self, game, ws, username, player, player_start_pos, tile_pos):
    pass

  async def on_interact(self, game, ws, username, player, tile_pos):
    pass

def get_tile_bounding_box(tile_pos):
  block = Vec(BLOCK_WIDTH-1, BLOCK_WIDTH-1)
  return BoundingBox(tile_pos, tile_pos + block)

def block_movement(tile_pos, player_start_pos, player):
  bbox = get_tile_bounding_box(tile_pos)
  p_bbox = player.get_bounding_box()
  d = p_bbox.get_width()
  player_path = LineSegment(player_start_pos, player.pos)
  path_ne = player_path.shift(Vec(d-1,0))
  path_nw = player_path
  path_se = player_path.shift(Vec(d-1,d-1))
  path_sw = player_path.shift(Vec(0,d-1))
  if ((path_ne.is_intersecting(bbox.get_left_side())
      or path_se.is_intersecting(bbox.get_left_side()))
      and path_ne.start.x <= bbox.get_left_b()):
    player.pos.x = bbox.get_left_b() - d
  if ((path_sw.is_intersecting(bbox.get_top_side())
      or path_se.is_intersecting(bbox.get_top_side()))
      and path_sw.start.y <= bbox.get_top_b()):
    player.pos.y = bbox.get_top_b() - d
  if ((path_nw.is_intersecting(bbox.get_right_side())
      or path_sw.is_intersecting(bbox.get_right_side()))
      and path_nw.start.x >= bbox.get_right_b()):
    player.pos.x = bbox.get_right_b() + 1
  if ((path_nw.is_intersecting(bbox.get_bottom_side())
      or path_ne.is_intersecting(bbox.get_bottom_side()))
      and path_nw.start.y >= bbox.get_bottom_b()):
    player.pos.y = bbox.get_bottom_b() + 1

class TileMetadata:
  pass

class TilePlus(Tile):
  def __init__(self, data):
    super().__init__()
    self.data = data

class Empty(Tile):
  pass

class Grass(Tile):
  pass

class WildGrass(Tile):
  pass

class Wall(Tile):
  def __init__(self):
    super().__init__()
    self.blocks_movement = True

class PortalData(TileMetadata):
  def __init__(self, w_id, spawn_num):
    super().__init__()
    self.w_id = w_id
    self.spawn_num = spawn_num

class Portal(TilePlus):
  async def on_move_on(self, game, ws, username, player, player_start_pos, tile_pos):
    w_id = self.data.w_id
    w = worlds.get(w_id)
    spawn_num = self.data.spawn_num
    await game.set_and_send_world(ws, username, player, w, spawn_num)
    await game.send_players(ws, username, w_id)

class SignData(TileMetadata):
  def __init__(self, text, ground_tile):
    super().__init__()
    self.text = text
    self.ground_tile = ground_tile

class Sign(TilePlus):
  async def on_interact(self, game, ws, username, player, tile_pos):
    await game.send_sign(ws, self)

