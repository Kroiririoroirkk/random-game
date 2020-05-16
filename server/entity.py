import itertools

from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import BoundingBox, Vec
from world import pos_to_tileXY

class Entity:
  def __init__(self, pos):
    self.pos = pos

  def move(self, offset):
    self.pos += offset

  def get_bounding_box(self):
    block = Vec(BLOCK_WIDTH-1, BLOCK_WIDTH-1)
    return BoundingBox(self.pos, self.pos + block)

  def get_tilesXY_touched(self):
    bbox = self.get_bounding_box()
    startTileX, startTileY = pos_to_tileXY(bbox.v1)
    endTileX, endTileY = pos_to_tileXY(bbox.v2)
    return list(itertools.product(
      range(startTileX, endTileX+1),
      range(startTileY, endTileY+1)))

  def is_touching(self, e):
    return self.get_bounding_box().is_touching(e.get_bounding_box())

class Player(Entity):
  def __init__(self):
    super().__init__(None)
    self.time_of_last_move = 0
    self.world_id = None

  def get_bounding_box(self):
    return super().get_bounding_box().scale(PLAYER_WIDTH/BLOCK_WIDTH)

