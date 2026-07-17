import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "./theme";

// ---------- stage: black + faint grid + pixel-block corner (OKX motif) ----------
export const Stage: React.FC<{ block?: "tr" | "bl" | "none" }> = ({ block = "tr" }) => {
  const frame = useCurrentFrame();
  const shift = (frame / 8) % 64;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* faint grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.white} 1px, transparent 1px), linear-gradient(90deg, ${C.white} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          opacity: 0.035,
        }}
      />
      {/* pixel-block motif */}
      {block !== "none" ? (
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            ...(block === "tr" ? { top: -120, right: -80 } : { bottom: -120, left: -80 }),
            backgroundImage: `conic-gradient(rgba(255,255,255,0.05) 0 25%, transparent 0 50%, rgba(255,255,255,0.05) 0 75%, transparent 0)`,
            backgroundSize: "64px 64px",
            backgroundPosition: `${shift}px 0`,
            maskImage: "radial-gradient(circle at center, #000 30%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle at center, #000 30%, transparent 72%)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// blur-in reveal — the motion signature
export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; y?: number; style?: React.CSSProperties }> = ({
  children,
  delay = 0,
  y = 24,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 26, stiffness: 82 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [y, 0])}px)`,
        filter: `blur(${interpolate(s, [0, 1], [8, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const H: React.FC<{ children: React.ReactNode; size?: number; delay?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 86,
  delay = 0,
  color = C.white,
  style,
}) => (
  <Reveal delay={delay}>
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.035em",
        lineHeight: 1.05,
        color,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  </Reveal>
);

// monospace eyebrow / label
export const Label: React.FC<{ children: React.ReactNode; delay?: number; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  delay = 0,
  size = 22,
  color = C.sub,
  style,
}) => (
  <Reveal delay={delay} y={14}>
    <div
      style={{
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  </Reveal>
);

export const Sub: React.FC<{ children: React.ReactNode; delay?: number; size?: number; style?: React.CSSProperties }> = ({
  children,
  delay = 0,
  size = 30,
  style,
}) => (
  <Reveal delay={delay} y={16}>
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "-0.01em",
        color: C.sub,
        textAlign: "center",
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </div>
  </Reveal>
);

// flat dark card, thin border, optional magenta glow
export const Card: React.FC<{
  children: React.ReactNode;
  delay?: number;
  width?: number | string;
  pad?: string;
  radius?: number;
  border?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, width, pad = "34px 42px", radius = 20, border = C.line, glow, style }) => (
  <Reveal delay={delay} y={30}>
    <div
      style={{
        width,
        background: C.panel,
        border: `1px solid ${border}`,
        borderRadius: radius,
        padding: pad,
        boxShadow: glow ? `0 0 60px rgba(232,93,200,0.18)` : "0 20px 60px rgba(0,0,0,0.5)",
        ...style,
      }}
    >
      {children}
    </div>
  </Reveal>
);

// pill — solid white or outline
export const Pill: React.FC<{
  children: React.ReactNode;
  delay?: number;
  variant?: "solid" | "outline" | "accent";
  size?: number;
  dot?: string;
}> = ({ children, delay = 0, variant = "outline", size = 25, dot }) => {
  const styles: Record<string, React.CSSProperties> = {
    solid: { background: C.white, color: C.bg, border: "none" },
    outline: { background: "transparent", color: C.white, border: `1px solid ${C.line2}` },
    accent: { background: C.accent, color: C.bg, border: "none" },
  };
  return (
    <Reveal delay={delay} y={14}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: size,
          letterSpacing: "-0.005em",
          borderRadius: 100,
          padding: "12px 26px",
          ...styles[variant],
        }}
      >
        {dot ? <span style={{ width: 9, height: 9, borderRadius: 6, background: dot, boxShadow: `0 0 12px ${dot}` }} /> : null}
        {children}
      </div>
    </Reveal>
  );
};

// key/value row
export const Row: React.FC<{ k: string; v: React.ReactNode; delay?: number; vColor?: string; size?: number; kw?: number }> = ({
  k,
  v,
  delay = 0,
  vColor = C.white,
  size = 26,
  kw = 240,
}) => (
  <Reveal delay={delay} y={12}>
    <div style={{ display: "flex", gap: 24, alignItems: "baseline", padding: "11px 0" }}>
      <span style={{ fontFamily: MONO, fontSize: size - 5, color: C.sub, minWidth: kw, letterSpacing: "0.02em" }}>{k}</span>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: size, letterSpacing: "-0.01em", color: vColor }}>{v}</span>
    </div>
  </Reveal>
);

export const Divider: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <Reveal delay={delay} y={0}>
    <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
  </Reveal>
);
