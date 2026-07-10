// Live OKB/USD price for the USD figures in analyzer.ts (balance, net worth,
// gas burned, whale threshold). Pulled from OKX's public market ticker — no
// auth, no signing. Cached in-process with a short TTL so a burst of profiles
// hits the upstream once, and falls back to a static estimate when the ticker
// is unreachable so a price outage never fails a whole profile.
import https from "https";

const TICKER_URL =
  "https://www.okx.com/api/v5/market/ticker?instId=OKB-USDT";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FALLBACK_PRICE = 50; // last-resort estimate if the ticker is unreachable

let cachedPrice = FALLBACK_PRICE;
let cachedAt = 0;
let inflight: Promise<number> | null = null;

function fetchTicker(): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = https.get(TICKER_URL, { timeout: 4000 }, (res) => {
      let body = "";
      res.on("data", (chunk: Buffer) => (body += chunk.toString()));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          const last = Number(json?.data?.[0]?.last);
          if (Number.isFinite(last) && last > 0) resolve(last);
          else reject(new Error("OKB ticker returned no usable price"));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("timeout", () => req.destroy(new Error("OKB ticker timed out")));
    req.on("error", reject);
  });
}

// Current OKB price in USD. Serves the cached value while fresh, refreshes at
// most one request at a time, and never throws — on failure it keeps serving
// the last good (or fallback) price.
export async function getOkbPriceUsd(): Promise<number> {
  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) return cachedPrice;
  if (inflight) return inflight;

  inflight = fetchTicker()
    .then((price) => {
      cachedPrice = price;
      cachedAt = Date.now();
      return price;
    })
    .catch((err) => {
      console.error("price: OKB ticker fetch failed, using last known:", err);
      // Extend the cache window so we don't hammer a failing upstream.
      cachedAt = Date.now();
      return cachedPrice;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
