"use strict";

const SERVER_URL = "wss://terrekin-server.kroiririoroirkk.repl.co";

const BLOCK_WIDTH = 32;
const PLAYER_WIDTH = 28;
const SCALE_FACTOR = 1.3;

const PLAYER_SPEED = BLOCK_WIDTH*3;
const SPEED_MULTIPLIER = 2;

const MIN_SAMPLE_RATE = 0.1;
const MAX_SAMPLE_RATE = 20;
const DEFAULT_SAMPLE_RATE = 3;

export {SERVER_URL,
        BLOCK_WIDTH, PLAYER_WIDTH, SCALE_FACTOR,
        PLAYER_SPEED, SPEED_MULTIPLIER,
        MIN_SAMPLE_RATE, MAX_SAMPLE_RATE, DEFAULT_SAMPLE_RATE};
