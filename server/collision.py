"""Defines block_movement to handle collisions between entity and object."""
from geometry import Vec


def block_movement(bbox, entity_start_pos, entity):
    """Reposition entity when the entity hits a wall.

    Args:
        bbox: The BoundingBox of the wall.
        entity_start_pos: The position of the entity before the entity
            moved and hit the wall.
        entity: The entity object.
    """
    entity_end_pos = entity.pos
    entity.pos = entity_start_pos
    if entity.get_bounding_box().is_touching(bbox):
        entity.pos = entity_end_pos
    else:
        dp = entity_end_pos - entity_start_pos
        dx = dp.x
        dy = dp.y
        entity_width = entity.get_width()
        entity_height = entity.get_height()

        entity.move(Vec(dx, 0))
        if entity.get_bounding_box().is_touching(bbox):
            if dx > 0:
                entity.set_x(bbox.get_left_b() - entity_width - 1)
            elif dx < 0:
                entity.set_x(bbox.get_right_b() + 1)

        entity.move(Vec(0, dy))
        if entity.get_bounding_box().is_touching(bbox):
            if dy > 0:
                entity.set_y(bbox.get_top_b() - entity_height - 1)
            elif dy < 0:
                entity.set_y(bbox.get_bottom_b() + 1)
