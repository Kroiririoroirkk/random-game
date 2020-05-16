class Tile:
  def __init__(self):
    self.blocks_movement = False

  async def on_move_on(self, game, ws, username, player, player_start_pos, tile_pos):
    pass

  async def on_interact(self, game, ws, username, player, tile_pos):
    pass

class Empty(Tile):
  pass

