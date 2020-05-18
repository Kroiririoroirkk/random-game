import asyncio
from signal import signal, SIGINT
from sys import exit
import time
import websockets

from config import MAX_MOVE_DT, PLAYER_SPEED, SPEED_MULTIPLIER, WSPORT
import entity
import game
from geometry import Vec
import geometry
from tile import block_movement
from world import worlds, tileXY_to_pos
from loadworld import load_worlds

game = game.Game()

load_worlds()

async def run(ws, path):
  username = await ws.recv()
  p = game.get_player(username)
  if p:
    print("Returning user: " + username)
    await game.send_world(ws, worlds.get(p.world_id), p.pos)
  else:
    print("New user: " + username)
    new_player = entity.Player()
    game.set_player(username, new_player)
    await game.set_and_send_world(ws, username, new_player, worlds.get("starting_world"), "center_spawn")
  async for message in ws:
    await parseMessage(message, username, ws)

async def parseMessage(message, username, ws):
  player = game.get_player(username)
  world = worlds.get(player.world_id)
  if message.startswith("move|") or message.startswith("fastmove|"):
    multiplier = 1
    if message.startswith("fastmove|"):
      multiplier = SPEED_MULTIPLIER
    parts = message.split("|")
    direction = parts[1]
    dirVec = sum([geometry.vec_from_dir(char) for char in set(direction)], start=Vec(0,0))
    if dirVec:
      start_pos = player.pos
      start_tiles = player.get_tilesXY_touched()
      now = time.monotonic()
      dt = min(now - player.time_of_last_move, MAX_MOVE_DT)
      player.time_of_last_move = now
      offset = dirVec * (PLAYER_SPEED * dt * multiplier)
      player.pos += offset
      tilesXY_touching = player.get_tilesXY_touched()
      wall_tiles = [tileXY for tileXY in tilesXY_touching
        if world.get_tile(tileXY).blocks_movement]
      if wall_tiles:
        wall_tiles = [tileXY_to_pos(tileXY) for tileXY in wall_tiles]
        wall_tiles.sort(key = lambda tilePos:
          tilePos.dist_to(player.pos))
        for wall_tile in wall_tiles:
          block_movement(wall_tile, start_pos, player)
        tilesXY_touching = player.get_tilesXY_touched()
      tilesXY_moved_on = [tile for tile in tilesXY_touching
        if tile not in start_tiles]
      for tileXY in tilesXY_moved_on:
        await world.get_tile(tileXY).on_move_on(game, ws, username, player, start_pos, tileXY_to_pos(tileXY))
      game.set_player(username, player)
      await game.send_moved_to(ws, player.pos)
  elif message.startswith("interact"):
    for tileXY in player.get_tilesXY_touched():
      await world.get_tile(tileXY).on_interact(game, ws, username, player, tileXY_to_pos(tileXY))
  elif message.startswith("getplayers"):
    await game.send_players(ws, username, player.world_id)

async def update_loop():
  raise NotImplementedError

start_server = websockets.serve(run, "0.0.0.0", WSPORT)

def cleanup(sig, frame):
  print("Exiting...")
  exit(0)

signal(SIGINT, cleanup)

print("WebSocket server starting! Press CTRL-C to exit.")
loop = asyncio.get_event_loop()
loop.create_task(update_loop())
loop.run_until_complete(start_server)
loop.run_forever()

