"""The Game class handles all of the player objects."""


class Game:
    """The Game class keeps track of players and WebSockets."""

    def __init__(self):
        """There are initially no players in the game."""
        self.players = []

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
