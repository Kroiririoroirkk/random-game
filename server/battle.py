"""Defines the Battle class for battles."""
from collections import namedtuple
from enum import Enum
import random


Move = namedtuple("Move", ["name", "damage"])


class Combatant:
    """The Combatant describes something that can be in a Battle.

    Examples of things that are Combatants are Players and AICombatants.
    """

    def __init__(self):
        """Give a Combatant some default properties."""
        self.hp = 20
        self.moves = [
            Move("Hit", 1),
            Move("Hithit", 2),
            Move("Hithithit", 3)
        ]
        self.speed = 20

    def is_faster_than(self, other):
        """Test if a Combatant is faster than another Combatant."""
        return self.speed > other.speed


class AICombatant(Combatant):
    """The AICombatant is a Combatant whose strategy is computer-determined."""

    def next_move(self, battle):
        """Given the current state of the battle, determine the next move."""


class RandomMoveAICombatant(AICombatant):
    """The RandomMoveAICombatant just chooses a random move every time."""

    def next_move(self, battle):
        """Just return a random move."""
        del battle  # Unused
        return random.choice(self.moves)


class BattleState(Enum):
    """An enumeration giving possible battle states."""

    ONGOING = 0
    PLAYER_WIN = 1
    AI_WIN = 2


class BattleCombatants(Enum):
    """An enumeration giving the combatants of a two-combatant battle."""

    PLAYER = 1
    AI = 2


class PlayerAIBattle:
    """Describes a battle between a player and an AI."""

    def __init__(self, player_combatant, ai_combatant):
        """Initialize with the two Combatants given."""
        self.player_combatant = player_combatant
        self.ai_combatant = ai_combatant

    def process_player_move(self, player_move):
        """Given the player move, update and return the BattleState."""
        return self.process_moves(
            player_move, self.ai_combatant.next_move(self))

    def process_moves(self, player_move, ai_move):
        """Given the combatant moves, update and return the BattleState."""
        if (self.player_combatant.is_faster_than(self.ai_combatant)
                or (self.player_combatant.speed == self.ai_combatant.speed
                    and random.random() < 0.5)):
            faster_combatant = BattleCombatants.PLAYER
            faster_move = player_move
            slower_combatant = BattleCombatants.AI
            slower_move = ai_move
        else:
            faster_combatant = BattleCombatants.AI
            faster_move = ai_move
            slower_combatant = BattleCombatants.PLAYER
            slower_move = player_move
        battle_state = self.process_move(faster_combatant, faster_move)
        if battle_state is BattleState.ONGOING:
            return self.process_move(slower_combatant, slower_move)
        return battle_state

    def process_move(self, combatant, move):
        """Given a combatant and move, update and return the BattleState."""
        if combatant is BattleCombatants.PLAYER:
            self.ai_combatant.hp -= move.damage
        elif combatant is BattleCombatants.AI:
            self.player_combatant.hp -= move.damage
        return self.get_battle_state()

    def get_battle_state(self):
        """Return BattleState based on Combatant HPs."""
        if self.player_combatant.hp <= 0:
            return BattleState.AI_WIN
        if self.ai_combatant.hp <= 0:
            return BattleState.PLAYER_WIN
        return BattleState.ONGOING
