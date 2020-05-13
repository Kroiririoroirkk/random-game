import asyncio
from enum import Enum
import math
from signal import signal, SIGINT
from sys import exit
import time
import websockets

WSPORT = 8080

BLOCK_WIDTH = 16
PLAYER_SPEED = 48 #Pixels per second
SPEED_MULTIPLIER = 2
MAX_MOVE_DT = 0.1
PORTAL_RECOVER_TIME = 1

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

  def dist_to(self, p):
    return math.dist((self.x, self.y), (p.x, p.y))

  def blocks_to_px(self):
    return self * BLOCK_WIDTH

def vec_from_dir(d):
  key = {
    "l": Vec(-1,0),
    "r": Vec(1,0),
    "u": Vec(0,-1),
    "d": Vec(0,1)
  }
  return key.get(d)

class Dir(Enum):
  LEFT = 0
  UP = 1
  RIGHT = 2
  DOWN = 3

class LineSegment:
  def __init__(self, start, end):
    self.start = start
    self.end = end

  def dx(self):
    return self.end.x - self.start.x

  def dy(self):
    return self.end.y - self.start.y

  def slope(self):
    return self.dy()/self.dx()

  def intercept(self):
    return self.start.y - self.slope()*self.start.x

  def is_intersecting(self, other):
    def is_between(x, a, b):
      return (a <= x <= b) or (b <= x <= a)
    if self.start.x == self.end.x:
      if other.start.x == other.end.x:
        return self.start.x == other.start.x
      m = other.slope()
      b = other.intercept()
      intersect_y = m*self.start.x+b
      return (is_between(intersect_y, self.start.y, self.end.y)
        and is_between(intersect_y, other.end.y, other.start.y))
    if other.start.x == other.end.x:
      m = self.slope()
      b = self.intercept()
      intersect_y = m*other.start.x+b
      return (is_between(intersect_y, self.start.y, self.end.y)
        and is_between(intersect_y, other.start.y, other.end.y))
    m1 = self.slope()
    b1 = self.intercept()
    m2 = other.slope()
    b2 = other.intercept()
    if m1 == m2:
      return b1 == b2
    intersect_x = (b2-b1)/(m1-m2)
    return (is_between(intersect_x, self.start.x, self.end.x)
      and is_between(intersect_x, other.start.x, other.end.x))

  def shift(self, v):
    return LineSegment(self.start + v, self.end + v)

class BoundingBox:
  def __init__(self, v1, v2):
    self.v1 = v1
    self.v2 = v2

  def get_bound(self, direction):
    directions = {
      Dir.LEFT: self.v1.x,
      Dir.UP: self.v1.y,
      Dir.RIGHT: self.v2.x,
      Dir.DOWN: self.v2.y
    }
    return directions.get(direction)

  def get_left_b(self):
    return self.get_bound(Dir.LEFT)
  
  def get_left_side(self):
    return LineSegment(
             Vec(self.get_left_b(), self.get_top_b()),
             Vec(self.get_left_b(), self.get_bottom_b()))

  def get_top_b(self):
    return self.get_bound(Dir.UP)

  def get_top_side(self):
    return LineSegment(
             Vec(self.get_left_b(), self.get_top_b()),
             Vec(self.get_right_b(), self.get_top_b()))

  def get_right_b(self):
    return self.get_bound(Dir.RIGHT)

  def get_right_side(self):
    return LineSegment(
             Vec(self.get_right_b(), self.get_top_b()),
             Vec(self.get_right_b(), self.get_bottom_b()))

  def get_bottom_b(self):
    return self.get_bound(Dir.DOWN)

  def get_bottom_side(self):
    return LineSegment(
             Vec(self.get_left_b(), self.get_bottom_b()),
             Vec(self.get_right_b(), self.get_bottom_b()))

  def get_width(self):
    return self.v2.x - self.v1.x

  def get_height(self):
    return self.v2.y - self.v1.y

  def is_touching(self, bbox):
    return not (bbox.get_left_b()   > self.get_right_b() or
                bbox.get_right_b()  < self.get_left_b() or
                bbox.get_top_b()    > self.get_bottom_b() or
                bbox.get_bottom_b() < self.get_top_b())

  def get_center(self):
    return (self.v1 + self.v2)*0.5

  def scale(self, k):
    c = self.get_center()
    return BoundingBox(
      Vec(c.x - k*self.get_width()/2, c.y - k*self.get_height()/2),
      Vec(c.x + k*self.get_width()/2, c.y + k*self.get_width()/2))

class Entity:
  def __init__(self, pos):
    self.pos = pos

  def move(self, offset):
    self.pos += offset

  def get_bounding_box(self):
    halfBlock = Vec(BLOCK_WIDTH/2, BLOCK_WIDTH/2)
    return BoundingBox(self.pos - halfBlock, self.pos + halfBlock)

  def is_touching(self, e):
    return self.get_bounding_box().is_touching(e.get_bounding_box())

class Player(Entity):
  def __init__(self):
    super().__init__(None)
    self.time_of_last_move = 0
    self.world_id = None
    self.time_of_last_portal = 0

  def get_bounding_box(self):
    return super().get_bounding_box().scale(7/8)

class Grass(Entity):
  def __init__(self, pos):
    super().__init__(pos)

class WildGrass(Entity):
  def __init__(self, pos):
    super().__init__(pos)

class Wall(Entity):
  def __init__(self, pos):
    super().__init__(pos)

  def block_movement(self, player, path):
    bbox = self.get_bounding_box()
    p_bbox = player.get_bounding_box()
    d = p_bbox.get_width()/2
    offset = d+1
    path_ne = path.shift(Vec(d,-d))
    path_nw = path.shift(Vec(-d,-d))
    path_se = path.shift(Vec(d,d))
    path_sw = path.shift(Vec(-d,d))
    if ((path_ne.is_intersecting(bbox.get_left_side())
        or path_se.is_intersecting(bbox.get_left_side()))
        and path_ne.start.x <= bbox.get_left_b()):
      player.pos.x = bbox.get_left_b() - offset
    if ((path_sw.is_intersecting(bbox.get_top_side())
        or path_se.is_intersecting(bbox.get_top_side()))
        and path_sw.start.y <= bbox.get_top_b()):
      player.pos.y = bbox.get_top_b() - offset
    if ((path_nw.is_intersecting(bbox.get_right_side())
        or path_sw.is_intersecting(bbox.get_right_side()))
        and path_nw.start.x >= bbox.get_right_b()):
      player.pos.x = bbox.get_right_b() + offset
    if ((path_nw.is_intersecting(bbox.get_bottom_side())
        or path_ne.is_intersecting(bbox.get_bottom_side()))
        and path_nw.start.y >= bbox.get_bottom_b()):
      player.pos.y = bbox.get_bottom_b() + offset

class PortalDest:
  def __init__(self, w_id, spawn_num):
    self.w_id = w_id
    self.spawn_num = spawn_num

class Portal(Entity):
  def __init__(self, pos, dest):
    super().__init__(pos)
    self.dest = dest

class World:
  def __init__(self, w_id, text, game_objs, wall_objs, portal_objs, spawn_posits):
    self.w_id = w_id
    self.text = text
    self.game_objs = game_objs
    self.wall_objs = wall_objs
    self.portal_objs = portal_objs
    self.spawn_posits = spawn_posits

class WorldData:
  def __init__(self, w_id, text, spawn_posits, linked_dests):
    self.w_id = w_id
    self.text = text
    self.spawn_posits = spawn_posits
    self.linked_dests = linked_dests

worlds = {}

def load_world(w):
  world_map = w.text.split("|")
  game_objs = []
  wall_objs = []
  portal_objs = []
  linked_dests = w.linked_dests
  for j, line in enumerate(world_map):
    for i, char in enumerate(line):
      pos = Vec(i * BLOCK_WIDTH, j * BLOCK_WIDTH)
      if char == "g":
        game_objs.append(Grass(pos))
      elif char == "G":
        game_objs.append(WildGrass(pos))
      elif char == "w":
        wall_objs.append(Wall(pos))
      elif char == "p":
        portal_objs.append(Portal(pos, linked_dests.pop(0)))
  world_obj = World(w.w_id, w.text, game_objs, wall_objs, portal_objs, w.spawn_posits)
  worlds[w.w_id] = world_obj
  return world_obj

STARTING_WORLD_DATA = WorldData("starting_world",
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
  "      wwwwwwwwwwwwpwwwwwwwwwww      |"
  "        wwwwwwwwwwwwwwwwwwww        ",
  [Vec(18,18).blocks_to_px(),
   Vec(18,34).blocks_to_px()],
  [PortalDest("second_world", 0)])
SECOND_WORLD_DATA = WorldData("second_world",
  "wwww|"
  "wgpw|"
  "wGgw|"
  "wwww",
  [Vec(2,1).blocks_to_px()],
  [PortalDest("starting_world", 1)])

STARTING_WORLD = load_world(STARTING_WORLD_DATA)
SECOND_WORLD = load_world(SECOND_WORLD_DATA)

def get_world(w):
  return worlds.get(w)

async def set_and_send_world(ws, username, world, spawn_number):
  p = game.get_player(username)
  p.world_id = world.w_id
  p.pos = world.spawn_posits[spawn_number]
  game.set_player(username, p)
  await send_world(ws, world.text, world.spawn_posits[spawn_number])

async def send_world(ws, world_text, spawn_pos):
  await ws.send(f"world|{spawn_pos.x}|{spawn_pos.y}|{world_text}")

async def send_moved_to(ws, pos):
  await ws.send(f"movedto|{pos.x}|{pos.y}") 

async def run(ws, path):
  username = await ws.recv()
  print("New user: " + username)
  game.set_player(username, Player())
  await set_and_send_world(ws, username, STARTING_WORLD, 0)
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
      now = time.monotonic()
      dt = min(now - player.time_of_last_move, MAX_MOVE_DT)
      player.time_of_last_move = now
      offset = dirVec * (PLAYER_SPEED * dt * multiplier)
      startingPos = player.pos
      player.pos += offset
      world = get_world(player.world_id)
      bumped_wall_objs = [
        wall_obj for wall_obj in world.wall_objs
        if wall_obj.is_touching(player)]
      bumped_wall_objs.sort(key = lambda wall_obj:
        wall_obj.pos.dist_to(player.pos))
      for wall_obj in bumped_wall_objs:
        wall_obj.block_movement(player,
          LineSegment(startingPos, player.pos))
      for portal_obj in world.portal_objs:
        if (portal_obj.is_touching(player)
            and now - player.time_of_last_portal > PORTAL_RECOVER_TIME):
          player.time_of_last_portal = now
          w = get_world(portal_obj.dest.w_id)
          spawn_num = portal_obj.dest.spawn_num
          await set_and_send_world(ws, username, w, spawn_num)
          break
      game.set_player(username, player)
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

