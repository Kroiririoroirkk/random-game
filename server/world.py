from collections import namedtuple

from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import Vec
from tilebasic import Empty

worlds = {}

TileXY = namedtuple("TileXY", ["block_x", "block_y"])

def tileXY_to_spawn_pos(t):
    return Vec(t.block_x * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2,
               t.block_y * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2)

def pos_to_tileXY(pos):
  return int(pos.x) // BLOCK_WIDTH, int(pos.y) // BLOCK_WIDTH

def tileXY_to_pos(t):
  return Vec(t.block_x * BLOCK_WIDTH, t.block_y * BLOCK_WIDTH)

class World:
  def __init__(self, w_id, tiles, entities, spawn_points):
    self.w_id = w_id
    self.tiles = tiles
    self.entities = entities
    self.spawn_points = spawn_points

  def get_tile(self, t):
    try:
      return self.tiles[t.block_y][t.block_x]
    except IndexError:
      return Empty()

