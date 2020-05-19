import math
import uuid

from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import BoundingBox, Dir, Vec, dir_to_str, str_to_dir, dir_to_angle
from world import TileXY, pos_to_tileXY

_entities = {}

class Entity:
  def __init__(self, pos, velocity, facing):
    self.pos = pos
    self.velocity = velocity
    self.facing = facing
    self.uuid = uuid.uuid4()

  def move(self, offset):
    self.pos += offset

  def update(self, dt):
    self.pos += self.velocity * dt

  def get_entities_can_interact(self, world):
    if self.facing is Dir.LEFT:
      return [e for e in world.entities
        if self.pos.dist_to(e.pos) < 2 * BLOCK_WIDTH
        and ((3*math.pi/4) < self.pos.angle_to(e.pos) < (math.pi)
        or (-math.pi) < self.pos.angle_to(e.pos) < (-3*math.pi/4))]
    else:
      facing_angle = dir_to_angle(self.facing)
      minAngle = facing_angle - math.pi/4
      maxAngle = facing_angle + math.pi/4
      return [e for e in world.entities
        if self.pos.dist_to(e.pos) < 2 * BLOCK_WIDTH
        and minAngle < self.pos.angle_to(e.pos) < maxAngle]

  async def on_interact(self, game, ws, username, player):
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

  @staticmethod
  def fromJSON(e):
    entity_class = Entity.get_entity_by_id(e["entity_id"])
    entity_pos = Vec(e["pos"]["x"], e["pos"]["y"])
    entity_velocity = Vec(e["velocity"]["x"], e["velocity"]["y"])
    entity_facing = str_to_dir(e["facing"])
    ent = entity_class(entity_pos, entity_velocity, entity_facing)
    ent.uuid = uuid.UUID(e["uuid"])
    return ent

  def toJSON(self, is_to_client):
    return {
      "uuid": self.uuid.hex,
      "entity_id": self.get_entity_id(),
      "pos": {"x": self.pos.x, "y": self.pos.y},
      "velocity": {"x": self.velocity.x, "y": self.velocity.y},
      "facing": dir_to_str(self.facing)
    }

  @staticmethod
  def get_entity_by_id(entity_id):
    entity_class = _entities.get(entity_id)
    if entity_class:
      return entity_class
    else:
      raise ValueError

  def get_entity_id(self):
    entity_class = type(self)
    try:
      return next(eId for eId, cls in _entities.items() if cls == entity_class)
    except StopIteration:
      raise ValueError

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

class Player(Entity):
  def __init__(self, pos, velocity, facing, ws, world_id):
    super().__init__(pos, velocity, facing)
    self.world_id = world_id
    self.ws = ws
    self.uuid = None
    self.time_of_last_move = 0

  def get_bounding_box(self):
    return super().get_bounding_box(PLAYER_WIDTH)
