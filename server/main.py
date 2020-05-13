import asyncio
from signal import signal, SIGINT
from sys import exit
import time
import websockets

from config import MAX_MOVE_DT, PLAYER_SPEED, PORTAL_RECOVER_TIME, SPEED_MULTIPLIER, WSPORT
import entity
import game
from geometry import LineSegment, Vec
import geometry
from world import worlds

game = game.Game()

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
  game.set_player(username, entity.Player())
  await set_and_send_world(ws, username, worlds.get("starting_world"), 0)
  async for message in ws:
    await parseMessage(message, username, ws)

async def parseMessage(message, username, ws):
  if message.startswith("move|") or message.startswith("fastmove|"):
    multiplier = 1
    if message.startswith("fastmove|"):
      multiplier = SPEED_MULTIPLIER
    parts = message.split("|")
    direction = parts[1]
    dirVec = sum([geometry.vec_from_dir(char) for char in direction], start=Vec(0,0))
    if dirVec:
      player = game.get_player(username)
      now = time.monotonic()
      dt = min(now - player.time_of_last_move, MAX_MOVE_DT)
      player.time_of_last_move = now
      offset = dirVec * (PLAYER_SPEED * dt * multiplier)
      startingPos = player.pos
      player.pos += offset
      world = worlds.get(player.world_id)
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
          w = worlds.get(portal_obj.dest.w_id)
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

