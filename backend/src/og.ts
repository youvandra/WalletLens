// Dynamic Open Graph share image (1200x630 PNG) for /wrap/:address links.
// Hand-built monochrome SVG (OKX-style black/white) rendered to PNG with resvg.
// Uses system fonts (DejaVu on the server) so no font assets need shipping.
import { Resvg } from "@resvg/resvg-js";
import type { WalletMetrics } from "./types.js";

const W = 1200;
const H = 630;
const FONT = "DejaVu Sans, Arial, Helvetica, sans-serif";
const MONO = "DejaVu Sans Mono, Courier New, monospace";

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

// A stat cell: label above, value below, thin outline. Monochrome.
function statCell(x: number, label: string, value: string): string {
  return `
  <g transform="translate(${x},474)">
    <rect x="0" y="0" width="176" height="96" rx="12" fill="#0d0d0d" stroke="#2a2a2a" stroke-width="1.5"/>
    <text x="20" y="38" font-family="${MONO}" font-size="15" fill="#8a8a8a" letter-spacing="1.5">${label}</text>
    <text x="20" y="76" font-family="${FONT}" font-size="34" font-weight="bold" fill="#ffffff">${value}</text>
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
  const roastLine = esc(truncate(plain(roast || metrics.sarcasticTitle), 68));

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.05"/>
    </pattern>
    <pattern id="blocks" width="64" height="64" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="32" height="32" fill="#ffffff" opacity="0.05"/>
      <rect x="32" y="32" width="32" height="32" fill="#ffffff" opacity="0.05"/>
    </pattern>
  </defs>

  <!-- black stage -->
  <rect width="${W}" height="${H}" fill="#000000"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <!-- corner block motif (OKX) -->
  <rect x="946" y="-64" width="320" height="320" fill="url(#blocks)"/>

  <!-- top row: wrapped badge + brand -->
  <g transform="translate(64,72)">
    <rect x="0" y="0" width="360" height="40" rx="20" fill="#ffffff"/>
    <text x="180" y="27" font-family="${FONT}" font-size="17" font-weight="bold" fill="#000000" text-anchor="middle" letter-spacing="1">YOUR ${year} WALLET WRAPPED</text>
  </g>
  <text x="1136" y="98" font-family="${FONT}" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="end" letter-spacing="1">WALLETLENS</text>

  <!-- headline archetype -->
  <text x="64" y="248" font-family="${FONT}" font-size="88" font-weight="bold" fill="#ffffff" letter-spacing="-2">${archetype}</text>

  <!-- address pill + rarity pill -->
  <g transform="translate(64,286)">
    <rect x="0" y="0" width="404" height="52" rx="26" fill="none" stroke="#3a3a3a" stroke-width="1.5"/>
    <text x="202" y="34" font-family="${MONO}" font-size="22" fill="#e5e5e5" text-anchor="middle">${esc(shortAddr)}</text>
  </g>
  <g transform="translate(488,286)">
    <rect x="0" y="0" width="196" height="52" rx="26" fill="#ffffff"/>
    <text x="98" y="34" font-family="${FONT}" font-size="21" font-weight="bold" fill="#000000" text-anchor="middle">${esc(metrics.rarity)} RANK</text>
  </g>

  <!-- roast line -->
  ${roastLine ? `<text x="64" y="392" font-family="${FONT}" font-size="26" fill="#b5b5b5">&#8220;${roastLine}&#8221;</text>` : ""}

  <!-- stats row -->
  <text x="64" y="436" font-family="${MONO}" font-size="22" fill="#8a8a8a">${metrics.totalTx.toLocaleString("en-US")} txns&#160;&#160;·&#160;&#160;${metrics.swapCount} swaps&#160;&#160;·&#160;&#160;net worth $${esc(metrics.netWorthUsd)}</text>

  ${statCell(64, "DEFI", String(metrics.defiScore))}
  ${statCell(268, "AIRDROP", String(metrics.airdropScore))}
  ${statCell(472, "DEGEN", String(metrics.degenScore))}
  ${statCell(676, "WHALE", String(metrics.whaleometer))}

  <!-- footer meta -->
  <text x="884" y="536" font-family="${MONO}" font-size="18" fill="#6a6a6a">Agent #4938</text>
  <text x="884" y="562" font-family="${MONO}" font-size="18" fill="#6a6a6a">txwrap.my.id · X Layer</text>
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
