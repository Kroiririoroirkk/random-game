"""Defines the TileCoord class."""
from collections import namedtuple

from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import Vec


class TileCoord(namedtuple("TileCoord", ["block_x", "block_y"])):
    """The TileCoord represents a position in the tile grid.

    It is a tuple of two whole numbers which are both nonnegative.
    """

    def to_spawn_pos(self):
        """Get the position in the tile in which the player spawns."""
        return Vec(self.block_x * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2,
                   self.block_y * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2)

    @staticmethod
    def pos_to_tile_coord(pos):
        """Return the TileCoord that a position Vec is in."""
        return int(pos.x) // BLOCK_WIDTH, int(pos.y) // BLOCK_WIDTH

    def to_pos(self):
        """Get the position of the upper-left corner of the tile."""
        return Vec(self.block_x * BLOCK_WIDTH, self.block_y * BLOCK_WIDTH)
