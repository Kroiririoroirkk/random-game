"""Defines the Entity class and register_entity."""
from typing import Any, Dict
import uuid

from config import BLOCK_WIDTH
from geometry import BoundingBox, Direction, Vec
from tilecoord import TileCoord


_entities: Dict[str, Any] = {}  # Maps entity_ids to Entity classes.


class Entity:
    """The Entity class encompasses things in the game that can move."""

    def __init__(self, pos, velocity, facing):
        """Initialize entity with randomly generated UUID."""
        self.pos = pos
        self.velocity = velocity
        self.facing = facing
        self.uuid = uuid.uuid4()

    def move(self, offset):
        """Move the entity by the given displacement vector."""
        self.pos += offset

    def update(self, dt):
        """Update the entity's position. Called every update loop."""
        self.move(self.velocity * dt)

    async def on_interact(self, game, ws, username, player):
        """Triggered whenever the player interacts with the entity."""

    async def on_dialogue_choose(self, game, ws, username, player, choice):
        """Triggered on dialoguechoose (see PROTOCOL.md for details)."""

    def set_x(self, new_x):
        """Set the entity's x position."""
        self.pos = Vec(new_x, self.pos.y)

    def set_y(self, new_y):
        """Set the entity's y position."""
        self.pos = Vec(self.pos.x, new_y)

    def get_bounding_box(self):
        """Get the entity's bounding box."""
        return self.get_bounding_box_of_width(BLOCK_WIDTH)

    def get_bounding_box_of_width(self, width):
        """Get a bounding box at the current position with a custom width."""
        block = Vec(width, width)
        return BoundingBox(self.pos, self.pos + block)

    def get_tiles_touched(self):
        """Get the tiles the entity is touching in the form of TileCoords."""
        bbox = self.get_bounding_box()
        start_tile_x, start_tile_y = TileCoord.pos_to_tile_coord(bbox.vec1)
        end_tile_x, end_tile_y = TileCoord.pos_to_tile_coord(bbox.vec2)
        return [TileCoord(tile_x, tile_y)
                for tile_y in range(start_tile_y, end_tile_y + 1)
                for tile_x in range(start_tile_x, end_tile_x + 1)]

    def is_touching(self, other):
        """Check if an entity is touching another entity."""
        return self.get_bounding_box().is_touching(other.get_bounding_box())

    def get_width(self):
        """Get width of the entity's bounding box."""
        return self.get_bounding_box().get_width()

    def get_height(self):
        """Get height of the entity's bounding box."""
        return self.get_bounding_box().get_height()

    @staticmethod
    def from_json(entity_dict):
        """Convert a dict representing a JSON object into an entity."""
        entity_class = Entity.get_entity_by_id(entity_dict["entity_id"])
        entity_pos = Vec(entity_dict["pos"]["x"], entity_dict["pos"]["y"])
        entity_velocity = Vec(entity_dict["velocity"]["x"],
                              entity_dict["velocity"]["y"])
        entity_facing = Direction.str_to_direction(entity_dict["facing"])
        ent = entity_class(entity_pos, entity_velocity, entity_facing)
        ent.uuid = uuid.UUID(entity_dict["uuid"])
        return ent

    def to_json(self, is_to_client):
        """Convert an entity to a dict which can be converted to a JSON string.

        Args:
            is_to_client: True to get the version of the entity sent
                to the client, False to get the version of the entity
                to save to file.
        """
        del is_to_client  # Unused
        return {
            "uuid": self.uuid.hex,
            "entity_id": self.get_entity_id(),
            "pos": {"x": self.pos.x, "y": self.pos.y},
            "velocity": {"x": self.velocity.x, "y": self.velocity.y},
            "facing": self.facing.direction_to_str()
        }

    @staticmethod
    def get_entity_by_id(entity_id):
        """Get the Entity class corresponding to an entity_id."""
        entity_class = _entities.get(entity_id)
        if not entity_class:
            raise ValueError
        return entity_class

    def get_entity_id(self):
        """Get the entity_id of an Entity."""
        entity_class = type(self)
        try:
            return next(
                entity_id for entity_id, cls in _entities.items()
                if cls == entity_class)
        except StopIteration:
            raise ValueError


def register_entity(entity_id):
    """Class decorator to register the entity_id with an Entity class."""
    def decorator(entity_class):
        if entity_id in _entities:
            raise ValueError
        _entities[entity_id] = entity_class
        return entity_class
    return decorator
