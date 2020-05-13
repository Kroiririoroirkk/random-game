from config import BLOCK_WIDTH
from geometry import BoundingBox, Vec

class Entity:
  def __init__(self, pos):
    self.pos = pos

  def move(self, offset):
    self.pos += offset

  def get_bounding_box(self):
    halfBlock = Vec(BLOCK_WIDTH/2, BLOCK_WIDTH/2)
    return BoundingBox(self.pos - halfBlock, self.pos + halfBlock)

  def is_touching(self, e):
    return self.get_bounding_box().is_touching(e.get_bounding_box())

class Player(Entity):
  def __init__(self):
    super().__init__(None)
    self.time_of_last_move = 0
    self.world_id = None
    self.time_of_last_portal = 0

  def get_bounding_box(self):
    return super().get_bounding_box().scale(7/8)

class Grass(Entity):
  def __init__(self, pos):
    super().__init__(pos)

class WildGrass(Entity):
  def __init__(self, pos):
    super().__init__(pos)

class Wall(Entity):
  def __init__(self, pos):
    super().__init__(pos)

  def block_movement(self, player, path):
    bbox = self.get_bounding_box()
    p_bbox = player.get_bounding_box()
    d = p_bbox.get_width()/2
    offset = d+1
    path_ne = path.shift(Vec(d,-d))
    path_nw = path.shift(Vec(-d,-d))
    path_se = path.shift(Vec(d,d))
    path_sw = path.shift(Vec(-d,d))
    if ((path_ne.is_intersecting(bbox.get_left_side())
        or path_se.is_intersecting(bbox.get_left_side()))
        and path_ne.start.x <= bbox.get_left_b()):
      player.pos.x = bbox.get_left_b() - offset
    if ((path_sw.is_intersecting(bbox.get_top_side())
        or path_se.is_intersecting(bbox.get_top_side()))
        and path_sw.start.y <= bbox.get_top_b()):
      player.pos.y = bbox.get_top_b() - offset
    if ((path_nw.is_intersecting(bbox.get_right_side())
        or path_sw.is_intersecting(bbox.get_right_side()))
        and path_nw.start.x >= bbox.get_right_b()):
      player.pos.x = bbox.get_right_b() + offset
    if ((path_nw.is_intersecting(bbox.get_bottom_side())
        or path_ne.is_intersecting(bbox.get_bottom_side()))
        and path_nw.start.y >= bbox.get_bottom_b()):
      player.pos.y = bbox.get_bottom_b() + offset

class PortalDest:
  def __init__(self, w_id, spawn_num):
    self.w_id = w_id
    self.spawn_num = spawn_num

class Portal(Entity):
  def __init__(self, pos, dest):
    super().__init__(pos)
    self.dest = dest

