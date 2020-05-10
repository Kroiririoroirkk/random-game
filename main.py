import asyncio
from signal import signal, SIGINT
from sys import exit
import websockets

WSPORT = 8080

myFirstWorld = ("world|"
                "2,1|"
                "ggggg|"
                "ggggg|"
                "ggggg")

async def run(ws, path):
  username = await ws.recv()
  print('New user: ' + username)
  await ws.send(myFirstWorld)

start_server = websockets.serve(run, '0.0.0.0', WSPORT)

def cleanup(sig, frame):
  print('Exiting...')
  exit(0)

signal(SIGINT, cleanup)

print('WebSocket server starting! Press CTRL-C to exit.')
loop = asyncio.get_event_loop()
loop.run_until_complete(start_server)
loop.run_forever()

