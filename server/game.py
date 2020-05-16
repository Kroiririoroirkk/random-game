class Game:
  def __init__(self):
    self.player_objs = {}

  def get_player(self, username):
    return self.player_objs.get(username)

  def set_player(self, username, player):
    self.player_objs[username] = player

  async def set_and_send_world(self, ws, username, player, world, spawn_number):
    player.world_id = world.w_id
    player.pos = world.spawn_posits[spawn_number].get_spawn_pos()
    self.set_player(username, player)
    await self.send_world(ws, world.text, player.pos)

  async def send_world(self, ws, world_text, spawn_pos):
    await ws.send(f"world|{spawn_pos.x}|{spawn_pos.y}|{world_text}")

  async def send_moved_to(self, ws, pos):
    await ws.send(f"movedto|{pos.x}|{pos.y}") 

  async def send_sign(self, ws, sign):
    await ws.send(f"signtext|{sign.data.text}")

  async def send_players(self, ws, playerUsername, w_id):
    s = "|".join(f"{username}|{p.pos.x}|{p.pos.y}"
      for username, p in self.player_objs.items()
        if p.world_id == w_id and username != playerUsername)
    await ws.send("players|"+s)
