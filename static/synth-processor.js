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
  var _WaveGenerator = class _WaveGenerator {
    static generate(type, phase, dt, params = {}) {
      switch (type) {
        case "sine":
          return _WaveGenerator.sine(phase);
        case "square":
          return _WaveGenerator.square(phase, dt);
        case "saw":
          return _WaveGenerator.saw(phase, dt);
        case "triangle":
          return _WaveGenerator.triangle(phase);
        case "pulse":
          return _WaveGenerator.pulse(phase, dt, params.pulseWidth ?? 0.5);
        case "noise":
          return _WaveGenerator.noise();
        case "sine-square":
          return _WaveGenerator.sineSquare(phase, params.morph ?? 0.5);
        case "double-sine":
          return _WaveGenerator.doubleSine(phase, params.mix ?? 0.5);
        case "fold-sine":
          return _WaveGenerator.foldSine(phase, params.foldAmount ?? 1);
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
    static triangle(phase) {
      return 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;
    }
    static pulse(phase, dt, pulseWidth) {
      let pulse = phase < pulseWidth ? 1 : -1;
      pulse -= polyBlep(phase, dt);
      pulse += polyBlep((phase + (1 - pulseWidth)) % 1, dt);
      return pulse * 0.5;
    }
    static noise() {
      if (++this.noiseIndex >= 100) {
        this.noiseIndex = 0;
        this.noiseBuffer[Math.floor(Math.random() * this.noiseBuffer.length)] = Math.random() * 2 - 1;
      }
      return this.noiseBuffer[Math.floor(Math.random() * this.noiseBuffer.length)] * 0.5;
    }
    static sineSquare(phase, morph) {
      const sine = Math.sin(2 * Math.PI * phase);
      return Math.sign(sine) * Math.pow(Math.abs(sine), 1 - morph) * 0.5;
    }
    static doubleSine(phase, mix) {
      const fundamental = Math.sin(2 * Math.PI * phase);
      const octave = Math.sin(4 * Math.PI * phase);
      return (fundamental * (1 - mix) + octave * mix) * 0.5;
    }
    static foldSine(phase, foldAmount) {
      const sine = Math.sin(2 * Math.PI * phase);
      const folded = Math.sin(2 * Math.PI * phase * foldAmount);
      return (sine + folded) * 0.25;
    }
  };
  // Store some state for noise generation
  _WaveGenerator.noiseBuffer = new Array(1024).fill(0).map(() => Math.random() * 2 - 1);
  _WaveGenerator.noiseIndex = 0;
  var WaveGenerator = _WaveGenerator;

  // src/lib/synth-processor.ts
  var SimpleSynthProcessor = class extends AudioWorkletProcessor {
    constructor() {
      super();
      this.phase = 0;
      this.currentType = "square";
      this.params = {};
      this.port.onmessage = (e) => {
        if (e.data.type === "setWaveType") {
          this.currentType = e.data.value;
          this.params = e.data.params || {};
        } else if (e.data.type === "setWaveParams") {
          this.params = e.data.params;
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
          outputChannel[i] = WaveGenerator.generate(this.currentType, this.phase, dt, this.params);
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
