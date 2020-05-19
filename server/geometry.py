from collections import namedtuple
from enum import Enum
import math

class Vec(namedtuple("Vec", ["x", "y"])):
  def relative_to(self, p):
    return Vec(self.x - p.x, self.y - p.y)

  def __add__(self, p):
    return Vec(self.x + p.x, self.y + p.y)

  def __sub__(self, p):
    return Vec(self.x - p.x, self.y - p.y)

  def __mul__(self, scalar):
    return Vec(self.x * scalar, self.y * scalar)

  def dist_to(self, p):
    return math.hypot(self.x - p.x, self.y - p.y)

  def norm(self):
    return math.hypot(self.x, self.y)

def vec_from_dir(d):
  key = {
    "l": Vec(-1,0),
    "r": Vec(1,0),
    "u": Vec(0,-1),
    "d": Vec(0,1)
  }
  return key.get(d)

class Dir(Enum):
  LEFT = 0
  UP = 1
  RIGHT = 2
  DOWN = 3

def dir_to_str(d):
  if d is Dir.LEFT:
    return "l"
  elif d is Dir.UP:
    return "u"
  elif d is Dir.RIGHT:
    return "r"
  elif d is Dir.DOWN:
    return "d"

def str_to_dir(d):
  if d == "l":
    return Dir.LEFT
  elif d == "u":
    return Dir.UP
  elif d == "r":
    return Dir.RIGHT
  elif d == "d":
    return Dir.DOWN

class BoundingBox():
  def __init__(self, v1, v2):
    self.v1 = v1
    self.v2 = v2

  def get_bound(self, direction):
    directions = {
      Dir.LEFT: self.v1.x,
      Dir.UP: self.v1.y,
      Dir.RIGHT: self.v2.x,
      Dir.DOWN: self.v2.y
    }
    return directions.get(direction)

  def get_left_b(self):
    return self.get_bound(Dir.LEFT)

  def get_top_b(self):
    return self.get_bound(Dir.UP)

  def get_right_b(self):
    return self.get_bound(Dir.RIGHT)

  def get_bottom_b(self):
    return self.get_bound(Dir.DOWN)

  def get_width(self):
    return self.v2.x - self.v1.x

  def get_height(self):
    return self.v2.y - self.v1.y
 
  def is_touching(self, bbox):
    return not (bbox.get_left_b()   > self.get_right_b() or
                bbox.get_right_b()  < self.get_left_b() or
                bbox.get_top_b()    > self.get_bottom_b() or
                bbox.get_bottom_b() < self.get_top_b())
