"""Defines the World class."""
from typing import Dict

from battle import PlayerAIBattle
from entitybasic import Entity
from tilebasic import Empty, Tile
from tilecoord import TileCoord
from util import Util


_worlds: Dict[str, "World"] = {}


class World:
    """The World class represents an area where the player can explore.

    Different Worlds are linked together through portals.
    """

    def __init__(self, tiles, entities, spawn_points):
        """Initialize the World with its contents."""
        self.tiles = tiles
        self.entities = entities
        self.spawn_points = spawn_points
        self.battles = []

    def get_tile(self, tile_coord):
        """Get the tile positioned at the given TileCoord."""
        try:
            return self.tiles[tile_coord.block_y][tile_coord.block_x]
        except IndexError:
            return Empty()

    def get_entity(self, uuid):
        """Get the entity with the given UUID."""
        try:
            return next(
                entity for entity in self.entities
                if entity.uuid == uuid)
        except StopIteration:
            raise ValueError

    @staticmethod
    def from_json(world_dict):
        """Convert a dict representing a JSON object into a world."""
        if world_dict["version"] != "0.1.0":
            raise ValueError
        tiles = []
        for row in world_dict["tiles"]:
            row_tiles = []
            for tile in row:
                row_tiles.append(Tile.from_json(tile))
            tiles.append(row_tiles)

        entities = [
            Entity.from_json(entity) for entity in world_dict["entities"]]

        spawn_points = {
            spawn_id: TileCoord(
                spawn_tile_coord["block_x"],
                spawn_tile_coord["block_y"])
            for spawn_id, spawn_tile_coord
            in world_dict["spawn_points"].items()}

        return World(tiles, entities, spawn_points)

    def to_json_client(self, spawn_pos):
        """Convert a world to a dict which can be converted to a JSON string.

        This method is for data that will be sent to the client.
        """
        tiles_list = []
        for row in self.tiles:
            row_tiles = []
            for tile in row:
                row_tiles.append(tile.to_json(True))
            tiles_list.append(row_tiles)

        entity_list = [entity.to_json(True) for entity in self.entities]

        return {
            "version": "0.1.0",
            "tiles": tiles_list,
            "entities": entity_list,
            "spawn_pos": {
                "x": spawn_pos.x,
                "y": spawn_pos.y
            }
        }

    def to_json_save(self):
        """Convert a world to a dict which can be converted to a JSON string.

        This method is for data that will be saved to file.
        """
        tiles_list = []
        for row in self.tiles:
            row_tiles = []
            for tile in row:
                row_tiles.append(tile.to_json(False))
            tiles_list.append(row_tiles)

        entity_list = [entity.to_json(False) for entity in self.entities]

        return {
            "version": "0.1.0",
            "tiles": tiles_list,
            "entities": entity_list,
            "spawn_points": {
                spawn_id: {"block_x": spawn_point.block_x,
                           "block_y": spawn_point.block_y}
                for spawn_id, spawn_point in self.spawn_points.items()}
        }

    @staticmethod
    def get_world_by_id(world_id):
        """Get the World corresponding to a world_id."""
        world = _worlds.get(world_id)
        if not world:
            raise ValueError
        return world

    def get_world_id(self):
        """Get the world_id of a World."""
        try:
            return next(
                world_id for world_id, world in _worlds.items()
                if world == self)
        except StopIteration:
            raise ValueError

    @staticmethod
    def register_world(world_id, world):
        """Register a World with the given world_id."""
        if world_id in _worlds:
            raise ValueError
        _worlds[world_id] = world

    def player_in_battle(self, username):
        """Check if a player is in a battle."""
        for battle in self.battles:
            if battle.player_combatant.username == username:
                return True
        return False

    def get_battle_by_username(self, username):
        """Get the battle that the player with the given username is in."""
        for battle in self.battles:
            if battle.player_combatant.username == username:
                return battle

    def del_battle_by_username(self, username):
        """Delete the battle that the player with the given username is in."""
        self.battles = [b for b in self.battles
                        if b.player_combatant.username != username]

    async def create_battle(self, username, ws, player, ai):
        """Create a battle with the given player and AI."""
        if self.player_in_battle(username):
            raise ValueError
        battle = PlayerAIBattle(player, ai)
        self.battles.append(battle)
        await Util.send_battle_start(ws)
        await Util.send_battle_status(
            ws, player.hp, ai.hp)
        await Util.send_move_request(ws, player.moves)
