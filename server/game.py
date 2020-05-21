"""The Game class handles all the player objects and utility methods."""
import json
from websockets.exceptions import ConnectionClosed

from storeworld import world_to_client_json
from world import World


class Game:
    """The Game class keeps track of players and WebSockets."""

    def __init__(self):
        """There are initially no players in the game."""
        self.player_objs = {}

    def get_player(self, username):
        """Get the player object associated with the given username."""
        return self.player_objs.get(username)

    def set_player(self, username, player):
        """Associate the given username with the given player object."""
        self.player_objs[username] = player

    @staticmethod
    async def send_world(ws, world, spawn_pos):
        """See the world message under PROTOCOL.md for explanation."""
        await ws.send(f"world|{world_to_client_json(world, spawn_pos)}")

    @staticmethod
    async def send_moved_to(ws, pos):
        """See the movedto message under PROTOCOL.md for explanation."""
        await ws.send(f"movedto|{pos.x}|{pos.y}")

    @staticmethod
    async def send_sign(ws, sign):
        """See the signtext message under PROTOCOL.md for explanation."""
        await ws.send(f"signtext|{sign.data.text}")

    async def send_players(self, ws, player_username, world_id):
        """See the players message under PROTOCOL.md for explanation."""
        players_str = "|".join(
            f"{username}|{p.pos.x}|{p.pos.y}"
            for username, p in self.player_objs.items()
            if p.world_id == world_id
            and username != player_username)
        await ws.send("players|"+players_str)

    async def send_entities(self, ws, world_id):
        """See the entities message under PROTOCOL.md for explanation."""
        entities_str = "|".join(
            json.dumps(e.to_json(True), separators=(",", ":"))
            for e in World.get_world_by_id(world_id).entities)
        await ws.send("entities|"+entities_str)

    @staticmethod
    async def send_dialogue(ws, uuid, dialogue_text):
        """See the dialogue message under PROTOCOL.md for explanation."""
        await ws.send(f"dialogue|{uuid.hex}|{dialogue_text}")

    @staticmethod
    async def send_dialogue_choices(ws, uuid, lines):
        """See the dialoguechoice message under PROTOCOL.md for explanation."""
        await ws.send(f"dialoguechoice|{uuid.hex}|{'|'.join(lines)}")

    @staticmethod
    async def send_dialogue_end(ws, uuid):
        """See the dialogueend message under PROTOCOL.md for explanation."""
        await ws.send(f"dialogueend|{uuid.hex}")

    async def send_tag(self, tagging_player, tagged_player):
        """See the tag message under PROTOCOL.md for explanation."""
        message = f"tag|{tagging_player}|{tagged_player}"
        try:
            await self.get_player(tagging_player).ws.send(message)
        except ConnectionClosed:
            pass
        try:
            await self.get_player(tagged_player).ws.send(message)
        except ConnectionClosed:
            pass
