"""Defines block_movement to handle collisions between player and object."""
from geometry import Vec


def block_movement(bbox, player_start_pos, player):
    """Reposition player when the player the player hits a wall.

    Args:
        bbox: The BoundingBox of the wall.
        player_start_pos: The position of the player before the player
            moved and hit the wall.
        player: The player object.
    """
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
