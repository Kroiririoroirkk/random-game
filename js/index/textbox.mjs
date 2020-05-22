"use strict";

import {ContextMenus} from "./contextmenu.mjs";

function wrapText(ctx, text, maxWidth) {
  let words = text.split(" "),
      currentLine = words[0],
      lines = [];

  for (var i = 1; i < words.length; i++) {
    if (words[i] === "\n") {
      lines.push(currentLine);
      currentLine = "";
    } else {
      let testLine  = currentLine === "" ?
            words[i] : currentLine + " " + words[i],
          metrics   = ctx.measureText(testLine),
          testWidth = metrics.width;
      if (testWidth < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
  }
  lines.push(currentLine);
  return lines;
}

class UsernameNotice {
  render(game) {
    const ctx = game.canvasCtx,
          text = "Your username is " + game.username + ".";
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(0, 0, ctx.measureText(text).width + 20, 30);
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillText(text, 10, 20);
  }
}

class GameLog {
  constructor(game, width) {
    this.width = width;
    this.messageLog = [];
    this.lineStart = 0;
    this.wrappedText = [];
    this.unfocus(game);
  }

  addMsg(game, msg) {
    this.messageLog.unshift(msg);
    if (game.contextMenu === ContextMenus.LOG) {
      this.focus(game);
    } else {
      this.unfocus(game);
    }
  }

  scrollUp() {
    this.lineStart--;
    if (this.lineStart < 0) {
      this.lineStart = 0;
    }
  }

  scrollDown() {
    this.lineStart++;
    if (this.lineStart > this.wrappedText.length-1) {
      this.lineStart = this.wrappedText.length-1;
    }
  }

  focus(game) {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      ["Press A to exit the log, X to clear, and arrow keys to scroll.",
      ...this.messageLog]
        .join(" \n ----- \n "), this.width);
  }

  unfocus(game) {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    const openMsg = "Press A to open the log!";
    const text = this.messageLog.length > 0 ?
      `${openMsg} \n ----- \n ${this.messageLog[0]}` :
      openMsg;
    this.wrappedText = wrapText(ctx, text, this.width);
    this.lineStart = 0;
  }

  clear(game) {
    this.messageLog = [];
    this.focus(game);
    this.lineStart = 0;
  }

  render(game) {
    const LINE_HEIGHT  = 24,
          ctx          = game.canvasCtx,
          renderedText = this.wrappedText.slice(this.lineStart);

    let y = 31;
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(0, y, this.width + 20, LINE_HEIGHT*renderedText.length + 5);

    ctx.fillStyle = "rgb(255, 255, 255)";
    for (const line of renderedText) {
      y += LINE_HEIGHT;
      ctx.fillText(line, 10, y);
    }
  }
}

class MenuItem {
  constructor(text) {
    this.text = text;
  }
}

class Menu {
  constructor(game, width) {
    this.width = width;
    this.items = [];
    this.wrappedText = [];
    this.currentlySelected = 0;
    this.unfocus(game);
  }

  addItem(game, item) {
    this.items.push(item);
    if (game.contextMenu === ContextMenus.MENU) {
      this.focus(game);
    } else {
      this.unfocus(game);
    }
  }

  focus(game) {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      ["Press C to close the menu, arrow keys to pick an option, and Z to choose.",
      ...this.items.map((item, i) =>
        i === this.currentlySelected ?
          ">" + item.text :
          item.text)].join(" \n ----- \n "), this.width);
  }

  unfocus(game) {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      "Press C to open the menu!", this.width);
  }

  cursorUp(game) {
    this.currentlySelected--;
    if (this.currentlySelected < 0) {
      this.currentlySelected = 0;
    }
    this.focus(game);
  }

  cursorDown(game) {
    this.currentlySelected++;
    if (this.currentlySelected >= this.items.length) {
      this.currentlySelected = this.items.length - 1;
    }
    this.focus(game);
  }

  render(game) {
    const LINE_HEIGHT = 24,
          ctx         = game.canvasCtx,
          startingX = game.getScaledWidth() - this.width - 20;
    let y = 0;
    ctx.font = "20px san-serif";
    ctx.fillStyle = "rgb(80, 0, 80)";
    ctx.fillRect(startingX, y, this.width + 20,
                 LINE_HEIGHT*this.wrappedText.length + 5);

    ctx.fillStyle = "rgb(255, 255, 255)";
    for (const line of this.wrappedText) {
      y += LINE_HEIGHT;
      ctx.fillText(line, startingX + 10, y);
    }
  }
}

class DialogueState {
  static TEXT = 1;
  static CHOOSE = 2;
}

class DialogueBox {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.state = null;
    this.text = null;
    this.options = null;
    this.lineStart = 0;
    this.currentlySelected = 0;
    this.wrappedText = [];
    this.entityUuid = null;
  }

  setText(game, text, entityUuid) {
    this.options = null;
    this.text = text;
    this.state = DialogueState.TEXT;
    this.entityUuid = entityUuid;
    this.lineStart = 0;
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx, text, this.width);
  }

  setOptions(game, options, entityUuid) {
    this.text = null;
    this.options = options;
    this.lineStart = 0;
    this.state = DialogueState.CHOOSE;
    this.entityUuid = entityUuid;
    this.currentlySelected = 0;
    this.redrawOptions(game);
  }

  redrawOptions(game) {
    const ctx = game.canvasCtx;
    ctx.font = "20px sans-serif";
    this.wrappedText = wrapText(ctx,
      this.options.map((option, i) =>
        i === this.currentlySelected ?
          ">" + option :
          option).join(" \n "), this.width);
  }

  getOptionSelected() {
    return this.currentlySelected;
  }

  endDialogue() {
    this.text = null;
    this.options = null;
    this.state = null;
  }

  onUpArrow(game) {
    if (this.state === DialogueState.TEXT) {
      this.lineStart--;
      if (this.lineStart < 0) {
        this.lineStart = 0;
      }
    } else if (this.state === DialogueState.CHOOSE) {
      this.currentlySelected --;
      if (this.currentlySelected < 0) {
        this.currentlySelected = 0;
      }
      this.redrawOptions(game);
    }
  }

  onDownArrow(game) {
    if (this.state === DialogueState.TEXT) {
      this.lineStart++;
      if (this.lineStart > this.wrappedText.length-1) {
        this.lineStart = this.wrappedText.length-1;
      }
    } else if (this.state === DialogueState.CHOOSE) {
      this.currentlySelected++;
      if (this.currentlySelected > this.wrappedText.length-1) {
        this.currentlySelected = this.wrappedText.length-1;
      }
      this.redrawOptions(game);
    }
  }

  render(game) {
    if (this.state !== null) {
      const LINE_HEIGHT  = 24,
            ctx          = game.canvasCtx,
            renderedText = this.wrappedText.slice(this.lineStart),
            startingY    = game.getScaledHeight() - this.height - 20,
            endingY      = startingY + this.height;

      ctx.font = "20px san-serif";
      ctx.fillStyle = "rgb(80, 0, 80)";
      ctx.fillRect(0, startingY, this.width + 20, this.height + 20);

      ctx.fillStyle = "rgb(255, 255, 255)";
      let y = startingY;
      for (const line of renderedText) {
        y += LINE_HEIGHT;
        if (y > endingY) {return;}
        ctx.fillText(line, 10, y);
      }
    }
  }
}

export {wrapText, UsernameNotice, GameLog, MenuItem, Menu,
        DialogueState, DialogueBox};
