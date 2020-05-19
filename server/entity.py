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
    self.dialogue = ["Hi!", "This is dialogue.", f"And this is {'really '*42}long dialogue."]
    self.conversationPosition = {}

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

  async def on_interact(self, game, ws, username, player):
    if player in self.conversationPosition:
      try:
        self.conversationPosition[player] += 1
        await game.send_dialogue(ws, self.dialogue[self.conversationPosition[player]])
      except IndexError:
        del self.conversationPosition[player]
        await game.send_dialogue_end(ws)
    else:
      self.conversationPosition[player] = 0
      await game.send_dialogue(ws, self.dialogue[self.conversationPosition[player]])

  def get_bounding_box(self):
    return super().get_bounding_box(PLAYER_WIDTH)
