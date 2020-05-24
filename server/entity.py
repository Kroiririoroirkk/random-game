"""The Walker class, which subclasses Entity."""
from config import BLOCK_WIDTH, PLAYER_WIDTH
from entitybasic import Entity, register_entity
from geometry import Direction, Vec
from util import Util


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

    async def on_interact(self, event_ctx):
        """Send dialogue when player interacts with Walker."""
        self.velocity = Vec(0, 0)
        if event_ctx.username in self.conv_progress:
            self.conv_progress[event_ctx.username] += 1
            try:
                await Util.send_dialogue(
                    event_ctx.ws, self.uuid,
                    self.dialogue[self.conv_progress[event_ctx.username]])
                event_ctx.player.talking_to = self
            except IndexError:
                del self.conv_progress[event_ctx.username]
                await Util.send_dialogue_end(event_ctx.ws, self.uuid)
                event_ctx.player.talking_to = None
                if not self.conv_progress:
                    if self.facing is Direction.LEFT:
                        self.velocity = Vec(-self.speed, 0)
                    elif self.facing is Direction.RIGHT:
                        self.velocity = Vec(self.speed, 0)
        else:
            self.conv_progress[event_ctx.username] = 0
            await Util.send_dialogue(
                event_ctx.ws, self.uuid,
                self.dialogue[self.conv_progress[event_ctx.username]])
            event_ctx.player.talking_to = self

    def get_bounding_box(self):
        """Walker's bounding box is same as player's."""
        return super().get_bounding_box_of_width(PLAYER_WIDTH)


@register_entity("stander")
class Stander(Entity):
    """A basic Entity that has dialogue and player interaction.

    It asks a question, lets the player respond yes or no, and then
    gives an answer based on the player's response.
    """

    def __init__(self, pos, velocity, facing):
        """Initialize the Stander with certain default properties.

        Set velocity to 0.
        Set dialogue.
        """
        super().__init__(pos, velocity, facing)
        self.velocity = Vec(0, 0)
        self.dialogue = [
            "Don't get so close, scum! Do you know who my father is?",
            ["Yes", "No"],
            {0: "That makes one of us...", 1: "Me neither..."},
        ]
        self.conv_progress = {}

    async def send_line(self, ws, line):
        """Send a line of dialogue, which can be a string or list."""
        if isinstance(line, list):
            await Util.send_dialogue_choices(ws, self.uuid, line)
        elif isinstance(line, str):
            await Util.send_dialogue(ws, self.uuid, line)
        else:
            raise ValueError

    async def on_interact(self, event_ctx):
        """Send dialogue when player interacts with Stander."""
        if event_ctx.username in self.conv_progress:
            self.conv_progress[event_ctx.username] += 1
            try:
                await self.send_line(
                    event_ctx.ws,
                    self.dialogue[self.conv_progress[event_ctx.username]])
                event_ctx.player.talking_to = self
            except IndexError:
                del self.conv_progress[event_ctx.username]
                await Util.send_dialogue_end(event_ctx.ws, self.uuid)
                event_ctx.player.talking_to = None
            except ValueError:
                del self.conv_progress[event_ctx.username]
                await self.on_interact(event_ctx)
        else:
            self.conv_progress[event_ctx.username] = 0
            await self.send_line(
                event_ctx.ws,
                self.dialogue[self.conv_progress[event_ctx.username]])
            event_ctx.player.talking_to = self

    async def on_dialogue_choose(self, event_ctx, choice):
        """Respond to player choosing dialogue."""
        if event_ctx.username in self.conv_progress:
            self.conv_progress[event_ctx.username] += 1
            try:
                await self.send_line(
                    event_ctx.ws,
                    self.dialogue[self.conv_progress[event_ctx.username]].get(
                        choice))
                event_ctx.player.talking_to = self
            except IndexError:
                del self.conv_progress[event_ctx.username]
                await Util.send_dialogue_end(event_ctx.ws, self.uuid)
                event_ctx.player.talking_to = None
            except ValueError:
                self.conv_progress[event_ctx.username] -= 1

    def get_bounding_box(self):
        """Stander's bounding box is same as player's."""
        return super().get_bounding_box_of_width(PLAYER_WIDTH)
