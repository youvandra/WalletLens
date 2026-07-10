// Dynamic Open Graph share image (1200x630 PNG) for /wrap/:address links.
// Hand-built neo-brutalist SVG rendered to PNG with resvg. Uses system fonts
// (DejaVu on the server) so no font assets need shipping.
import { Resvg } from "@resvg/resvg-js";
import type { WalletMetrics } from "./types.js";

const W = 1200;
const H = 630;
const FONT = "DejaVu Sans, Arial, Helvetica, sans-serif";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Strip emoji/non-latin so system-font rendering never shows tofu boxes.
function plain(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, "").trim();
}

// SVG <text> does not wrap, so keep the roast line to a single legible row.
function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "..." : s;
}

function scoreChip(x: number, label: string, value: number, color: string): string {
  return `
  <g transform="translate(${x},476)">
    <rect x="6" y="6" width="176" height="92" fill="#0a0a0a"/>
    <rect x="0" y="0" width="176" height="92" fill="#ffffff" stroke="#0a0a0a" stroke-width="4"/>
    <text x="88" y="34" font-family="${FONT}" font-size="17" font-weight="bold" fill="#777777" text-anchor="middle" letter-spacing="2">${label}</text>
    <text x="88" y="76" font-family="${FONT}" font-size="38" font-weight="bold" fill="${color}" text-anchor="middle">${value}</text>
  </g>`;
}

export function buildOgSvg(
  address: string,
  metrics: WalletMetrics,
  // The roast line: an explicit personality roast when we have one, otherwise
  // the deterministic sarcastic title (always present, no AI call needed).
  roast?: string
): string {
  const archetype = esc(plain(metrics.archetype) || "Wallet Wrapped");
  const shortAddr = `${address.slice(0, 10)}...${address.slice(-6)}`;
  const year = new Date().getFullYear();
  const roastLine = esc(truncate(plain(roast || metrics.sarcasticTitle), 64));

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2" fill="#0a0a0a" opacity="0.18"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#EDE7DB"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- card + hard shadow -->
  <rect x="76" y="66" width="1064" height="514" fill="#0a0a0a"/>
  <rect x="56" y="46" width="1064" height="514" fill="#FFD400" stroke="#0a0a0a" stroke-width="7"/>

  <!-- deco rings -->
  <circle cx="1080" cy="90" r="130" fill="none" stroke="#0a0a0a" stroke-width="22" opacity="0.08"/>
  <circle cx="120" cy="540" r="90" fill="none" stroke="#0a0a0a" stroke-width="16" opacity="0.08"/>

  <!-- badge -->
  <g transform="translate(104,96) rotate(-2)">
    <rect width="330" height="46" fill="#0a0a0a"/>
    <text x="165" y="31" font-family="${FONT}" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="3">YOUR ${year} WALLET WRAPPED</text>
  </g>

  <!-- headline -->
  <text x="104" y="248" font-family="${FONT}" font-size="86" font-weight="bold" fill="#0a0a0a">${archetype}</text>

  <!-- address pill -->
  <g transform="translate(104,290)">
    <rect x="5" y="5" width="420" height="54" fill="#0a0a0a"/>
    <rect x="0" y="0" width="420" height="54" fill="#ffffff" stroke="#0a0a0a" stroke-width="4"/>
    <text x="210" y="36" font-family="DejaVu Sans Mono, Courier New, monospace" font-size="24" fill="#0a0a0a" text-anchor="middle">${esc(shortAddr)}</text>
  </g>

  <!-- rarity -->
  <g transform="translate(560,290)">
    <rect x="5" y="5" width="200" height="54" fill="#0a0a0a"/>
    <rect x="0" y="0" width="200" height="54" fill="#FF2D8B" stroke="#0a0a0a" stroke-width="4"/>
    <text x="100" y="36" font-family="${FONT}" font-size="24" font-weight="bold" fill="#0a0a0a" text-anchor="middle">${esc(metrics.rarity)} RANK</text>
  </g>

  <!-- roast line -->
  ${roastLine ? `<text x="104" y="378" font-family="${FONT}" font-size="27" font-weight="bold" fill="#0a0a0a">&#8220;${roastLine}&#8221;</text>` : ""}

  <!-- stats row -->
  <text x="104" y="420" font-family="${FONT}" font-size="30" font-weight="bold" fill="#0a0a0a">${metrics.totalTx.toLocaleString("en-US")} txns&#160;&#160;·&#160;&#160;${metrics.swapCount} swaps&#160;&#160;·&#160;&#160;net worth $${esc(metrics.netWorthUsd)}</text>

  ${scoreChip(104, "DEFI", metrics.defiScore, "#2B4BFF")}
  ${scoreChip(312, "AIRDROP", metrics.airdropScore, "#8B3DFF")}
  ${scoreChip(520, "DEGEN", metrics.degenScore, "#DB2777")}
  ${scoreChip(728, "WHALE", metrics.whaleometer, "#C68A00")}

  <!-- brand -->
  <text x="1088" y="132" font-family="${FONT}" font-size="26" font-weight="bold" fill="#0a0a0a" text-anchor="end">TXWRAP.MY.ID</text>
</svg>`;
}

export function renderOgPng(address: string, metrics: WalletMetrics, roast?: string): Buffer {
  const svg = buildOgSvg(address, metrics, roast);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: { loadSystemFonts: true },
  });
  return resvg.render().asPng();
}
