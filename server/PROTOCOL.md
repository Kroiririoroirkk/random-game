# Client-server protocol

This document lists the various messages that can be sent to and by the server. Client-server connection is made via the WebSocket API. **As game development is still unstable, this protocol is liable to change without warning.**

## General form

Messages are of the form

`header|parameter1|parameter2|...etc...|lastparameter`.

If the message has no parameters, the message is simply

`header`.

## Messages sent to the server

### username

This message does not follow the general message form. The client must send a `username` message as the very first message of the connection. The content of the message is simply the client's username. For example, if the client's username were `foo`, the message should be

`foo`.

### move

Parameters (1): `move_str`.

This message tells the server to move the player in the direction specified by `move_str`. `move_str` must be zero or more of the following letters: `l`, `r`, `u`, and `d`, standing for left, right, up, and down. The order of the letters is not important. Duplicate letters are ignored. See [movedto](#movedto) for the server's response.

### fastmove

Parameters (1): `move_str`.

This message is similar to `move`, except that it is used for fast-walking. See [move](#move) for an explanation of the `move_str` parameter.

### interact

No parameters.

This message tells the server that the player wishes to interact, e.g. with a sign or a non-player character.

### getplayers

No parameters.

This message retrieves the usernames of other players and their locations. See [players](#players) for details on the response.

## Messages sent by the server

### world

Parameters (1): `world_str`.

This message is sent when the player first joins (in response to the [username](#username) message) or when the player changes worlds, e.g. through a portal. The `world_str` parameter is a JSON object governed by the transmission to client format detailed in WORLDSTRUCTURE.md.

### movedto

Parameters (2): `x_pos`, `y_pos`.

This message is sent in response to the client's [move](#move) and [fastmove](#fastmove), although the server may send this message at any time. The parameters `x_pos` and `y_pos` are numbers denoting the player's new position.

### signtext

Parameters (1): `sign_text`.

This message is sent when the player reads a sign (possibly in response to the [interact](#interact) message). The `sign_text` parameter gives the text of the sign. Note that `sign_text` may contain `|` characters.

### players

Parameters (Variable number, given by number of other players * 3): `username1`, `x_pos1`, `y_pos1`, `username2`, `x_pos2`, `y_pos2`, etc.

This message is sent in response to the [getplayers](#getplayers) message. For each player in the same world as the client, three parameters are given: the player's username, the player's x position, and the player's y position. The list of players returned excludes the client.

