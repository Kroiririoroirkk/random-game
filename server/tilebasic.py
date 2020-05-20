"""Defines the Tile, TilePlus, TileMetadata, and Empty classes."""
from typing import Any, Dict

from config import BLOCK_WIDTH
from geometry import BoundingBox, Vec


_tiles: Dict[str, Any] = {}  # Maps tile_ids to Tile classes.


class Tile:
    """The Tile class encompasses things in the game that are grid-locked."""

    def __init__(self):
        """Initialize the Tile.

        Tiles by default do not block movement and have no metadata.
        """
        self.blocks_movement = False
        self.data = None

    async def on_move_on(self, game, ws, username,
                         player, player_start_pos, tile_pos):
        """Triggered whenever the player moves onto the tile."""

    async def on_interact(self, game, ws, username, player, tile_pos):
        """Triggered whenever the player interacts while touching the tile."""

    @staticmethod
    def get_bounding_box(tile_pos):
        """Get the BoundingBox for the tile, given its position."""
        block = Vec(BLOCK_WIDTH, BLOCK_WIDTH)
        return BoundingBox(tile_pos, tile_pos + block)

    @staticmethod
    def from_json(tile_dict):
        """Convert a dict representing a JSON object into a tile."""
        tile_class = Tile.get_tile_by_id(tile_dict["tile_id"])
        if issubclass(tile_class, TilePlus):
            return tile_class(
                tile_class.data_class.from_json(tile_dict["tile_data"]))
        return tile_class()

    def to_json(self, is_to_client):
        """Convert a tile to a dict which can be converted to a JSON string.

        Args:
            is_to_client: True to get the version of the tile sent
                to the client, False to get the version of the tile
                to save to file.
        """
        del is_to_client  # Unused
        return {"tile_id": self.get_tile_id()}

    @staticmethod
    def get_tile_by_id(tile_id):
        """Get the Tile class corresponding to a tile_id."""
        tile_class = _tiles.get(tile_id)
        if not tile_class:
            raise ValueError
        return tile_class

    def get_tile_id(self):
        """Get the tile_id of a Tile."""
        tile_class = type(self)
        try:
            return next(
                tile_id for tile_id, cls in _tiles.items()
                if cls == tile_class)
        except StopIteration:
            raise ValueError


class TilePlus(Tile):
    """The TilePlus class encompasses Tiles that have additional data."""

    def __init__(self, data):
        """Initialize the Tile with the given TileMetadata."""
        super().__init__()
        self.data = data

    def to_json(self, is_to_client):
        """Convert a tile to a dict which can be converted to a JSON string.

        Args:
            is_to_client: True to get the version of the tile sent
                to the client, False to get the version of the tile
                to save to file.
        """
        if is_to_client:
            tile_data = {
                k: v for k, v in self.data.to_json(True).items()
                if k in self.data.send_to_client}
        else:
            tile_data = self.data.to_json(False)
        return {"tile_id": self.get_tile_id(), "tile_data": tile_data}


class TileMetadata:
    """The TileMetadata class represents additional data some Tiles need."""

    def __init__(self):
        """Initialize: By default, no tile metadata is sent to the client."""
        self.send_to_client = []

    @staticmethod
    def from_json(data):
        """Convert a dict representing a JSON object into tile metadata."""

    def to_json(self, is_to_client):
        """Convert metadata to a dict which can be converted to a JSON string.

        Args:
            is_to_client: True to get the version of the metadata sent
                to the client, False to get the version of the metadata
                to save to file.
        """


def _register_tile(tile_id, tile_class):
    if tile_id in _tiles:
        raise ValueError
    _tiles[tile_id] = tile_class


def register_tile(tile_id):
    """Class decorator to register the tile_id with a Tile class."""
    def decorator(tile_class):
        _register_tile(tile_id, tile_class)
        return tile_class
    return decorator


def register_tile_plus(tile_id, data_class):
    """Class decorator to register a TilePlus.

    The decorator registers the tile_id with a TilePlus class
    and a TileMetadata class.
    """
    def decorator(tile_class):
        _register_tile(tile_id, tile_class)
        tile_class.data_class = data_class
        return tile_class
    return decorator


@register_tile("empty")
class Empty(Tile):
    """Class for the empty tile."""
