from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import BoundingBox, Dir, Vec
from world import TileXY, pos_to_tileXY

_entities = {}

def _register_entity(entity_id, entity_class):
  if entity_id in _entities:
    raise ValueError
  else:
    _entities[entity_id] = entity_class

def register_entity(entity_id):
  def decorator(entity_class):
    _register_entity(entity_id, entity_class)
    return entity_class
  return decorator

def get_entity_by_id(entity_id):
  entity_class = _entities.get(entity_id)
  if entity_class:
    return entity_class
  else:
    raise ValueError

def get_entity_id(e):
  entity_class = type(e)
  try:
    return next(eId for eId, cls in _entities.items() if cls == entity_class)
  except StopIteration:
    raise ValueError

class Entity:
  def __init__(self, pos):
    self.pos = pos

  def move(self, offset):
    self.pos += offset

  def update(self, dt):
    pass

  def setX(self, newX):
    self.pos = Vec(newX, self.pos.y)

  def setY(self, newY):
    self.pos = Vec(self.pos.x, newY)

  def get_bounding_box(self, width=BLOCK_WIDTH):
    block = Vec(width, width)
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

@register_entity("walker")
class Walker(Entity):
  def __init__(self, pos, speed):
    self.pos = pos
    self.speed = speed
    self.direction = Dir.RIGHT
    self.minX = pos.x - BLOCK_WIDTH*3
    self.maxX = pos.x + BLOCK_WIDTH*3

  def update(self, dt):
    if self.direction is Dir.RIGHT:
      if self.pos.x + self.speed <= self.maxX:
        self.setX(self.pos.x + self.speed)
      else:
        self.direction = Dir.LEFT
        self.setX(self.maxX - (self.speed - (self.maxX - self.pos.x)))
    elif self.direction is Dir.LEFT:
      if self.pos.x - self.speed >= self.minX:
        self.setX(self.pos.x - self.speed)
      else:
        self.direction = Dir.RIGHT
        self.setX(self.minX + (self.speed - (self.pos.x - self.minX)))

  def get_bounding_box(self):
    return super().get_bounding_box(PLAYER_WIDTH)

class Player(Entity):
  def __init__(self):
    super().__init__(None)
    self.time_of_last_move = 0
    self.world_id = None

  def get_bounding_box(self):
    return super().get_bounding_box(PLAYER_WIDTH)
