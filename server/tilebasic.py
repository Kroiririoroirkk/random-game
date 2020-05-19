from config import BLOCK_WIDTH
from geometry import BoundingBox, Vec

_tiles = {}

class Tile:
  def __init__(self):
    self.blocks_movement = False

  async def on_move_on(self, game, ws, username, player, player_start_pos, tile_pos):
    pass

  async def on_interact(self, game, ws, username, player, tile_pos):
    pass

  @staticmethod
  def get_bounding_box(tile_pos):
    block = Vec(BLOCK_WIDTH, BLOCK_WIDTH)
    return BoundingBox(tile_pos, tile_pos + block)

  @staticmethod
  def fromJSON(t):
    tile_class = Tile.get_tile_by_id(t["tile_id"])
    try:
      if issubclass(tile_class, TilePlus):
        tile = tile_class(tile_class.data_class.fromJSON(t["tile_data"]))
      else:
        tile = tile_class()
    except KeyError:
      tile = tile_class()
    return tile

  def toJSON(self, is_to_client):
    if isinstance(self, TilePlus):
      if is_to_client:
        td = {k: v for k, v in self.data.toJSON(True).items() if k in self.data.send_to_client}
      else:
        td = self.data.toJSON(False)
      return {"tile_id": self.get_tile_id(), "tile_data": td}
    else:
      return {"tile_id": self.get_tile_id()}

  @staticmethod
  def get_tile_by_id(tile_id):
    tile_class = _tiles.get(tile_id)
    if tile_class:
      return tile_class
    else:
      raise ValueError

  def get_tile_id(self):
    tile_class = type(self)
    try:
      return next(tId for tId, cls in _tiles.items() if cls == tile_class)
    except StopIteration:
      raise ValueError

class TilePlus(Tile):
  def __init__(self, data):
    super().__init__()
    self.data = data

class TileMetadata:
  def __init__(self):
    self.send_to_client = []

  @staticmethod
  def fromJSON(data):
    raise NotImplementedError

  def toJSON(self, is_to_client):
    raise NotImplementedError

def _register_tile(tile_id, tile_class):
  if tile_id in _tiles:
    raise ValueError
  else:
    _tiles[tile_id] = tile_class

def register_tile(tile_id):
  def decorator(tile_class):
    _register_tile(tile_id, tile_class)
    return tile_class
  return decorator

def register_tile_plus(tile_id, data_class):
  def decorator(tile_class):
    _register_tile(tile_id, tile_class)
    tile_class.data_class = data_class
    return tile_class
  return decorator

@register_tile("empty")
class Empty(Tile):
  pass
