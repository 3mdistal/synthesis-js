"use strict";
(() => {
  // src/lib/synth-processor.ts
  var SimpleSynthProcessor = class extends AudioWorkletProcessor {
    constructor() {
      super();
      this.phase = 0;
      this.noteIndex = 0;
      this.isPlaying = false;
      this.envelope = 0;
      this.noteStartTime = 0;
      this.frequencies = [];
      this.attack = 0.1;
      this.decay = 0.3;
      this.port.onmessage = (e) => {
        if (e.data.type === "playSequence") {
          this.frequencies = e.data.frequencies;
          this.attack = e.data.attack;
          this.decay = e.data.decay;
          this.noteIndex = 0;
          this.isPlaying = true;
          this.noteStartTime = this.getCurrentTime();
        }
      };
    }
    getCurrentTime() {
      return currentFrame / sampleRate;
    }
    calculateEnvelope(time) {
      const noteTime = time - this.noteStartTime;
      if (noteTime < this.attack) {
        return noteTime / this.attack;
      } else if (noteTime < this.attack + this.decay) {
        return 1 - (noteTime - this.attack) / this.decay;
      }
      return 0;
    }
    process(inputs, outputs, parameters) {
      const output = outputs[0];
      const currentTime = this.getCurrentTime();
      if (this.isPlaying) {
        this.envelope = this.calculateEnvelope(currentTime);
        if (this.envelope <= 0) {
          this.noteIndex++;
          if (this.noteIndex >= this.frequencies.length) {
            this.isPlaying = false;
            return true;
          }
          this.noteStartTime = currentTime;
          this.phase = 0;
        }
        const frequency = this.frequencies[this.noteIndex];
        for (let channel = 0; channel < output.length; ++channel) {
          const outputChannel = output[channel];
          for (let i = 0; i < outputChannel.length; ++i) {
            outputChannel[i] = Math.sin(2 * Math.PI * frequency * this.phase) * this.envelope;
            this.phase += 1 / sampleRate;
          }
        }
      }
      return true;
    }
  };
  registerProcessor("simple-synth-processor", SimpleSynthProcessor);
})();
