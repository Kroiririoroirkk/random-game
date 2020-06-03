"use strict";

import {MIN_SAMPLE_RATE, MAX_SAMPLE_RATE} from "./config.mjs";

class SampleRateSlider {
  constructor(game) {
    this.startX = -250;
    this.endX = -50;
    this.y = -50;
    this.active = false;
    this.registerKeyListeners(game);
  }

  getSliderX(game) {
    let p =
      (game.sampleRate - MIN_SAMPLE_RATE)
      / (MAX_SAMPLE_RATE - MIN_SAMPLE_RATE);
    return p * (this.endX - this.startX) + this.startX;
  }

  setSliderX(game, x) {
    let p =
      (x - (game.getScaledWidth() + this.startX))
      / (this.endX - this.startX);
    game.sampleRate = p * (MAX_SAMPLE_RATE - MIN_SAMPLE_RATE) + MIN_SAMPLE_RATE;
  }

  registerKeyListeners(game) {
    document.addEventListener("mousedown", e => {
      const width = game.getScaledWidth(),
            height = game.getScaledHeight();
      if (e.clientX >= width + this.startX
          && e.clientX <= width + this.endX
          && e.clientY >= height + this.y - 10
          && e.clientY <= height + this.y + 10) {
        this.active = true;
      }
    }, false);
    document.addEventListener("mousemove", e => {
      if (this.active) {
        let sliderX = e.clientX;
        const width = game.getScaledWidth();
        if (sliderX < width + this.startX) {sliderX = width + this.startX;}
        if (sliderX > width + this.endX) {sliderX = width + this.endX;}
        this.setSliderX(game, sliderX);
      }
    }, false);
    document.addEventListener("mouseup", e => {this.active = false;}, false);
  }

  render(game) {
    const ctx = game.canvasCtx,
          width = game.getScaledWidth(),
          renderStartX = width + this.startX,
          renderEndX = width + this.endX,
          renderX = width + this.getSliderX(game),
          renderY = game.getScaledHeight() + this.y;
    ctx.strokeStyle = "rgb(100, 0, 0)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(renderStartX, renderY);
    ctx.lineTo(renderEndX, renderY);
    ctx.stroke();

    if (this.active) {
      ctx.fillStyle = "rgb(200, 0, 200)";
    } else {
      ctx.fillStyle = "rgb(150, 0, 150)";
    }
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(renderX - 10, renderY - 10, 20, 20);
    ctx.fill();
    ctx.stroke();
  }
}

export {SampleRateSlider};
