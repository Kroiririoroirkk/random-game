from collections import namedtuple

from config import BLOCK_WIDTH, PLAYER_WIDTH
from geometry import Vec
from tilebasic import Empty

worlds = {}

class TileXY(namedtuple("TileXY", ["block_x", "block_y"])):
  def get_spawn_pos(self):
    return Vec(self.block_x * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2,
               self.block_y * BLOCK_WIDTH + (BLOCK_WIDTH-PLAYER_WIDTH)/2)

def pos_to_tileXY(pos):
  return int(pos.x) // BLOCK_WIDTH, int(pos.y) // BLOCK_WIDTH

def tileXY_to_pos(block_x, block_y):
  return Vec(block_x * BLOCK_WIDTH, block_y * BLOCK_WIDTH)

class World:
  def __init__(self, w_id, text, tiles, entities, spawn_posits):
    self.w_id = w_id
    self.text = text
    self.tiles = tiles
    self.entities = entities
    self.spawn_posits = spawn_posits

  def get_tile(self, block_x, block_y):
    try:
      return self.tiles[block_y][block_x]
    except IndexError:
      return Empty()

class WorldData:
  def __init__(self, w_id, text, spawn_posits, tile_metadata):
    self.w_id = w_id
    self.text = text
    self.spawn_posits = spawn_posits
    self.tile_metadata = tile_metadata

