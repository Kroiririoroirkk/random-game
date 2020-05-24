"""The Game class handles all of the player objects."""

from battle import PlayerAIBattle
from util import Util


class Game:
    """The Game class keeps track of players and WebSockets."""

    def __init__(self):
        """There are initially no players in the game."""
        self.players = []
        self.battles = []

    def get_player(self, username):
        """Get the player object associated with the given username."""
        try:
            return next(
                p for p in self.players
                if p.username == username)
        except StopIteration:
            raise ValueError

    def add_player(self, player):
        """Associate the given username with the given player object."""
        self.players.append(player)

    def player_in_battle(self, username):
        """Check if a player is in a battle."""
        for battle in self.battles:
            if battle.player_combatant.username == username:
                return True
        return False

    def get_players_by_world(self, world_id):
        """Get all the players in the game with the given world_id."""
        return [p for p in self.players if p.world_id == world_id]

    def get_battle_by_username(self, username):
        """Get the battle that the player with the given username is in."""
        for battle in self.battles:
            if battle.player_combatant.username == username:
                return battle

    def del_battle_by_username(self, username):
        """Delete the battle that the player with the given username is in."""
        self.battles = [b for b in self.battles
                        if b.player_combatant.username != username]

    async def create_battle(self, username, ws, player, ai):
        """Create a battle with the given player and AI."""
        if self.player_in_battle(username):
            raise ValueError
        battle = PlayerAIBattle(player, ai)
        self.battles.append(battle)
        await Util.send_battle_start(ws)
        await Util.send_battle_status(
            ws, player.hp, ai.hp)
        await Util.send_move_request(ws, player.moves)
