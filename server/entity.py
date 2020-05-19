from config import BLOCK_WIDTH
from entitybasic import Entity, Player, register_entity
from geometry import Dir, Vec, dir_to_str

@register_entity("walker")
class Walker(Entity):
  def __init__(self, pos, velocity, facing):
    super().__init__(pos, velocity, facing)
    self.speed = velocity.norm()
    self.velocity = Vec(self.speed, 0)
    self.minX = pos.x - BLOCK_WIDTH*3
    self.maxX = pos.x + BLOCK_WIDTH*3

  def update(self, dt):
    super().update(dt)
    if self.pos.x > self.maxX:
      self.facing = Dir.LEFT
      self.setX(self.maxX - (self.pos.x - self.maxX))
      self.velocity = Vec(-self.speed, 0)
    elif self.pos.x < self.minX:
      self.facing = Dir.RIGHT
      self.setX(self.minX + (self.minX - self.pos.x))
      self.velocity = Vec(self.speed, 0)

  def get_bounding_box(self):
    return super().get_bounding_box(PLAYER_WIDTH)