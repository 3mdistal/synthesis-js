"use strict";
(() => {
  // src/lib/waves.ts
  function polyBlep(t, dt) {
    if (t < dt) {
      t = t / dt;
      return t + t - t * t - 1;
    } else if (t > 1 - dt) {
      t = (t - 1) / dt;
      return t * t + t + t + 1;
    }
    return 0;
  }
  var WaveGenerator = class _WaveGenerator {
    static generate(type, phase, dt) {
      switch (type) {
        case "sine":
          return _WaveGenerator.sine(phase);
        case "square":
          return _WaveGenerator.square(phase, dt);
        case "saw":
          return _WaveGenerator.saw(phase, dt);
        default:
          return 0;
      }
    }
    static sine(phase) {
      return Math.sin(2 * Math.PI * phase);
    }
    static square(phase, dt) {
      let square = phase < 0.5 ? 1 : -1;
      square -= polyBlep(phase, dt);
      square += polyBlep((phase + 0.5) % 1, dt);
      return square * 0.5;
    }
    static saw(phase, dt) {
      let saw = 2 * phase - 1;
      saw -= polyBlep(phase, dt);
      return saw * 0.5;
    }
  };

  // src/lib/synth-processor.ts
  var SimpleSynthProcessor = class extends AudioWorkletProcessor {
    constructor() {
      super();
      this.phase = 0;
      this.currentType = "square";
      this.port.onmessage = (e) => {
        if (e.data.type === "setWaveType") {
          this.currentType = e.data.value;
        }
      };
    }
    static get parameterDescriptors() {
      return [
        {
          name: "frequency",
          defaultValue: 440,
          minValue: 20,
          maxValue: 2e4,
          automationRate: "k-rate"
        }
      ];
    }
    process(_inputs, outputs, parameters) {
      const output = outputs[0];
      const frequency = parameters.frequency[0];
      const dt = frequency / sampleRate;
      for (let channel = 0; channel < output.length; ++channel) {
        const outputChannel = output[channel];
        for (let i = 0; i < outputChannel.length; ++i) {
          outputChannel[i] = WaveGenerator.generate(this.currentType, this.phase, dt);
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
