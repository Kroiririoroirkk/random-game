"""Defines the Vec, Direction, and BoundingBox classes."""
from collections import namedtuple
from enum import Enum
import math


class Vec(namedtuple("Vec", ["x", "y"])):
    """The Vec class represents a 2D vector."""

    def relative_to(self, other):
        """Get the displacement vector from other to self."""
        return Vec(self.x - other.x, self.y - other.y)

    def __add__(self, other):
        """Add another vector."""
        return Vec(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        """Subtract another vector."""
        return Vec(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        """Multiply a vector by a scalar."""
        return Vec(self.x * scalar, self.y * scalar)

    def dist_to(self, other):
        """Get the distance to another vector."""
        return math.hypot(self.x - other.x, self.y - other.y)

    def norm(self):
        """Get the magnitude of a vector, i.e. the distance to the origin."""
        return math.hypot(self.x, self.y)

    def angle_to(self, other):
        """Get the angle between self and other.

        Returns:
            An angle in radians from -pi to pi, measured from the +x axis.
        """
        return math.atan2(self.y - other.y, other.x - self.x)

    @staticmethod
    def vec_from_direction_str(direction_str):
        """Return a unit vector in the direction specified.

        Args:
            Either "l" for left, "r" for right, "u" for up, or "d" for down.
        """
        key = {
            "l": Vec(-1, 0),
            "r": Vec(1, 0),
            "u": Vec(0, -1),
            "d": Vec(0, 1)
        }
        return key.get(direction_str)


class Direction(Enum):
    """Enum representing the four cardinal directions."""

    LEFT = 0
    UP = 1
    RIGHT = 2
    DOWN = 3

    def direction_to_str(self):
        """Convert a Direction enum to a one-character string.

        Returns:
            Either "l" for left, "r" for right, "u" for up, or "d" for down.
        """
        if self is Direction.LEFT:
            return "l"
        if self is Direction.UP:
            return "u"
        if self is Direction.RIGHT:
            return "r"
        if self is Direction.DOWN:
            return "d"
        raise ValueError

    @staticmethod
    def str_to_direction(direction_str):
        """Convert a one-character string to a Direction enum.

        Args:
            Either "l" for left, "r" for right, "u" for up, or "d" for down.
        """
        if direction_str == "l":
            return Direction.LEFT
        if direction_str == "u":
            return Direction.UP
        if direction_str == "r":
            return Direction.RIGHT
        if direction_str == "d":
            return Direction.DOWN
        raise ValueError

    def direction_to_angle(self):
        """Convert a Direction enum to the angle from the +x-axis.

        Returns:
            Either -pi for left, 0 for right, pi/2 for up, or -pi/2 for down.
        """
        if self is Direction.LEFT:
            return -math.pi
        if self is Direction.UP:
            return math.pi/2
        if self is Direction.RIGHT:
            return 0
        if self is Direction.DOWN:
            return -math.pi/2
        raise ValueError


class BoundingBox():
    """A BoundingBox is a rectangle around an object for collision purposes."""

    def __init__(self, vec1, vec2):
        """Initialize with the upper-left and lower-right Vecs."""
        self.vec1 = vec1
        self.vec2 = vec2

    def get_bound(self, direction):
        """Get x- or y-value corresponding to a Direction enum."""
        directions = {
            Direction.LEFT: self.vec1.x,
            Direction.UP: self.vec1.y,
            Direction.RIGHT: self.vec2.x,
            Direction.DOWN: self.vec2.y
        }
        return directions.get(direction)

    def get_left_b(self):
        """Get x-value for the BoundingBox's left bound."""
        return self.get_bound(Direction.LEFT)

    def get_top_b(self):
        """Get y-value for the BoundingBox's top bound."""
        return self.get_bound(Direction.UP)

    def get_right_b(self):
        """Get x-value for the BoundingBox's right bound."""
        return self.get_bound(Direction.RIGHT)

    def get_bottom_b(self):
        """Get y-value for the BoundingBox's bottom bound."""
        return self.get_bound(Direction.DOWN)

    def get_width(self):
        """Get width of BoundingBox."""
        return self.vec2.x - self.vec1.x

    def get_height(self):
        """Get height of BoundingBox."""
        return self.vec2.y - self.vec1.y

    def is_touching(self, bbox):
        """Check if two BoundingBoxes are colliding."""
        return not (bbox.get_left_b() > self.get_right_b() or
                    bbox.get_right_b() < self.get_left_b() or
                    bbox.get_top_b() > self.get_bottom_b() or
                    bbox.get_bottom_b() < self.get_top_b())
