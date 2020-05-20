"""Defines classes for various tiles."""
from geometry import Vec
from tilebasic import (
    Tile, TilePlus, TileMetadata,
    register_tile, register_tile_plus)
from world import World


def block_movement(tile_pos, player_start_pos, player):
    """Reposition player when the player the player hits a wall.

    Args:
        tile_pos: The position of the wall tile as a Vec.
        player_start_pos: The position of the player before the player
            moved and hit the wall.
        player: The player object.
    """
    bbox = Tile.get_bounding_box(tile_pos)
    player_end_pos = player.pos
    player.pos = player_start_pos
    if player.get_bounding_box().is_touching(bbox):
        player.pos = player_end_pos
    else:
        dp = player_end_pos - player_start_pos
        dx = dp.x
        dy = dp.y
        player_width = player.get_width()
        player_height = player.get_height()

        player.move(Vec(dx, 0))
        if player.get_bounding_box().is_touching(bbox):
            if dx > 0:
                player.set_x(bbox.get_left_b() - player_width - 1)
            elif dx < 0:
                player.set_x(bbox.get_right_b() + 1)

        player.move(Vec(0, dy))
        if player.get_bounding_box().is_touching(bbox):
            if dy > 0:
                player.set_y(bbox.get_top_b() - player_height - 1)
            elif dy < 0:
                player.set_y(bbox.get_bottom_b() + 1)


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

    def __init__(self, world_id, spawn_id):
        """Initialize with destination world_id and spawn_id."""
        super().__init__()
        self.world_id = world_id
        self.spawn_id = spawn_id

    @staticmethod
    def from_json(data):
        """Convert a dict representing a JSON object into a portal data."""
        return PortalData(data["world_id"], data["spawn_id"])

    def to_json(self, is_to_client):
        """Serialize to JSON."""
        return {"world_id": self.world_id, "spawn_id": self.spawn_id}


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
