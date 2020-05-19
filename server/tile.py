from world import worlds
from geometry import Vec
from tilebasic import Empty, Tile, TilePlus, TileMetadata, register_tile, register_tile_plus

def block_movement(tile_pos, player_start_pos, player):
  bbox = Tile.get_bounding_box(tile_pos)
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

  @staticmethod
  def fromJSON(data):
    return PortalData(data["w_id"], data["spawn_id"])

  def toJSON(self, is_to_client):
    return {"w_id": self.w_id, "spawn_id": self.spawn_id}

@register_tile_plus("portal", PortalData)
class Portal(TilePlus):
  async def on_move_on(self, game, ws, username, player, player_start_pos, tile_pos):
    w_id = self.data.w_id
    w = worlds.get(w_id)
    spawn_id = self.data.spawn_id
    await game.set_and_send_world(ws, username, player, w, spawn_id)
    await game.send_players(ws, username, w_id)

class SignData(TileMetadata):
  def __init__(self, text, ground_tile):
    super().__init__()
    self.text = text
    self.ground_tile = ground_tile
    self.send_to_client = ["ground_tile"]

  @staticmethod
  def fromJSON(data):
    return SignData(data["text"], Tile.fromJSON(data["ground_tile"]))

  def toJSON(self, is_to_client):
    return {"text": self.text, "ground_tile": self.ground_tile.toJSON(is_to_client)}

@register_tile_plus("sign", SignData)
class Sign(TilePlus):
  async def on_interact(self, game, ws, username, player, tile_pos):
    await game.send_sign(ws, self)
