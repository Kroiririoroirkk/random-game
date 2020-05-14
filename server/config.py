#Port that the WebSocket server runs on
WSPORT = 8080

#Width and height of one in-game block, in pixels
BLOCK_WIDTH = 32

#Width and height of player, in pixels
PLAYER_WIDTH = 28

#Speed of the player in pixels per second
PLAYER_SPEED = BLOCK_WIDTH*3

#Fast moving speed = SPEED_MULTIPLIER * PLAYER_SPEED
SPEED_MULTIPLIER = 2

#Multiple move messages need to be within MAX_MOVE_DT seconds in order to be considered a single move
MAX_MOVE_DT = 0.1

