"""The Walker class, which subclasses Entity."""
from config import BLOCK_WIDTH, PLAYER_WIDTH
from entitybasic import Entity, register_entity
from geometry import Direction, Vec


@register_entity("walker")
class Walker(Entity):
    """A basic Entity that walks and has dialogue.

    It walks three blocks to left and three blocks to the right.
    """

    def __init__(self, pos, velocity, facing):
        """Initialize the Walker with certain default properties.

        Set velocity rightward with the norm of the given velocity.
        Set dialogue.
        Set min_x and max_x to three blocks left and three blocks to the right.
        """
        super().__init__(pos, velocity, facing)
        self.speed = velocity.norm()
        self.velocity = Vec(self.speed, 0)
        self.min_x = pos.x - BLOCK_WIDTH*3
        self.max_x = pos.x + BLOCK_WIDTH*3
        self.dialogue = [
            "Hi!",
            "This is dialogue.",
            f"And this is {'really '*42}long dialogue.",
        ]
        self.conv_progress = {}

    def update(self, dt):
        """Move and turn if min_x or max_x reached."""
        super().update(dt)
        if self.pos.x > self.max_x:
            self.facing = Direction.LEFT
            self.set_x(self.max_x - (self.pos.x - self.max_x))
            self.velocity = Vec(-self.speed, 0)
        elif self.pos.x < self.min_x:
            self.facing = Direction.RIGHT
            self.set_x(self.min_x + (self.min_x - self.pos.x))
            self.velocity = Vec(self.speed, 0)

    async def on_interact(self, game, ws, username, player):
        """Send dialogue when player interacts with Walker."""
        self.velocity = Vec(0, 0)
        if player in self.conv_progress:
            try:
                self.conv_progress[player] += 1
                await game.send_dialogue(
                    ws, self.dialogue[self.conv_progress[player]])
            except IndexError:
                del self.conv_progress[player]
                await game.send_dialogue_end(ws)
                if self.facing is Direction.LEFT:
                    self.velocity = Vec(-self.speed, 0)
                elif self.facing is Direction.RIGHT:
                    self.velocity = Vec(self.speed, 0)
        else:
            self.conv_progress[player] = 0
            await game.send_dialogue(
                ws, self.dialogue[self.conv_progress[player]])

    def get_bounding_box(self):
        """Walker's bounding box is same as player's."""
        return super().get_bounding_box_of_width(PLAYER_WIDTH)
