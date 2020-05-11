import asyncio
from enum import Enum
from signal import signal, SIGINT
from sys import exit
import time
import websockets

WSPORT = 8080

BLOCK_WIDTH = 16
PLAYER_SPEED = 48 #Pixels per second
SPEED_MULTIPLIER = 2
MAX_MOVE_DT = 0.1

class Game:
  def __init__(self):
    self.player_objs = {}

  def get_player(self, username):
    return self.player_objs.get(username)

  def set_player(self, username, player):
    self.player_objs[username] = player

game = Game()

class Vec:
  def __init__(self, x, y):
    self.x = x
    self.y = y

  def relative_to(self, p):
    return Vec(self.x - p.x, self.y - p.y)

  def __add__(self, p):
    return Vec(self.x + p.x, self.y + p.y)

  def __sub__(self, p):
    return Vec(self.x - p.x, self.y - p.y)

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

class BoundingBox:
  def __init__(self, v1, v2):
    self.v1 = v1
    self.v2 = v2

  def get_left(self):
    return self.v1.x

  def get_top(self):
    return self.v1.y

  def get_right(self):
    return self.v2.x

  def get_bottom(self):
    return self.v2.y

  def is_touching(self, bbox):
    return not (bbox.get_left()   > self.get_right() or
                bbox.get_right()  < self.get_left() or
                bbox.get_top()    > self.get_bottom() or
                bbox.get_bottom() < self.get_top())

class Entity:
  def __init__(self, pos):
    self.pos = pos

  def move(self, offset):
    self.pos += offset

  def get_bounding_box(self):
    halfBlock = Vec(BLOCK_WIDTH/2, BLOCK_WIDTH/2)
    return BoundingBox(self.pos - halfBlock, self.pos + halfBlock)

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

class Wall(Entity):
  def __init__(self, pos):
    super().__init__(pos)

STARTING_WORLD_TEXT = ("18|18|"
              "        wwwwwwwwwwwwwwwwwwww        |"
              "      wwwwwwwwwwwwwwwwwwwwwwww      |"
              "   wwwwwwggggggggggggggggggwwwwww   |"
              "  wwwwggggggggggggggggggggggggwwww  |"
              " wwwggggggggggggggggggggggggggggwww |"
              " wwggggggggggggggggggggggggggggggww |"
              "wwwggggggggggggggggggggggggggggggwww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwgggggggGggggGgggggGGGGGGGgggggggww|"
              "wwgggggggGggggGggggggggGggggggggggww|"
              "wwgggggggGggggGggggggggGggggggggggww|"
              "wwgggggggGGGGGGggggggggGggggggggggww|"
              "wwgggggggGggggGggggggggGggggggggggww|"
              "wwgggggggGggggGggggggggGggggggggggww|"
              "wwgggggggGggggGgggggGGGGGGGgggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwggggggggggggggggggggggggggggggggww|"
              "wwwggggggggggggggggggggggggggggggwww|"
              " wwggggggggggggggggggggggggggggggww |"
              " wwwggggggggggggggggggggggggggggwww |"
              "  wwwwggggggggggggggggggggggggwwww  |"
              "   wwwwwwggggggggggggggggggwwwwww   |"
              "      wwwwwwwwwwwwwwwwwwwwwwww      |"
              "        wwwwwwwwwwwwwwwwwwww        ")

class World:
  def __init__(self, game_objs, wall_objs, spawn_pos):
    self.game_objs = game_objs
    self.wall_objs = wall_objs
    self.spawn_pos = spawn_pos

def load_world(w):
  parts = w.split("|")
  spawnX = int(parts[0])
  spawnY = int(parts[1])
  origin = Vec(spawnX * BLOCK_WIDTH + BLOCK_WIDTH/2, spawnY * BLOCK_WIDTH + BLOCK_WIDTH/2)
  world_map = parts[2:]
  game_objs = []
  wall_objs = []
  for j, line in enumerate(world_map):
    for i, char in enumerate(line):
      pos = Vec(i * BLOCK_WIDTH, j * BLOCK_WIDTH)
      pos = pos.relative_to(origin)
      if (char == "g"):
        game_objs.append(Grass(pos))
      elif (char == "G"):
        game_objs.append(WildGrass(pos))
      elif (char == "w"):
        wall_objs.append(Wall(pos))
  return World(game_objs, wall_objs, origin)

class Worlds(Enum):
  STARTING_WORLD_NUM = 1

STARTING_WORLD = load_world(STARTING_WORLD_TEXT)
def get_world(w):
  worlds = {
    Worlds.STARTING_WORLD_NUM: STARTING_WORLD
  }
  return worlds.get(w)

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
  if message.startswith("move|") or message.startswith("fastmove|"):
    multiplier = 1
    if message.startswith("fastmove|"):
      multiplier = SPEED_MULTIPLIER
    parts = message.split("|")
    direction = parts[1]
    dirVec = sum([vec_from_dir(char) for char in direction], start=Vec(0,0))
    if dirVec:
      player = game.get_player(username)
      now = time.time()
      dt = min(now - player.time_since_last_move, MAX_MOVE_DT)
      player.time_since_last_move = now
      offset = dirVec * (PLAYER_SPEED * dt * multiplier)
      player.pos += offset
      canMove = True
      for wall_obj in get_world(player.world_num).wall_objs:
        if wall_obj.get_bounding_box().is_touching(player.get_bounding_box()):
          canMove = False
      if canMove:
        game.set_player(username, player)
      else:
        player.pos -= offset
      await send_moved_to(ws, player.pos)

start_server = websockets.serve(run, "0.0.0.0", WSPORT)

def cleanup(sig, frame):
  print("Exiting...")
  exit(0)

signal(SIGINT, cleanup)

print("WebSocket server starting! Press CTRL-C to exit.")
loop = asyncio.get_event_loop()
loop.run_until_complete(start_server)
loop.run_forever()

