"use strict";

class KeyBinding {
  constructor() {
    this.pressedKeys = new Set();
    this.keyBinds = {};
    this.registerKeyListeners();
  }

  registerKeyListeners() {
    addEventListener("keydown", e => this.pressedKeys.add(e.code), false);
    addEventListener("keyup", e => this.pressedKeys.delete(e.code), false);
  }

  addKeyBind(eventName, defaultKey) {
    this.keyBinds[eventName] = defaultKey;
  }

  checkIfPressed(eventName) {
    return this.pressedKeys.has(this.keyBinds[eventName]);
  }

  consume(eventName) {
    this.pressedKeys.delete(this.keyBinds[eventName]);
  }

  createPage() {

  }

  deletePage() {

  }
}

export {KeyBinding};
