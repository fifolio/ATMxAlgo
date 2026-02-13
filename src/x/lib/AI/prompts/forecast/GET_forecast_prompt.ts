// News item
interface NewsItem {
    title: string;
    description: string;
}

// Market insights 
interface MarketInsights {
    date: string;
    market_cap_usd: number;
    volume_usd: number;
    btc_dominance: number;
    sentiment_score: number;
    sentiment_classification: "Positive" | "Negative" | string;
    bitcoin_price_USD: number;
    previous_bitcoin_price_USD: number;
    active_cryptocurrencies: number;
    active_markets: number;
    trend_overall_market_trend: string;
    trend_dominance_influence: string;
    market_direction_current_direction: string;
    market_direction_justification: string;
    signal_strength_strength_evaluation: string;
    signal_strength_classification: "Weak" | "Moderate" | "Strong" | string;
    timestamp: string;
    $id: string;
    $sequence: number;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    $databaseId: string;
    $collectionId: string;
}


// Requested coin insights 
interface RequestedCoinInsights {
    id: string;
    name: string;
    symbol: string;
    rank: number;
    total_supply: number;
    max_supply?: number;
    circulating_supply?: number;
    price_usd?: number;
    volume_usd_24h?: number;
    market_cap_usd?: number;
    percent_change_24h?: number;
}

// ====================================
// Combined Type for the Merged Prompt
// ====================================
interface ForecastPromptData {
    todaysMarketNews: NewsItem[];
    marketInsights: MarketInsights;
    requestedCoinInsights: RequestedCoinInsights;
}

// ====================================
// Function to Generate Prompt
// ====================================
export default function GET_forecast_prompt(data: ForecastPromptData) {
    const { todaysMarketNews, marketInsights, requestedCoinInsights } = data;


    return `
You are a trading and investing expert financial analyst specializing in cryptocurrency markets. Input: a JSON objects (see below) describing a coin and market metrics. Return a single JSON object matching this exact output schema (see blow). Use deterministic rules:
- Use ATR-based SL if ATR available, else use percentage.
- Use risk-per-trade default 1%.
- Choose TP to achieve R:R between 1.5 and 3 depending on confidence.
- Estimate duration from short- to long-term momentum.
- Provide human-readable reasoning, list red flags, and assumptions.

Fill every numeric field; if unknown, use null. Timestamp response in UTC and include a confidence_score 0..1.
Now analyze the following inputs and return only the JSON result (no extra text).

---
Today's Market News:
${JSON.stringify(todaysMarketNews)}

Market Insights:
${JSON.stringify(marketInsights)}

Coin Insights:
${JSON.stringify(requestedCoinInsights)}

---
OUTPUT SCHEMA:

{
  "coin_name": "", // STRINGS ONLY
  "coin_symbol": "", // STRINGS ONLY
  "trade_type": "long" | "short", // STRINGS ONLY
  "entry_price": 0.0, // NUMBERS ONLY
  "stop_loss_price": 0.0, // NUMBERS ONLY
  "stop_loss_distance_pct": 0.0, // NUMBERS ONLY
  "take_profit_price": 0.0, // NUMBERS ONLY
  "take_profit_distance_pct": 0.0, // NUMBERS ONLY
  "risk_reward_ratio": 0.0, // NUMBERS ONLY
  "expected_duration": { 
      "value": 0, // NUMBERS ONLY
      "unit": "days|weeks" // STRINGS ONLY
   },
  "confidence_score": 0.0,            // NUMBERS ONLY, 0..1 or 0..100
  "signal_strength": "",              // STRINGS ONLY, copy from input plus normalized score
  "reasoning_summary": "",            // STRINGS ONLY, short human-readable rationale
  "detailed_rationale": "",           // STRINGS ONLY, indicators, patterns, news signals
  "red_flags": ["string", "..."],     // STRINGS ONLY, risks and warnings
  "assumptions": ["string", "..."],   // STRINGS ONLY, any assumptions made (data freshness, slippage)
  "recommendations": {                // extra operational guidance
     "order_type": "market|limit", // STRINGS ONLY
     "leverage_suggested": 1, // NUMBERS ONLY
     "notes": "string" // STRINGS ONLY
  },
  "meta": {
     "timestamp_utc": "YYYY-MM-DDTHH:MM:SSZ", // STRINGS ONLY
     "model_version": "string" // STRINGS ONLY
  }
}
`;
}
