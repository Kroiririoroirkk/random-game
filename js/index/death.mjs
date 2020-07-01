"use strict";

import {ContextMenus} from "./contextmenu.mjs";
import {Images} from "./render.mjs";

class DeathScreen {
  render(game) {
    const ctx = game.canvasCtx,
          LINE_HEIGHT = 24;
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillText("You died.", 10, 20);
    ctx.fillText("Press Z to respawn.", 10, 20 + LINE_HEIGHT)
    const sprite = Images.getImage("terrekin/death.png");
    if (sprite) {
      const size = Math.min(game.getScaledWidth()-20,
                            game.getScaledHeight()-30-2*LINE_HEIGHT);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, 10, 20 + 2*LINE_HEIGHT, size, size);
    }
  }
}

export {DeathScreen};
