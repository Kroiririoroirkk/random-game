"""The entry point for the server."""
import asyncio
from signal import signal, SIGINT
import sys
import time
import websockets

from config import (
    MAX_MOVE_DT, PLAYER_SPEED, SPEED_MULTIPLIER, UPDATE_DT, WSPORT)
import game
from geometry import Direction, Vec
from player import Player
from tile import block_movement
from world import World
from loadworld import load_worlds

import entity  # Just to register the entities declared in entity.py
import tile  # Just to register the tiles declared in tile.py
del entity
del tile


running_game = game.Game()


load_worlds()


async def run(ws, path):
    """Run the WebSocket server."""
    del path  # Unused
    username = await ws.recv()
    player = running_game.get_player(username)
    if player:
        print("Returning user: " + username)
        player.ws = ws
        world = World.get_world_by_id(player.world_id)
        await running_game.send_world(ws, world, player.pos)
    else:
        print("New user: " + username)
        world_id = "starting_world"
        spawn_id = "center_spawn"
        world = World.get_world_by_id(world_id)
        spawn_pos = world.spawn_points[spawn_id].to_spawn_pos()
        new_player = Player(spawn_pos, Vec(0, 0), Direction.DOWN, ws, world_id)
        running_game.set_player(username, new_player)
        await running_game.send_world(ws, world, spawn_pos)
    async for message in ws:
        await parseMessage(message, username, ws)


async def parseMessage(message, username, ws):
    """Handle a message from a client."""
    player = running_game.get_player(username)
    world = World.get_world_by_id(player.world_id)
    if message.startswith("move|") or message.startswith("fastmove|"):
        multiplier = 1
        if message.startswith("fastmove|"):
            multiplier = SPEED_MULTIPLIER
        parts = message.split("|")
        direction = parts[1]
        dir_vec = sum([
            Vec.vec_from_direction_str(char)
            for char in set(direction)], Vec(0, 0))
        if dir_vec:
            player.facing = Direction.str_to_direction(direction[-1])
            start_pos = player.pos
            start_tiles = player.get_tiles_touched()
            now = time.monotonic()
            dt = min(now - player.time_of_last_move, MAX_MOVE_DT)
            player.time_of_last_move = now
            offset = dir_vec * (PLAYER_SPEED * dt * multiplier)
            player.pos += offset
            tile_coords_touching = player.get_tiles_touched()
            wall_tiles = [
                tile_coord for tile_coord in tile_coords_touching
                if world.get_tile(tile_coord).blocks_movement]
            if wall_tiles:
                wall_tiles = [tile_coord.to_pos() for tile_coord in wall_tiles]
                wall_tiles.sort(
                    key=lambda tile_pos:
                    tile_pos.dist_to(player.pos))
                for wall_tile in wall_tiles:
                    block_movement(wall_tile, start_pos, player)
                tile_coords_touching = player.get_tiles_touched()
            tile_coords_moved_on = [
                tile_coord for tile_coord in tile_coords_touching
                if tile_coord not in start_tiles]
            for tile_coord in tile_coords_moved_on:
                tile = world.get_tile(tile_coord)
                await tile.on_move_on(running_game, ws, username,
                                      player, start_pos, tile_coord.to_pos())
            running_game.set_player(username, player)
            await running_game.send_moved_to(ws, player.pos)
    elif message.startswith("interact"):
        for tile_coord in player.get_tiles_touched():
            tile = world.get_tile(tile_coord)
            await tile.on_interact(running_game, ws, username,
                                   player, tile_coord.to_pos())
        for entity in player.get_entities_can_interact(world):
            await entity.on_interact(running_game, ws, username, player)
    elif message.startswith("getupdates"):
        await running_game.send_players(ws, username, player.world_id)
        await running_game.send_entities(ws, player.world_id)


async def update_loop():
    """Update entities in player-inhabited worlds in an infinite loop."""
    then = time.monotonic()
    while True:
        now = time.monotonic()
        dt = now - then
        then = now
        for world_id in set(
                p.world_id for p in running_game.player_objs.values()):
            world = World.get_world_by_id(world_id)
            for entity in world.entities:
                entity.update(dt)
        await asyncio.sleep(UPDATE_DT)

start_server = websockets.serve(run, "0.0.0.0", WSPORT)


def cleanup(sig, frame):
    """Handle a SIG_INTERRUPT, i.e. when Ctrl+C is pressed."""
    del sig, frame  # Unused
    print("Exiting...")
    sys.exit(0)


signal(SIGINT, cleanup)


print("WebSocket server starting! Press CTRL-C to exit.")
loop = asyncio.get_event_loop()
loop.create_task(update_loop())
loop.run_until_complete(start_server)
loop.run_forever()
