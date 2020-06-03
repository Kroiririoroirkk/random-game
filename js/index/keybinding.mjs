"use strict";

class KeyBinding {
  constructor() {
    this.pressedKeys = new Set();
    this.keyBinds = {};
    this.registerKeyListeners();
  }

  registerKeyListeners() {
    document.addEventListener("keydown", e => this.pressedKeys.add(e.code), false);
    document.addEventListener("keyup", e => this.pressedKeys.delete(e.code), false);
  }

  addKeyBind(eventName, defaultKey) {
    this.keyBinds[eventName] = defaultKey;
  }

  getKeyBind(eventName) {
    return this.keyBinds[eventName];
  }

  checkIfPressed(eventName) {
    return this.pressedKeys.has(this.keyBinds[eventName]);
  }

  consume(eventName) {
    this.pressedKeys.delete(this.keyBinds[eventName]);
  }

  createPage(game) {
    document.body.style.overflow = "";
    let canvas = document.querySelector("canvas");
    canvas.style.display = "none";
    let container = document.createElement("DIV");
    container.id = "keybindpage";
    let button = document.createElement("BUTTON");
    button.type = "button";
    button.innerHTML = "Take me back to the game!";
    button.onclick = e => {
      game.makePage();
      game.gameLog.redrawText(game);
      game.menu.redrawText(game);
    };
    container.append(button);
    for (const eventName in this.keyBinds) {
      let div = document.createElement("DIV"),
          charInput = document.createElement("INPUT");
      charInput.type = "text";
      charInput.value = this.keyBinds[eventName];
      charInput.readOnly = true;
      charInput.addEventListener("keydown", e => {
        this.keyBinds[eventName] = e.code;
        charInput.value = e.code;
      }, false);
      div.append(eventName + ": ", charInput);
      container.append(div);
    }
    document.body.prepend(container);
  }
}

export {KeyBinding};
