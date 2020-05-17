from config import BLOCK_WIDTH
from geometry import BoundingBox, Vec
from world import worlds
from tilebasic import Empty, Tile

_tiles = {}

def _register_tile(tile_id, tile_class):
  if tile_id in _tiles:
    raise ValueError
  else:
    _tiles[tile_id] = tile_class

_register_tile("empty", Empty)

def register_tile(tile_id):
  def decorator(tile_class):
    _register_tile(tile_id, tile_class)
    return tile_class
  return decorator

def get_tile_by_id(tile_id):
  tile_class = _tiles.get(tile_id)
  if tile_class:
    return tile_class
  else:
    raise ValueError

def get_tile_id(t):
  tile_class = type(t)
  try:
    return next(id for id, cls in _tiles.items() if cls == tile_class)
  except StopIteration:
    return ValueError

def tile_from_JSON(t):
  tile_class = get_tile_by_id(t["tile_id"])
  try:
    if issubclass(tile_class, TilePlus):
      tile = tile_class(tile_class.data_from_JSON(t["tile_data"]))
    else:
      tile = tile_class()
  except KeyError:
    tile = tile_class()
  return tile

def tile_to_JSON(t, is_to_client):
  if isinstance(t, TilePlus):
    if is_to_client:
      td = {k: v for k, v in t.data.to_JSON(True).items() if k in t.data.send_to_client}
    else:
      td = t.data.to_JSON(False)
    return {"tile_id": get_tile_id(t), "tile_data": td}
  else:
    return {"tile_id": get_tile_id(t)}

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

class TilePlus(Tile):
  def __init__(self, data):
    super().__init__()
    self.data = data

  @staticmethod
  def data_from_JSON(data):
    raise NotImplementedError

class TileMetadata:
  def __init__(self):
    self.send_to_client = []

  def to_JSON(self, is_to_client):
    raise NotImplementedError

@register_tile("grass")
class Grass(Tile):
  pass

@register_tile("wild_grass")
class WildGrass(Tile):
  pass

@register_tile("wall")
class Wall(Tile):
  def __init__(self):
    super().__init__()
    self.blocks_movement = True

class PortalData(TileMetadata):
  def __init__(self, w_id, spawn_id):
    super().__init__()
    self.w_id = w_id
    self.spawn_id = spawn_id

  def to_JSON(self, is_to_client):
    return {"w_id": self.w_id, "spawn_id": self.spawn_id}

@register_tile("portal")
class Portal(TilePlus):
  async def on_move_on(self, game, ws, username, player, player_start_pos, tile_pos):
    w_id = self.data.w_id
    w = worlds.get(w_id)
    spawn_id = self.data.spawn_id
    await game.set_and_send_world(ws, username, player, w, spawn_id)
    await game.send_players(ws, username, w_id)

  @staticmethod
  def data_from_JSON(data):
    return PortalData(data["w_id"], data["spawn_id"])

class SignData(TileMetadata):
  def __init__(self, text, ground_tile):
    super().__init__()
    self.text = text
    self.ground_tile = ground_tile
    self.send_to_client = ["ground_tile"]

  def to_JSON(self, is_to_client):
    return {"text": self.text, "ground_tile": tile_to_JSON(self.ground_tile, is_to_client)}

@register_tile("sign")
class Sign(TilePlus):
  async def on_interact(self, game, ws, username, player, tile_pos):
    await game.send_sign(ws, self)

  @staticmethod
  def data_from_JSON(data):
    return SignData(data["text"], tile_from_JSON(data["ground_tile"]))

