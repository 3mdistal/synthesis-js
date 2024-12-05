"use strict";
(() => {
  // src/lib/synth-processor.ts
  var SimpleSynthProcessor = class extends AudioWorkletProcessor {
    constructor() {
      super();
      this.frequency = 440;
      this.targetFrequency = 440;
      this.phase = 0;
      this.type = "square";
      this.smoothingFactor = 0.05;
      this.port.onmessage = (e) => {
        if (e.data.type === "setFrequency") {
          console.log("Received frequency:", e.data.value);
          this.targetFrequency = e.data.value;
        } else if (e.data.type === "setOscType") {
          this.type = e.data.value;
        }
      };
    }
    // PolyBLEP anti-aliasing for square wave
    polyBlep(t, dt) {
      if (t < dt) {
        t = t / dt;
        return t + t - t * t - 1;
      } else if (t > 1 - dt) {
        t = (t - 1) / dt;
        return t * t + t + t + 1;
      }
      return 0;
    }
    process(_inputs, outputs) {
      const output = outputs[0];
      this.frequency += (this.targetFrequency - this.frequency) * this.smoothingFactor;
      const dt = this.frequency / sampleRate;
      for (let channel = 0; channel < output.length; ++channel) {
        const outputChannel = output[channel];
        for (let i = 0; i < outputChannel.length; ++i) {
          const t = this.phase;
          if (this.type === "sine") {
            outputChannel[i] = Math.sin(2 * Math.PI * t);
          } else {
            let square = t < 0.5 ? 1 : -1;
            square -= this.polyBlep(t, dt);
            square += this.polyBlep((t + 0.5) % 1, dt);
            outputChannel[i] = square * 0.5;
          }
          this.phase += dt;
          if (this.phase >= 1) {
            this.phase -= 1;
          }
        }
      }
      return true;
    }
  };
  registerProcessor("simple-synth-processor", SimpleSynthProcessor);
})();
