import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, MONO } from "./theme";
import { Card, Divider, H, Label, Pill, Reveal, Row, Stage, Sub } from "./ui";

const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...style }}>{children}</AbsoluteFill>
);

// ============================== 1. HOOK (10s / 300f) ==============================
export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const swap = 178;
  return (
    <AbsoluteFill>
      <Stage block="tr" />
      {frame < swap ? (
        <Center>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <H size={62} delay={8} color={C.sub} style={{ fontWeight: 500 }}>
              Your agent is about to send funds to
            </H>
            <Reveal delay={46}>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 44,
                  color: C.white,
                  border: `1px solid ${C.line2}`,
                  borderRadius: 100,
                  padding: "18px 44px",
                }}
              >
                0x69c236e0…b869df
              </div>
            </Reveal>
            <H size={84} delay={96}>
              Who is that?
            </H>
          </div>
        </Center>
      ) : (
        <Center>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <H size={150} delay={swap} style={{ letterSpacing: "-0.05em" }}>
              WalletLens
            </H>
            <Sub delay={swap + 24} size={33}>
              On-chain wallet intelligence for agents.
            </Sub>
            <div style={{ marginTop: 24 }}>
              <Pill delay={swap + 50} dot={C.accent} size={24}>
                MCP service on X Layer · Agent #4938
              </Pill>
            </div>
          </div>
        </Center>
      )}
    </AbsoluteFill>
  );
};

// ============================== 2. SCREEN (14s / 420f) ==============================
export const SceneScreen: React.FC = () => {
  return (
    <AbsoluteFill>
      <Stage block="tr" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 96 }}>
        <Label delay={8}>One call</Label>
        <div style={{ marginTop: 22 }}>
          <H size={78}>Screen before you send.</H>
        </div>
        <div style={{ marginTop: 16 }}>
          <Sub delay={26}>A verdict your agent can justify — not just repeat.</Sub>
        </div>
      </AbsoluteFill>

      <Center style={{ paddingTop: 150 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <Reveal delay={50} y={14}>
            <div style={{ fontFamily: MONO, fontSize: 23, color: C.dim, letterSpacing: "0.04em" }}>
              screen_wallet · 0x69c236e0…b869df
            </div>
          </Reveal>
          <Card delay={66} width={900} pad="16px 46px">
            <Row delay={92} k="recommendation" v={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 12, height: 12, borderRadius: 7, background: C.accent, boxShadow: `0 0 16px ${C.accent}` }} />
                Caution
              </span>
            } size={30} />
            <Divider delay={112} />
            <Row delay={122} k="reason" v="Dormant — no activity for 126 days" vColor={C.sub} />
            <Divider delay={140} />
            <Row delay={150} k="confidence" v="0.85 — capped, never certainty" vColor={C.sub} />
            <Divider delay={168} />
            <Row delay={178} k="evidence" v="250 of 3,552,345 transactions analyzed" vColor={C.sub} />
          </Card>
          <div style={{ marginTop: 8 }}>
            <Pill delay={230} size={22}>
              Every flag ships the number behind it — nothing on faith
            </Pill>
          </div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ============================== 3. CIRCLE (16s / 480f) ==============================
const NODES = [
  { label: "0x3fb5…f58d", tag: "funder · blocklisted", bad: true, x: 420, y: 430 },
  { label: "0x81ba…351d", tag: "low", bad: false, x: 700, y: 350 },
  { label: "0x1b00…2b0b", tag: "medium", bad: false, x: 990, y: 330 },
  { label: "0x5a2e…d4f6", tag: "medium", bad: false, x: 1280, y: 360 },
  { label: "0xde96…bcbd", tag: "medium", bad: false, x: 1500, y: 450 },
];

export const SceneCircle: React.FC = () => {
  const frame = useCurrentFrame();
  const cx = 962;
  const cy = 762;
  return (
    <AbsoluteFill>
      <Stage block="none" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 92 }}>
        <Label delay={8}>expand_risk</Label>
        <div style={{ marginTop: 22 }}>
          <H size={74}>A clean wallet can keep dirty company.</H>
        </div>
        <div style={{ marginTop: 16 }}>
          <Sub delay={24}>Screen the whole counterparty circle — in one call.</Sub>
        </div>
      </AbsoluteFill>

      {/* edges */}
      <AbsoluteFill>
        <svg width="100%" height="100%" viewBox="0 0 1920 1080">
          {NODES.map((nd, i) => {
            const p = interpolate(frame - (80 + i * 14), [0, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const tx = nd.x + 105;
            const ty = nd.y + 52;
            const dist = Math.hypot(tx - cx, ty - cy);
            const short = Math.max(0, (dist - 112) / dist);
            const ex = cx + (tx - cx) * short;
            const ey = cy + (ty - cy) * short;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + (ex - cx) * p}
                y2={cy + (ey - cy) * p}
                stroke={nd.bad ? C.accent : "rgba(255,255,255,0.14)"}
                strokeWidth={nd.bad ? 2.5 : 1.4}
              />
            );
          })}
        </svg>
      </AbsoluteFill>

      {/* center node */}
      <div style={{ position: "absolute", left: cx - 150, top: cy - 56 }}>
        <Card delay={54} pad="18px 30px" radius={16} width={300}>
          <div style={{ fontFamily: MONO, fontSize: 25, color: C.white }}>0x69c2…69df</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 20, color: C.sub, marginTop: 5 }}>
            target · risk medium
          </div>
        </Card>
      </div>

      {/* neighbors */}
      {NODES.map((nd, i) => (
        <div key={i} style={{ position: "absolute", left: nd.x, top: nd.y }}>
          <Card
            delay={92 + i * 14}
            pad="14px 24px"
            radius={14}
            border={nd.bad ? C.accent : C.line}
            glow={nd.bad}
          >
            <div style={{ fontFamily: MONO, fontSize: 21, color: C.white }}>{nd.label}</div>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 17,
                color: nd.bad ? C.accent : C.sub,
                marginTop: 4,
              }}
            >
              {nd.tag}
            </div>
          </Card>
        </div>
      ))}

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 76 }}>
        <div style={{ display: "flex", gap: 20 }}>
          <Pill delay={230} variant="accent" size={27}>
            Neighborhood risk: high
          </Pill>
          <Pill delay={260} size={27}>
            The wallet passed. Its funder didn&apos;t.
          </Pill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================== 4. PROOF (12s / 360f) ==============================
export const SceneProof: React.FC = () => {
  return (
    <AbsoluteFill>
      <Stage block="bl" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 96 }}>
        <Label delay={8}>Signed results</Label>
        <div style={{ marginTop: 22 }}>
          <H size={80}>Proof, not promises.</H>
        </div>
        <div style={{ marginTop: 16 }}>
          <Sub delay={22}>Anyone can verify a screen — even another agent.</Sub>
        </div>
      </AbsoluteFill>

      <Center style={{ paddingTop: 120 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
          <Card delay={50} width={900} pad="16px 46px">
            <Row delay={72} k="scheme" v="EIP-191 · recoverable signature" vColor={C.sub} />
            <Divider delay={90} />
            <Row delay={100} k="signer" v="0x8b2e…6692 — published, never holds funds" vColor={C.sub} />
            <Divider delay={118} />
            <Row delay={128} k="signature" v={<span style={{ fontFamily: MONO, fontSize: 24 }}>0x6f094cc8…40651b</span>} />
          </Card>
          <Pill delay={185} dot={C.green} size={28}>
            POST /attestation/verify → valid: true
          </Pill>
          <Sub delay={235} size={26} style={{ maxWidth: 840 }}>
            Due diligence becomes portable — hand it to another agent, or a dispute arbiter.
          </Sub>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ============================== 5. x402 (12s / 360f) — CORRECTED PRICING ==============================
export const SceneX402: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage block="tr" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 96 }}>
        <Label delay={8}>Pay per call · x402 v2</Label>
        <div style={{ marginTop: 22 }}>
          <H size={82}>Discovery is free.</H>
        </div>
        <div style={{ marginTop: 6 }}>
          <H size={82} delay={34} color={C.accent}>
            Every result: 0.05 USDT0.
          </H>
        </div>
      </AbsoluteFill>

      <Center style={{ paddingTop: 150 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
          <div style={{ display: "flex", gap: 18 }}>
            <Pill delay={90} size={24}>
              initialize · tools/list · get_quota — free
            </Pill>
            <Pill delay={112} variant="accent" size={24}>
              HTTP 402 → settled on-chain in USDT0
            </Pill>
          </div>
          <Sub delay={150} size={29} style={{ maxWidth: 1020 }}>
            Settled by the OKX facilitator on X Layer. The server holds no private key and pays no gas —
            and one call can screen twenty wallets.
          </Sub>
          {frame > 210 ? (
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <Pill delay={210} size={23}>No key held</Pill>
              <Pill delay={228} size={23}>No gas paid</Pill>
            </div>
          ) : null}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ============================== 6. HUMAN (10s / 300f) ==============================
export const SceneHuman: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage block="bl" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 92 }}>
        <Label delay={8}>Bonus layer</Label>
        <div style={{ marginTop: 22 }}>
          <H size={74}>And for the human behind the agent —</H>
        </div>
        <div style={{ marginTop: 16 }}>
          <Sub delay={20}>a shareable Wrapped, roast included.</Sub>
        </div>
      </AbsoluteFill>
      <Center style={{ paddingTop: 118 }}>
        <Reveal delay={55} y={46}>
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 40px 110px rgba(0,0,0,0.6)",
            }}
          >
            <Img src={staticFile("og-card.png")} style={{ width: 980, display: "block" }} />
          </div>
        </Reveal>
      </Center>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 56 }}>
        <Sub delay={150} size={26} style={{ maxWidth: 1150, fontStyle: "italic", color: C.dim }}>
          “3.5 million transactions but your net worth is $0.00 — that&apos;s not a wallet, that&apos;s a spam factory.”
        </Sub>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================== 7. OUTRO (11s / 330f) ==============================
export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage block="tr" />
      <Center>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <H size={152} delay={6} style={{ letterSpacing: "-0.05em" }}>
            WalletLens
          </H>
          <Sub delay={34} size={32}>
            Who is this wallet? Now your agent knows.
          </Sub>
          <div style={{ display: "flex", gap: 18, marginTop: 30 }}>
            <Pill delay={68} dot={C.accent} size={27}>
              Agent #4938
            </Pill>
            <Pill delay={86} size={27}>txwrap.my.id/mcp</Pill>
            <Pill delay={104} size={27}>11 tools · X Layer</Pill>
          </div>
          <Reveal delay={150} y={14}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34 }}>
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 27, color: C.sub }}>
                Built for the OKX.AI Genesis Hackathon
              </span>
              <Img
                src={staticFile("okx-logo.png")}
                style={{
                  height: 34,
                  filter: "invert(1)",
                  opacity: interpolate(frame - 150, [0, 14], [0, 0.92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              />
            </div>
          </Reveal>
        </div>
      </Center>
    </AbsoluteFill>
  );
};
