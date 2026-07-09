# TxWrap — Project Plan

## Overview
TxWrap = "Spotify Wrapped" untuk wallet onchain. Input wallet address → output interactive slideshow + AI-generated wallet personality.

## Tech Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Data Source**: OKLink API (X Layer onchain)
- **AI**: opencode Zen API (`deepseek-v4-flash-free`)
- **Slideshow**: Vanilla HTML/CSS/JS + html2canvas (save as image)
- **Payment**: OKX x402 SDK

## Chain Support
- **Primary**: X Layer (Chain ID 196)
- **Future**: Ethereum, Base, Polygon, Arbitrum, BSC

---

## Architecture

```
Client (Agent/User)
     │
     ▼
POST /api/txwrap { address, chainId }
     │
     ▼
┌─────────────────────────────┐
│ 1. Fetcher                  │
│    - OKLink API             │
│    - address_profile        │
│    - address_tx_history     │
│    - token_holdings         │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 2. Analyzer (Metrics Engine)│
│    - Compute raw metrics    │
│    - Classify archetype     │
│    - Calculate scores       │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 3. Personality (AI)         │
│    - opencode Zen API       │
│    - Generate sarcastic     │
│      summary                │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ 4. Renderer                 │
│    - Build HTML slideshow   │
│    - Save to static dir     │
│    - Return URL             │
└──────────┬──────────────────┘
           ▼
Response: {
  markdown_summary: "...",
  slideshow_url: "https://...",
  scores: { ... },
  archetype: "The 2AM Degen"
}
```

---

## Project Structure

```
txwrap/
├── .gitignore
├── AGENTS.md              # Working rules
├── PLAN.md                # This file
├── TASKS.md               # Task checklist
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express server + MCP endpoint
│       ├── config.ts         # Environment config
│       ├── types.ts          # TypeScript types
│       ├── fetcher.ts        # OKLink API data fetching
│       ├── analyzer.ts       # Metrics computation engine
│       ├── personality.ts    # AI wallet personality generator
│       └── renderer.ts       # Slideshow HTML/image builder
└── frontend/
    ├── index.html            # Slideshow template
    ├── styles.css            # Slideshow styles
    └── script.js             # Slideshow interactivity
```

---

## Metrics Engine — Detail

### Raw Data Points
| Data | Source | Endpoint |
|------|--------|----------|
| Balance | OKLink | `/address_profile` |
| TX Count | OKLink | `/address_profile` |
| TX History | OKLink | `/address_tx_history` (paginated) |
| Token Holdings | OKLink | `/address_profile` (tokens field) |
| Contract Interactions | Computed | unique `to` addresses in tx history |
| Gas Per TX | OKLink | each tx has `gasUsed` × `gasPrice` |

### Computed Metrics
| Metric | Formula | Output |
|--------|---------|--------|
| **Total Gas Burned** | Σ(gasUsed × gasPrice) | ETH value + USD estimate |
| **Swap Count** | Count tx where `to` is known DEX | Number |
| **DeFi Diversity** | Unique protocol contracts interacted with | Score 0-100 |
| **Airdrop Score** | (unique_protocols × 20) + early_tx_bonus | Score 0-100 |
| **Degen Score** | (swap_ratio × 50) + (night_tx_pct × 30) + gas_bonus | Score 0-100 |
| **Diamond Hands** | Avg holding time between receive → send | Days |
| **Top Frenemy** | Address with most outgoing transactions | Address |
| **Peak Trading Hour** | Mode of tx timestamps by hour | Hour (0-23) |
| **Activity Streak** | Consecutive days with at least 1 tx | Days |
| **Whaleometer** | Percentile of balance vs all X Layer wallets | Percentile |

### Wallet Archetypes (Rule-Based)
| Archetype | Conditions |
|-----------|-----------|
| 🎰 The 2AM Degen | swap_ratio > 0.6 && night_tx_pct > 0.4 |
| 💎 Diamond HODLer | swap_ratio < 0.1 && holding_period > 30d |
| ⛽ Gas Warrior | gas_burned_pct > 5% of balance |
| 🏗️ DeFi Explorer | unique_protocols > 10 |
| 🐜 Micro Duster | avg_tx_value < 0.01 ETH |
| 🧟 The Tourist | total_tx < 5 |
| 💤 Sleepy Whale | balance > 10 ETH && tx_frequency < 1/week |
| 🌾 Yield Farmer | frequent approve/deposit pattern |
| 🤖 The Bot | suspiciously regular timing |
| 👑 Based Chad | balanced across all metrics |

### Sarcastic Titles (Dynamic)
- "Master of 0.001 ETH Transactions"
- "Serial Approver — You've approved 47 contracts"
- "The 5x Claimer"
- "Professional Duster"
- "Gas Fee Enjoyer"
- "Rug Pull Connoisseur"
- "Liquidity Exit Specialist"

---

## API Spec — MCP Endpoint

```
POST /api/txwrap
Content-Type: application/json

Request:
{
  "address": "0x...",        // required
  "chainId": "196"           // optional, default X Layer
}

Response:
{
  "success": true,
  "data": {
    "metrics": {
      "totalTx": 847,
      "balanceEth": "2.45",
      "balanceUsd": "8575",
      "gasBurnedEth": "1.23",
      "gasBurnedUsd": "4305",
      "swapCount": 47,
      "defiScore": 78,
      "airdropScore": 82,
      "degenScore": 65,
      "diamondHandsDays": 14,
      "whaleometer": 15,
      "uniqueProtocols": 8,
      "topFrenemy": "0x...",
      "peakHour": 2,
      "activityStreak": 5,
      "archetype": "The 2AM Degen",
      "sarcasticTitle": "Serial Approver"
    },
    "personality": {
      "title": "🎰 The 2AM Degen",
      "roast": "You've made 47 swaps and 60% of them were past midnight. We're worried about you.",
      "funFacts": [
        "You've burned 1.23 ETH on gas — that's 246 cups of coffee ☕",
        "You've interacted with 8 protocols but only remember 3 of them",
        "Your top frenemy is 0x... who received 23 ETH from you"
      ],
      "verdict": "Solid degen. Not terrible, not great. You're the mid-table of crypto."
    },
    "slideshowUrl": "https://txwrap.vercel.app/wrap/0x...",
    "markdown": "📊 **TxWrap Report**\n\n**Archetype**: 🎰 The 2AM Degen\n..."
  }
}
```

---

## Timeline (8 Days)

| Day | Tasks |
|-----|-------|
| **1-2** | Project setup, OKLink API integration, fetcher module |
| **3-4** | Metrics engine (analyzer), archetype classifier |
| **5** | opencode Zen API integration, personality generator |
| **6** | Slideshow HTML/CSS design, renderer module |
| **7** | x402 payment, deploy to production |
| **8** | Submit ASP listing, create X post + demo video |

---

## Deployment
- **Backend**: Railway / Fly.io / Vercel Serverless
- **Frontend**: Vercel (static hosting)
- **Domain**: txwrap.vercel.app (temp)
