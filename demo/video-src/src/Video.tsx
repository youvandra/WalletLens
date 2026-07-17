import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCircle, SceneHook, SceneHuman, SceneOutro, SceneProof, SceneScreen, SceneX402 } from "./scenes";

// scene lengths in frames @30fps — total 2550 (85s)
const TIMELINE = [
  { name: "hook", from: 0, dur: 300, S: SceneHook },
  { name: "screen", from: 300, dur: 420, S: SceneScreen },
  { name: "circle", from: 720, dur: 480, S: SceneCircle },
  { name: "proof", from: 1200, dur: 360, S: SceneProof },
  { name: "x402", from: 1560, dur: 360, S: SceneX402 },
  { name: "human", from: 1920, dur: 300, S: SceneHuman },
  { name: "outro", from: 2220, dur: 330, S: SceneOutro },
];

const Fade: React.FC<{ children: React.ReactNode; dur: number }> = ({ children, dur }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 16, dur - 14, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Video: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      {TIMELINE.map((t) => (
        <Sequence key={t.name} from={t.from} durationInFrames={t.dur}>
          <Fade dur={t.dur}>
            <t.S />
          </Fade>
        </Sequence>
      ))}
      <Audio
        src={staticFile("music.wav")}
        volume={(f) =>
          interpolate(f, [0, 40, durationInFrames - 100, durationInFrames - 12], [0, 0.42, 0.42, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
