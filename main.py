import asyncio
from signal import signal, SIGINT
from sys import exit
import websockets

WSPORT = 8765

async def echo(websocket, path):
  async for message in websocket:
    print(message)
    await websocket.send(message)

start_server = websockets.serve(echo, 'localhost', WSPORT)

def cleanup(sig, frame):
  print('Exiting...')
  exit(0)

signal(SIGINT, cleanup)

print('WebSocket server starting! Press CTRL-C to exit.')
loop = asyncio.get_event_loop()
loop.run_until_complete(start_server)
loop.run_forever()
