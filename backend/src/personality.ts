import { config } from "./config.js";
import type { WalletMetrics, WalletPersonality } from "./types.js";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatChoice {
  message: {
    content: string;
  };
}

interface ChatResponse {
  choices: ChatChoice[];
}

const SYSTEM_PROMPT = `You are a sarcastic, hilarious on-chain wallet analyst.
Given wallet metrics in JSON, generate a wallet personality summary.
Respond ONLY with valid JSON, no markdown or extra text.

Format:
{
  "title": "emoji + Archetype Name",
  "roast": "One sharp funny sentence roasting their on-chain behavior",
  "funFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "verdict": "One concluding sentence"
}`;

function buildMetricsPrompt(metrics: WalletMetrics): string {
  const emptyNote =
    metrics.archetype === "The Ghost"
      ? "\n\nNOTE: this wallet has ZERO transactions. Roast its total emptiness. " +
        "Do not invent tokens, trades, or protocols it never touched."
      : "";

  return emptyNote + JSON.stringify(
    {
      totalTransactions: metrics.totalTx,
      tokenSymbol: metrics.tokenSymbol,
      balance: metrics.balanceEth,
      gasBurned: metrics.gasBurnedEth,
      swapCount: metrics.swapCount,
      activityBreakdown: metrics.activityBreakdown,
      portfolio: {
        tokens: metrics.portfolio.tokenCount,
        totalValueUsd: metrics.portfolio.totalValueUsd,
        topHoldings: metrics.portfolio.topHoldings.map((h) => `${h.symbol} $${h.valueUsd}`),
        nfts: metrics.portfolio.nftCount,
      },
      tokenActivity: metrics.tokenActivity,
      crossChainTransfers: metrics.crossChain.total,
      netWorthUsd: metrics.netWorthUsd,
      defiScore: metrics.defiScore,
      airdropScore: metrics.airdropScore,
      degenScore: metrics.degenScore,
      rarityTier: metrics.rarity,
      diamondHandsDays: metrics.diamondHandsDays,
      uniqueProtocols: metrics.uniqueProtocols,
      topFrenemy: metrics.topFrenemyLabel,
      peakTradingHour: metrics.peakHour,
      activityStreak: metrics.activityStreak,
      archetype: metrics.archetype,
      sarcasticTitle: metrics.sarcasticTitle,
    },
    null,
    2
  );
}

function getFallbackPersonality(metrics: WalletMetrics): WalletPersonality {
  // An untouched wallet has no numbers to riff on, so the generic template
  // ("0 transactions and 0 gas") reads like a bug rather than a joke.
  if (metrics.archetype === "The Ghost") {
    return {
      title: "👻 The Ghost",
      roast:
        "This wallet has never done anything. Not one transaction. It exists the way an unopened envelope exists.",
      funFacts: [
        "Zero transactions. Zero gas. Zero regrets, presumably.",
        "It has never approved a contract, which makes it the safest wallet we have ever screened.",
        "Technically it has a perfect record. Technically.",
      ],
      verdict: "A blank slate. Go make some mistakes on-chain like everyone else.",
    };
  }

  return {
    title: metrics.archetype,
    roast: `You've made ${metrics.totalTx} transactions and burned ${metrics.gasBurnedEth} ${metrics.tokenSymbol} on gas. That's certainly a choice.`,
    funFacts: [
      `Your DeFi score is ${metrics.defiScore}/100 — ${
        metrics.defiScore > 50 ? "not bad" : "room for improvement"
      }`,
      `You've interacted with ${metrics.uniqueProtocols} unique protocols`,
      `Your peak trading hour is ${metrics.peakHour}:00 UTC — ${
        metrics.peakHour >= 0 && metrics.peakHour < 6
          ? "you should probably sleep"
          : "respectable hours"
      }`,
    ],
    verdict: `Keep building, degen.`,
  };
}

export async function generatePersonality(
  metrics: WalletMetrics
): Promise<WalletPersonality> {
  if (!config.sumopodApiKey) {
    return getFallbackPersonality(metrics);
  }

  try {
    const body: ChatRequest = {
      model: "deepseek-v4-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildMetricsPrompt(metrics) },
      ],
      temperature: 0.8,
      // deepseek-v4-flash is a reasoning model: reasoning tokens count against
      // max_tokens, so a small cap starves the actual content to empty.
      max_tokens: 2500,
    };

    const res = await fetch(`${config.sumopodBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.sumopodApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Sumopod API error: ${res.status}`);
    }

    const data = (await res.json()) as ChatResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from Sumopod API");
    }

    // Models sometimes wrap JSON in markdown fences despite instructions.
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned) as WalletPersonality;

    return {
      title: parsed.title || metrics.archetype,
      roast: parsed.roast || getFallbackPersonality(metrics).roast,
      funFacts: Array.isArray(parsed.funFacts)
        ? parsed.funFacts.slice(0, 3)
        : getFallbackPersonality(metrics).funFacts,
      verdict: parsed.verdict || getFallbackPersonality(metrics).verdict,
    };
  } catch (err) {
    console.error("Personality generation failed, using fallback:", err);
    return getFallbackPersonality(metrics);
  }
}
