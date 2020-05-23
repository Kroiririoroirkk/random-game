"""Defines the Player class."""
import math

from battle import Combatant
from config import BLOCK_WIDTH, PLAYER_WIDTH
from entitybasic import Entity
from geometry import Direction, Vec
from world import World


class Player(Entity, Combatant):
    """Represents an in-game player."""

    def __init__(self, username, pos, velocity, facing, ws, world_id):
        """Initialize player and delete UUID (players don't have UUIDs)."""
        Entity.__init__(self, pos, velocity, facing)
        Combatant.__init__(self)
        self.username = username
        self.world_id = world_id
        self.ws = ws
        self.online = True
        self.uuid = None
        self.talking_to = None
        self.time_of_last_move = 0

    def get_entities_can_interact(self, world):
        """Get the entities the player can interact with.

        Return all entities within 2 blocks Euclidean distance
        and within the viewing field between 45 degrees to the
        left of the player facing direction and 45 degrees to
        the right.
        """
        if self.facing is Direction.LEFT:
            return [
                e for e in world.entities
                if self.pos.dist_to(e.pos) < 2 * BLOCK_WIDTH
                and (
                    (3*math.pi/4) < self.pos.angle_to(e.pos) < (math.pi)
                    or (-math.pi) < self.pos.angle_to(e.pos) < (-3*math.pi/4))]
        facing_angle = self.facing.direction_to_angle()
        min_angle = facing_angle - math.pi/4
        max_angle = facing_angle + math.pi/4
        return [
            e for e in world.entities
            if self.pos.dist_to(e.pos) < 2 * BLOCK_WIDTH
            and min_angle < self.pos.angle_to(e.pos) < max_angle]

    def get_bounding_box(self):
        """Get bounding box the size of a player."""
        return super().get_bounding_box_of_width(PLAYER_WIDTH)

    def respawn(self):
        """Reset player's location and other properties."""
        world_id = "starting_world"
        spawn_id = "center_spawn"
        world = World.get_world_by_id(world_id)
        spawn_pos = world.spawn_points[spawn_id].to_spawn_pos()
        Player.__init__(
            self, self.username, spawn_pos, Vec(0, 0),
            Direction.DOWN, self.ws, world_id)
