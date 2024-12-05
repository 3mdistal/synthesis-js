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
      this.currentGain = 0.5;
      this.targetGain = 0.5;
      this.port.onmessage = (e) => {
        if (e.data.type === "setFrequency") {
          console.log("Received frequency:", e.data.value);
          this.targetFrequency = e.data.value;
        } else if (e.data.type === "setOscType") {
          this.type = e.data.value;
        } else if (e.data.type === "setGain") {
          console.log("Received gain:", e.data.value);
          this.targetGain = e.data.value;
        }
      };
    }
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
      this.currentGain += (this.targetGain - this.currentGain) * this.smoothingFactor;
      const dt = this.frequency / sampleRate;
      for (let channel = 0; channel < output.length; ++channel) {
        const outputChannel = output[channel];
        for (let i = 0; i < outputChannel.length; ++i) {
          const t = this.phase;
          let sample;
          if (this.type === "sine") {
            sample = Math.sin(2 * Math.PI * t);
          } else {
            let square = t < 0.5 ? 1 : -1;
            square -= this.polyBlep(t, dt);
            square += this.polyBlep((t + 0.5) % 1, dt);
            sample = square * 0.5;
          }
          outputChannel[i] = sample * this.currentGain;
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
