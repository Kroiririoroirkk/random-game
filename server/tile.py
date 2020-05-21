"""Defines classes for various tiles."""
from tilebasic import (
    Tile, TilePlus, TileMetadata,
    register_tile, register_tile_plus)
from world import World


@register_tile("grass")
class Grass(Tile):
    """Class for the grass tile."""


@register_tile("wild_grass")
class WildGrass(Tile):
    """Class for the wild grass tile."""


@register_tile("wall")
class Wall(Tile):
    """Class for the wall tile."""

    def __init__(self):
        """Initialize with the ability to block player movement."""
        super().__init__()
        self.blocks_movement = True


class PortalData(TileMetadata):
    """Stores information about the destination of a portal tile."""

    def __init__(self, world_id, spawn_id, ground_tile):
        """Initialize with destination world_id and spawn_id."""
        super().__init__()
        self.world_id = world_id
        self.spawn_id = spawn_id
        self.ground_tile = ground_tile
        self.send_to_client = ["ground_tile"]

    @staticmethod
    def from_json(data):
        """Convert a dict representing a JSON object into a portal data."""
        return PortalData(data["world_id"], data["spawn_id"],
                          Tile.from_json(data["ground_tile"]))

    def to_json(self, is_to_client):
        """Serialize to JSON."""
        return {
            "world_id": self.world_id,
            "spawn_id": self.spawn_id,
            "ground_tile": self.ground_tile.to_json(is_to_client)
        }


@register_tile_plus("portal", PortalData)
class Portal(TilePlus):
    """Class for the portal tile."""

    async def on_move_on(self, game, ws, username,
                         player, player_start_pos, tile_pos):
        """Teleport players that move into the portal."""
        world_id = self.data.world_id
        world = World.get_world_by_id(world_id)
        spawn_id = self.data.spawn_id
        player.world_id = world_id
        player.pos = world.spawn_points[spawn_id].to_spawn_pos()
        game.set_player(username, player)
        await game.send_world(ws, world, player.pos)
        await game.send_players(ws, username, world_id)


class SignData(TileMetadata):
    """Stores information about the text and ground tile of a sign tile."""

    def __init__(self, text, ground_tile):
        """Initialize and flag ground_tile as info sent to the client."""
        super().__init__()
        self.text = text
        self.ground_tile = ground_tile
        self.send_to_client = ["ground_tile"]

    @staticmethod
    def from_json(data):
        """Convert a dict representing a JSON object into sign data."""
        return SignData(data["text"], Tile.from_json(data["ground_tile"]))

    def to_json(self, is_to_client):
        """Serialize to JSON."""
        return {
            "text": self.text,
            "ground_tile": self.ground_tile.to_json(is_to_client)
        }


@register_tile_plus("sign", SignData)
class Sign(TilePlus):
    """Class for the sign tile."""

    async def on_interact(self, game, ws, username, player, tile_pos):
        """Send the sign's text when player interacts with sign."""
        await game.send_sign(ws, self)
