"use strict";

import {ContextMenus} from "./contextmenu.mjs";

class DeathScreen {
  render(game) {
    const ctx = game.canvasCtx,
          LINE_HEIGHT = 24;
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillText("You died.", 10, 20);
    ctx.fillText("Press Z to respawn.", 10, 20 + LINE_HEIGHT)
  }
}

export {DeathScreen};
