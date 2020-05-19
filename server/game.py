import json

from storeworld import world_to_client_JSON
from world import tileXY_to_spawn_pos

class Game:
  def __init__(self):
    self.player_objs = {}

  def get_player(self, username):
    return self.player_objs.get(username)

  def set_player(self, username, player):
    self.player_objs[username] = player

  async def set_and_send_world(self, ws, username, player, world, spawn_id):
    player.world_id = world.w_id
    player.pos = tileXY_to_spawn_pos(world.spawn_points[spawn_id])
    self.set_player(username, player)
    await Game.send_world(ws, world, player.pos)

  @staticmethod
  async def send_world(ws, world, spawn_pos):
    await ws.send(f"world|{world_to_client_JSON(world, spawn_pos)}")

  @staticmethod
  async def send_moved_to(ws, pos):
    await ws.send(f"movedto|{pos.x}|{pos.y}") 

  @staticmethod
  async def send_sign(ws, sign):
    await ws.send(f"signtext|{sign.data.text}")

  async def send_players(self, ws, playerUsername, w_id):
    s = "|".join(f"{username}|{p.pos.x}|{p.pos.y}"
      for username, p in self.player_objs.items()
        if p.world_id == w_id and username != playerUsername)
    await ws.send("players|"+s)

  async def send_update_entity(self, uuid, json_dict):
    for player in self.player_objs.values():
      await player.ws.send(f"updateentity|{uuid.hex}|{json.dumps(json_dict, separators=(',', ':'))}")
