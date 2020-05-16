from config import BLOCK_WIDTH
from geometry import BoundingBox, Vec
from world import worlds
from tilebasic import Empty, Tile

def get_tile_bounding_box(tile_pos):
  block = Vec(BLOCK_WIDTH, BLOCK_WIDTH)
  return BoundingBox(tile_pos, tile_pos + block)

def block_movement(tile_pos, player_start_pos, player):
  bbox = get_tile_bounding_box(tile_pos)
  player_end_pos = player.pos
  player.pos = player_start_pos
  if player.get_bounding_box().is_touching(bbox):
    player.pos = player_end_pos
  else:
    dp = player_end_pos - player_start_pos
    dx = dp.x
    dy = dp.y
    player_width = player.get_width()
    player_height = player.get_height()

    player.move(Vec(dx,0))
    if player.get_bounding_box().is_touching(bbox):
      if dx > 0:
        player.setX(bbox.get_left_b() - player_width - 1)
      elif dx < 0:
        player.setX(bbox.get_right_b() + 1)

    player.move(Vec(0,dy))
    if player.get_bounding_box().is_touching(bbox):
      if dy > 0:
        player.setY(bbox.get_top_b() - player_height - 1)
      elif dy < 0:
        player.setY(bbox.get_bottom_b() + 1)

class TileMetadata:
  pass

class TilePlus(Tile):
  def __init__(self, data):
    super().__init__()
    self.data = data

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

