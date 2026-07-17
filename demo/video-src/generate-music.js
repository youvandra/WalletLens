// Synthesizes an ~88s warm ambient/minimal backing track — Apple-keynote mood.
// Soft electric-piano chords, airy pad, sub bass, gentle percussion entering
// mid-track. Pure Node, 16-bit stereo WAV.
const fs = require("fs");
const path = require("path");

const SR = 44100;
const BPM = 92;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const BARS = 34; // ~88.7s
const DUR = BARS * BAR;
const N = Math.ceil(DUR * SR);
const L = new Float64Array(N);
const R = new Float64Array(N);

const A4 = 440;
function freq(s) { return A4 * Math.pow(2, s / 12); }
const NOTE = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function n(name, oct) { return freq(NOTE[name] + (oct - 4) * 12); }

// warm, hopeful: Cmaj7 — Am7 — Fmaj7 — G(add9)
const PROG = [
  [n("C", 3), n("E", 3), n("G", 3), n("B", 3)],
  [n("A", 2), n("C", 3), n("E", 3), n("G", 3)],
  [n("F", 2), n("A", 2), n("C", 3), n("E", 3)],
  [n("G", 2), n("B", 2), n("D", 3), n("A", 3)],
];
const BASS = [n("C", 1), n("A", 0), n("F", 0), n("G", 0)];

function tone(start, dur, f, amp, { shape = "sine", attack = 0.02, decay = dur, pan = 0, detune = 0, lp = 1 } = {}) {
  const s0 = Math.floor(start * SR);
  const s1 = Math.min(N, Math.floor((start + dur) * SR));
  let phase = 0, phase2 = 0;
  const dp = (f * (1 + detune)) / SR;
  const dp2 = (f * (1 - detune)) / SR;
  let lpState = 0;
  const gL = amp * (1 - Math.max(0, pan));
  const gR = amp * (1 + Math.min(0, pan));
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    let env = t < attack ? t / attack : Math.exp(-(t - attack) / (decay * 0.5));
    let v;
    if (shape === "saw") v = (phase % 1) * 2 - 1 + ((phase2 % 1) * 2 - 1);
    else if (shape === "tri") { const p = phase % 1; v = (p < 0.5 ? p * 4 - 1 : 3 - p * 4) * 1.4; }
    else if (shape === "ep") {
      // soft e-piano: sine + quiet 2nd/3rd partials, slight tremble
      v = Math.sin(phase * 2 * Math.PI) + 0.35 * Math.sin(phase * 4 * Math.PI) + 0.12 * Math.sin(phase * 6 * Math.PI);
    } else v = Math.sin(phase * 2 * Math.PI) * 1.3;
    phase += dp; phase2 += dp2;
    lpState += lp * (v - lpState);
    const out = lpState * env;
    L[i] += out * gL;
    R[i] += out * gR;
  }
}
let seed = 13579;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x40000000 - 1; }
function softKick(start, amp = 1) {
  const s0 = Math.floor(start * SR);
  const s1 = Math.min(N, s0 + Math.floor(0.16 * SR));
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const f = 80 * Math.exp(-t * 20) + 38;
    const env = Math.exp(-t * 20);
    const v = Math.sin(2 * Math.PI * f * t) * env * 0.55 * amp;
    L[i] += v; R[i] += v;
  }
}
function rim(start, amp = 1) {
  const s0 = Math.floor(start * SR);
  const s1 = Math.min(N, s0 + Math.floor(0.05 * SR));
  let hp = 0, prev = 0;
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const env = Math.exp(-t * 90);
    const nz = rnd();
    hp = 0.92 * (hp + nz - prev); prev = nz;
    const v = (hp * 0.4 + Math.sin(2 * Math.PI * 810 * t) * 0.25) * env * 0.3 * amp;
    L[i] += v * 0.85; R[i] += v;
  }
}
function shaker(start, amp = 1) {
  const s0 = Math.floor(start * SR);
  const s1 = Math.min(N, s0 + Math.floor(0.05 * SR));
  let hp = 0, prev = 0;
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const env = Math.exp(-t * 60);
    const nz = rnd();
    hp = 0.96 * (hp + nz - prev); prev = nz;
    const v = hp * env * 0.085 * amp;
    L[i] += v * (i % 2 ? 1 : 0.6); R[i] += v * (i % 2 ? 0.6 : 1);
  }
}

const t0 = (bar) => bar * BAR;

for (let bar = 0; bar < BARS; bar++) {
  const chord = PROG[bar % 4];
  const bass = BASS[bar % 4];
  const bt = t0(bar);
  const withDrums = bar >= 10 && bar < BARS - 3;
  const lift = bar >= 22 && bar < 30 ? 1.15 : 1;

  // airy pad — very slow attack, wide detune
  for (const f of chord) {
    tone(bt, BAR * 1.1, f * 2, 0.02 * lift, {
      shape: "saw", attack: 1.2, decay: BAR * 1.1, detune: 0.005, lp: 0.045,
      pan: f > 200 ? 0.35 : -0.35,
    });
  }

  // e-piano chord — two gentle hits per bar (beat 1 and the 'and' of 3)
  for (const [hit, vel] of [[0, 1], [2.5, 0.7]]) {
    for (let ci = 0; ci < chord.length; ci++) {
      tone(bt + hit * BEAT + ci * 0.012, BEAT * 2.2, chord[ci] * 2, 0.052 * vel * lift, {
        shape: "ep", attack: 0.006, decay: 1.1, lp: 0.35, pan: ci % 2 ? 0.25 : -0.25,
      });
    }
  }

  // sub bass — one warm note per bar, small pickup
  tone(bt, BAR * 0.92, bass * 2, 0.14, { shape: "sine", attack: 0.03, decay: BAR, lp: 0.8 });
  if (bar % 2 === 1) tone(bt + 3.5 * BEAT, BEAT * 0.45, bass * 3, 0.07, { shape: "sine", attack: 0.01, decay: 0.3, lp: 0.8 });

  // sparse melody from bar 6 — pentatonic, one or two notes a bar
  if (bar >= 6) {
    const mel = [n("E", 5), n("D", 5), n("C", 5), n("G", 4), n("A", 4), n("E", 5), n("G", 5), n("D", 5)];
    const f = mel[bar % 8];
    tone(bt + (bar % 2 ? 1.5 : 0.5) * BEAT, BEAT * 1.6, f, 0.028 * lift, {
      shape: "tri", attack: 0.02, decay: 0.9, lp: 0.3, pan: bar % 2 ? 0.3 : -0.3,
    });
  }

  // gentle groove from bar 10
  if (withDrums) {
    softKick(bt, 0.9); softKick(bt + 2.5 * BEAT, 0.55);
    rim(bt + BEAT, 0.8); rim(bt + 3 * BEAT, 0.8);
    for (let e = 0; e < 8; e++) shaker(bt + e * BEAT * 0.5, e % 2 ? 0.6 : 1);
  }
}

const fadeIn = 1.2 * SR, fadeOut = 3 * SR;
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  let g = 1;
  if (i < fadeIn) g = i / fadeIn;
  if (i > N - fadeOut) g = (N - i) / fadeOut;
  const l = Math.tanh(L[i] * 1.15) * 0.85 * g;
  const r = Math.tanh(R[i] * 1.15) * 0.85 * g;
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l * 32767))), i * 4);
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r * 32767))), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVE", 8);
header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22); header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(path.join(__dirname, "public", "music.wav"), Buffer.concat([header, pcm]));
console.log("wrote music.wav", (pcm.length / SR / 4).toFixed(1) + "s");
