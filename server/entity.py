from config import BLOCK_WIDTH
from entitybasic import Entity, Player, register_entity
from geometry import Dir, Vec, dir_to_str

@register_entity("walker")
class Walker(Entity):
  def __init__(self, pos, velocity, facing):
    super().__init__(pos, velocity, facing)
    self.speed = velocity.norm()
    self.minX = pos.x - BLOCK_WIDTH*3
    self.maxX = pos.x + BLOCK_WIDTH*3

  async def update(self, game, dt):
    if self.facing is Dir.RIGHT:
      if self.pos.x + self.speed <= self.maxX:
        self.setX(self.pos.x + self.speed)
      else:
        self.facing = Dir.LEFT
        self.setX(self.maxX - (self.speed - (self.maxX - self.pos.x)))
    elif self.facing is Dir.LEFT:
      if self.pos.x - self.speed >= self.minX:
        self.setX(self.pos.x - self.speed)
      else:
        self.facing = Dir.RIGHT
        self.setX(self.minX + (self.speed - (self.pos.x - self.minX)))
    await game.send_update_entity(self.uuid, {
      "pos": {"x": self.pos.x},
      "facing": dir_to_str(self.facing)
    })

  def get_bounding_box(self):
    return super().get_bounding_box(PLAYER_WIDTH)