"""Defines functions to save worlds to file."""
import json


def world_to_client_json(world, spawn_pos):
    """Convert a world to a JSON string to be sent to the client."""
    return json.dumps(world.to_json_client(spawn_pos),
                      separators=(",", ":"))


def world_to_save_json(world):
    """Convert a world to a JSON string to be saved to file."""
    return json.dumps(world.to_json_save(),
                      separators=(",", ":"))
