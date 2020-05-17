from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import BoundingBox, Vec
from world import TileXY, pos_to_tileXY

class Entity:
  def __init__(self, pos):
    self.pos = pos

  def move(self, offset):
    self.pos += offset

  def setX(self, newX):
    self.pos = Vec(newX, self.pos.y)

  def setY(self, newY):
    self.pos = Vec(self.pos.x, newY)

  def get_bounding_box(self):
    block = Vec(BLOCK_WIDTH, BLOCK_WIDTH)
    return BoundingBox(self.pos, self.pos + block)

  def get_tilesXY_touched(self):
    bbox = self.get_bounding_box()
    startTileX, startTileY = pos_to_tileXY(bbox.v1)
    endTileX, endTileY = pos_to_tileXY(bbox.v2)
    return [TileXY(tileX, tileY)
            for tileY in range(startTileY, endTileY + 1)
            for tileX in range(startTileX, endTileX + 1)]

  def is_touching(self, e):
    return self.get_bounding_box().is_touching(e.get_bounding_box())

  def get_width(self):
    return self.get_bounding_box().get_width()

  def get_height(self):
    return self.get_bounding_box().get_height()

class Player(Entity):
  def __init__(self):
    super().__init__(None)
    self.time_of_last_move = 0
    self.world_id = None

  def get_bounding_box(self):
    d = Vec(PLAYER_WIDTH, PLAYER_WIDTH)
    return BoundingBox(self.pos, self.pos + d)
