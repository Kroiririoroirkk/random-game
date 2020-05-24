"use strict";

import {wrapText} from "./textbox.mjs";

class Battle {
  constructor() {
    this.playerHp = null;
    this.enemyHp = null;
  }

  render(game) {
    if (this.playerHp && this.enemyHp) {
      const ctx = game.canvasCtx,
            enemyText = "Enemy HP: " + this.enemyHp.toString() + ".",
            playerText = "Your HP: " + this.playerHp.toString() + ".";
      ctx.font = "20px san-serif";
      ctx.fillStyle = "rgb(80, 0, 80)";
      ctx.fillRect(0, game.getScaledHeight()/2 - 30,
                   ctx.measureText(enemyText).width + 20, 30);
      ctx.fillRect(game.getScaledWidth()
                     - ctx.measureText(playerText).width - 20,
                   game.getScaledHeight()/2 - 30,
                   ctx.measureText(playerText).width + 20, 30);
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillText(enemyText, 10, game.getScaledHeight()/2 - 10);
      ctx.fillText(playerText,
                   game.getScaledWidth()
                     - ctx.measureText(playerText).width - 10,
                   game.getScaledHeight()/2 - 10);
    }
  }
}

class BattleMenu {
  constructor(game, moves) {
    this.items = [];
    this.moves = [];
    this.wrappedText = [];
    this.currentlySelected = 0;
    this.setMoves(game, moves);
  }

  setMoves(game, moves) {
    this.moves = moves;
    this.redraw(game);
  }

  redraw(game) {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      ["Choose a move:",
      ...this.moves.map((move, i) =>
        i === this.currentlySelected ?
          ">" + move :
          move)].join(" \n ----- \n "), game.getScaledWidth() - 20);
  }

  cursorUp(game) {
    this.currentlySelected--;
    if (this.currentlySelected < 0) {
      this.currentlySelected += this.moves.length;
    }
    this.redraw(game);
  }

  cursorDown(game) {
    this.currentlySelected++;
    if (this.currentlySelected >= this.moves.length) {
      this.currentlySelected -= this.moves.length;
    }
    this.redraw(game);
  }

  getOptionSelected() {
    return this.currentlySelected;
  }

  resetSelected() {
    this.currentlySelected = 0;
  }

  render(game) {
    const LINE_HEIGHT = 24,
          ctx         = game.canvasCtx,
          startingY = game.getScaledHeight()/2;
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(0, startingY, game.getScaledWidth(),
                 game.getScaledHeight()/2);

    ctx.fillStyle = "rgb(255, 255, 255)";
    let y = startingY;
    for (const line of this.wrappedText) {
      y += LINE_HEIGHT;
      ctx.fillText(line, 10, y);
    }
  }
}

export {Battle, BattleMenu};
