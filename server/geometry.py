from enum import Enum
import math

class Vec:
  def __init__(self, x, y):
    self.x = x
    self.y = y

  def relative_to(self, p):
    return Vec(self.x - p.x, self.y - p.y)

  def __add__(self, p):
    return Vec(self.x + p.x, self.y + p.y)

  def __sub__(self, p):
    return Vec(self.x - p.x, self.y - p.y)

  def __mul__(self, scalar):
    return Vec(self.x * scalar, self.y * scalar)

  def dist_to(self, p):
    return math.dist((self.x, self.y), (p.x, p.y))

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

class LineSegment:
  def __init__(self, start, end):
    self.start = start
    self.end = end

  def dx(self):
    return self.end.x - self.start.x

  def dy(self):
    return self.end.y - self.start.y

  def slope(self):
    return self.dy()/self.dx()

  def intercept(self):
    return self.start.y - self.slope()*self.start.x

  def is_intersecting(self, other):
    def is_between(x, a, b):
      return (a <= x <= b) or (b <= x <= a)
    if self.start.x == self.end.x:
      if other.start.x == other.end.x:
        return self.start.x == other.start.x
      m = other.slope()
      b = other.intercept()
      intersect_y = m*self.start.x+b
      return (is_between(intersect_y, self.start.y, self.end.y)
        and is_between(intersect_y, other.end.y, other.start.y))
    if other.start.x == other.end.x:
      m = self.slope()
      b = self.intercept()
      intersect_y = m*other.start.x+b
      return (is_between(intersect_y, self.start.y, self.end.y)
        and is_between(intersect_y, other.start.y, other.end.y))
    m1 = self.slope()
    b1 = self.intercept()
    m2 = other.slope()
    b2 = other.intercept()
    if m1 == m2:
      return b1 == b2
    intersect_x = (b2-b1)/(m1-m2)
    return (is_between(intersect_x, self.start.x, self.end.x)
      and is_between(intersect_x, other.start.x, other.end.x))

  def shift(self, v):
    return LineSegment(self.start + v, self.end + v)

class BoundingBox:
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
  
  def get_left_side(self):
    return LineSegment(
             Vec(self.get_left_b(), self.get_top_b()),
             Vec(self.get_left_b(), self.get_bottom_b()))

  def get_top_b(self):
    return self.get_bound(Dir.UP)

  def get_top_side(self):
    return LineSegment(
             Vec(self.get_left_b(), self.get_top_b()),
             Vec(self.get_right_b(), self.get_top_b()))

  def get_right_b(self):
    return self.get_bound(Dir.RIGHT)

  def get_right_side(self):
    return LineSegment(
             Vec(self.get_right_b(), self.get_top_b()),
             Vec(self.get_right_b(), self.get_bottom_b()))

  def get_bottom_b(self):
    return self.get_bound(Dir.DOWN)

  def get_bottom_side(self):
    return LineSegment(
             Vec(self.get_left_b(), self.get_bottom_b()),
             Vec(self.get_right_b(), self.get_bottom_b()))

  def get_width(self):
    return self.v2.x - self.v1.x + 1

  def get_height(self):
    return self.v2.y - self.v1.y + 1
 
  def is_touching(self, bbox):
    return not (bbox.get_left_b()   > self.get_right_b() or
                bbox.get_right_b()  < self.get_left_b() or
                bbox.get_top_b()    > self.get_bottom_b() or
                bbox.get_bottom_b() < self.get_top_b())

  def scale(self, k):
    return BoundingBox(self.v1,
      Vec(self.v1.x + k*self.get_width(), self.v1.y + k*self.get_height()))

