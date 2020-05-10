import asyncio
from enum import Enum
from signal import signal, SIGINT
from sys import exit
import time
import websockets

WSPORT = 8080

BLOCK_WIDTH = 16
PLAYER_SPEED = 48 #Pixels per second
MAX_MOVE_DT = 0.1

class Game:
  def __init__(self):
    self.player_objs = {}

  def get_player(self, username):
    return self.player_objs.get(username)

  def set_player(self, username, player):
    self.player_objs[username] = player

  def move_player(self, username, offset):
    p = self.get_player(username)
    p.move(offset)
    self.set_player(username, p)
    return p.pos

game = Game()

class Vec:
  def __init__(self, x, y):
    self.x = x
    self.y = y

  def relative_to(self, p):
    return Vec(self.x - p.x, self.y - p.y)

  def __add__(self, p):
    return Vec(self.x + p.x, self.y + p.y)

  def __mul__(self, scalar):
    return Vec(self.x * scalar, self.y * scalar)

def vec_from_dir(d):
  key = {
    "l": Vec(-1,0),
    "r": Vec(1,0),
    "u": Vec(0,-1),
    "d": Vec(0,1)
  }
  return key.get(d)

class Entity:
  def __init__(self, pos):
    self.pos = pos

  def move(self, offset):
    self.pos += offset

class Player(Entity):
  def __init__(self, pos, world_num):
    super().__init__(pos)
    self.time_since_last_move = 0
    self.world_num = world_num

class Grass(Entity):
  def __init__(self, pos):
    super().__init__(pos)

class WildGrass(Entity):
  def __init__(self, pos):
    super().__init__(pos)

STARTING_WORLD_TEXT = ("16|16|"
                "        gggggggggggggggg        |"
                "     gggggggggggggggggggggg     |"
                "   gggggggggggggggggggggggggg   |"
                "  gggggggggggggggggggggggggggg  |"
                "  gggggggggggggggggggggggggggg  |"
                " gggggggggggggggggggggggggggggg |"
                " gggggggggggggggggggggggggggggg |"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggGggggGgggggGGGGGGGggggggg|"
                "gggggggGggggGggggggggGgggggggggg|"
                "gggggggGggggGggggggggGgggggggggg|"
                "gggggggGGGGGGggggggggGgggggggggg|"
                "gggggggGggggGggggggggGgggggggggg|"
                "gggggggGggggGggggggggGgggggggggg|"
                "gggggggGggggGgggggGGGGGGGggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                "gggggggggggggggggggggggggggggggg|"
                " gggggggggggggggggggggggggggggg |"
                " gggggggggggggggggggggggggggggg |"
                "  gggggggggggggggggggggggggggg  |"
                "  gggggggggggggggggggggggggggg  |"
                "   gggggggggggggggggggggggggg   |"
                "     gggggggggggggggggggggg     |"
                "        gggggggggggggggg        ")

class World:
  def __init__(self, gameObjs, spawnPos):
    self.gameObjs = gameObjs
    self.spawnPos = spawnPos

def load_world(w):
  parts = w.split("|")
  spawnX = int(parts[0])
  spawnY = int(parts[1])
  origin = Vec(spawnX * BLOCK_WIDTH + BLOCK_WIDTH/2, spawnY * BLOCK_WIDTH + BLOCK_WIDTH/2)
  world_map = parts[2:]
  game_objs = []
  for j, line in enumerate(world_map):
    for i, char in enumerate(line):
      pos = Vec(i * BLOCK_WIDTH, j * BLOCK_WIDTH)
      pos = pos.relative_to(origin)
      if (char == "g"):
        game_objs.append(Grass(pos))
      elif (char == "G"):
        game_objs.append(WildGrass(pos))
  return World(game_objs, origin)

class Worlds(Enum):
  STARTING_WORLD_NUM = 1

def get_world(w):
  worlds = {
    Worlds.STARTING_WORLD_NUM: STARTING_WORLD_TEXT
  }
  return load_world(worlds.get(w))

async def send_world(ws, world_text):
  await ws.send("world|" + world_text)

async def send_moved_to(ws, pos):
  await ws.send(f"movedto|{pos.x}|{pos.y}") 

async def run(ws, path):
  username = await ws.recv()
  print("New user: " + username)
  game.set_player(username, Player(Vec(0,0), Worlds.STARTING_WORLD_NUM))
  await send_world(ws, STARTING_WORLD_TEXT)
  async for message in ws:
    await parseMessage(message, username, ws)

async def parseMessage(message, username, ws):
  if message.startswith("move|"):
    parts = message.split("|")
    direction = parts[1]
    dirVec = vec_from_dir(direction)
    if dirVec:
      player = game.get_player(username)
      now = time.time()
      dt = min(now - player.time_since_last_move, MAX_MOVE_DT)
      player.time_since_last_move = now
      move_dist = PLAYER_SPEED * dt
      offset = dirVec * move_dist
      newPos = game.move_player(username, offset)
      await send_moved_to(ws, newPos)

start_server = websockets.serve(run, "0.0.0.0", WSPORT)

def cleanup(sig, frame):
  print("Exiting...")
  exit(0)

signal(SIGINT, cleanup)

print("WebSocket server starting! Press CTRL-C to exit.")
loop = asyncio.get_event_loop()
loop.run_until_complete(start_server)
loop.run_forever()

