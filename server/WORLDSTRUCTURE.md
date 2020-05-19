# World file structure

Worlds are stored as JSON. Two different formats are used.

## Format for saving to file (this is version 0.1.0):
```json
{
  "$schema": "http://json-schema.org/draft/2019-09/schema#",
  "type": "object",
  "definitions": {
    "vec2": {
      "type": "object",
      "properties": {
        "x": {"type": "number"},
        "y": {"type": "number"}
      },
      "required": ["x", "y"]
    },
    "tile": {
      "type": "object",
      "properties": {
        "tile_id": {
          "type": "string",
          "$comment": "Should be snake_case"
        },
        "tile_data": {
          "type": "object",
          "$comment": "Optionally, any data that the tile needs."
        }
      },
      "required": ["tile_id"]
    },
    "entity": {
      "type": "object",
      "properties": {
        "uuid": {"type": "string"},
        "entity_id": {
          "type": "string",
          "$comment": "Should be snake_case"
        },
        "pos": {"$ref": "#/definitions/vec2"},
        "velocity": {"$ref": "#/definitions/vec2"},
        "facing": {
          "type": "string",
          "enum": ["r", "d", "l", "u"]
        }
      },
      "required": ["uuid", "entity_id", "pos", "velocity", "facing"]
    }
  },
  "properties": {
    "version": {
      "const": "0.1.0"
    },
    "tiles": {
      "type": "array",
      "$comment": "List of rows of tiles. Tiles run in the same order as words run on a page.",
      "items": {
        "type": "array",
        "items": {"$ref": "#/definitions/tile"}
      }
    },
    "entities": {
      "type": "array",
      "items": {"$ref": "#/definitions/entity"}
    },
    "spawn_points": {
      "type": "object",
      "$comment": "The property name should be the spawn point ID.",
      "minProperties": 1,
      "additionalProperties": {
        "type": "object",
        "properties": {
          "block_x": {"type": "integer", "minimum": 0},
          "block_y": {"type": "integer", "minimum": 0}
        },
        "required": ["block_x", "block_y"]
      }
    }
  },
  "required": ["version", "tiles", "entities", "spawn_points"]
}
```

## Format for transmission to client (this is version 0.1.0):
```json
{
  "$schema": "http://json-schema.org/draft/2019-09/schema#",
  "definitions": {
    "vec2": {
      "type": "object",
      "properties": {
        "x": {"type": "number"},
        "y": {"type": "number"}
      },
      "required": ["x", "y"]
    },
    "tile": {
      "type": "object",
      "properties": {
        "tile_id": {
          "type": "string",
          "$comment": "Should be snake_case"
        },
        "tile_data": {
          "type": "object",
          "$comment": "Note that the client's tile data is a subset of the full tile data."
        }
      },
      "required": ["tile_id"]
    },
    "entity": {
      "type": "object",
      "properties": {
        "uuid": {"type": "string"},
        "entity_id": {
          "type": "string",
          "$comment": "Should be snake_case"
        },
        "pos": {"$ref": "#/definitions/vec2"},
        "velocity": {"$ref": "#/definitions/vec2"},
        "facing": {
          "type": "string",
          "enum": ["r", "d", "l", "u"]
        }
      },
      "required": ["uuid", "entity_id", "pos", "velocity", "facing"]
    }
  },
  "type": "object",
  "properties": {
    "version": {
      "const": "0.1.0"
    },
    "tiles": {
      "type": "array",
      "$comment": "List of rows of tiles. Tiles run in the same order as words run on a page.",
      "items": {"$ref": "#/definitions/tile"}
    },
    "entities": {
      "type": "array",
      "items": {"$ref": "#/definitions/entity"}
    },
    "spawn_pos": {"$ref": "#/definitions/vec2"}
  },
  "required": ["version", "tiles", "entities", "spawn_pos"]
}
```
