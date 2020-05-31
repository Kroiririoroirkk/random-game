"""Defines functions to load worlds from file."""
import json

from world import World


def load_world(world_id, world_dict):
    """Register a world given by world_dict with the given world_id."""
    World.register_world(world_id, World.from_json(world_dict))


def load_file(world_id):
    """Register the world with the given world_id from a JSON file."""
    with open(f"{world_id}.json") as file:
        load_world(world_id, json.load(file))


def load_worlds():
    """Register the required worlds."""
    load_file("starting_world")
    load_file("second_world")
    load_file("player_home")
    load_file("backyard")
