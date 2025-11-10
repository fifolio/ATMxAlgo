interface MarketBearishCoins {
  symbol: string;
  name: string;
  current_price: number;
  market_cap_rank: number;
  market_cap: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  price_change_percentage_24h_in_cur: number;
  price_change_percentage_7d_in_cur: number;
}

export interface MarketInsights {
  date: string;
  market_cap_usd: number;
  volume_usd: number;
  btc_dominance: number;
  sentiment_score: number;
  sentiment_classification: string;
  bitcoin_price_USD: number;
  previous_bitcoin_price_USD: number;
  active_cryptocurrencies: number;
  active_markets: number;
  trend_overall_market_trend: string;
  trend_dominance_influence: string;
  market_direction_current_direction: string;
  market_direction_justification: string;
  signal_strength_strength_evaluation: string;
  signal_strength_classification: string;
  timestamp: string;
  $id: string;
  $sequence: number;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

interface MarketNews {
  title: string;
  description: string;
}

interface Data {
  marketBearishCoins: MarketBearishCoins[];
  marketInsights: MarketInsights;
  marketNews: MarketNews[];
}

export default function GET_best_short_prompt(data: Data) {
  const { marketBearishCoins, marketInsights, marketNews } = data;

  return `
You are a professional crypto market analyst. I will provide you with three types of data: 

(1) Crypto Market News: 
${marketNews.map((news) => `
- News Title: ${news.title ?? "No title"} 
- News Description: ${news.description ?? "No description"}
`).join("\n")}

(2) Crypto Market Insights: 
Active cryptocurrencies: ${marketInsights.active_cryptocurrencies}
Active markets: ${marketInsights.active_markets}
Bitcoin price USD: ${marketInsights.bitcoin_price_USD}
Btc dominance: ${marketInsights.btc_dominance}
Date: ${marketInsights.date}
Market cap usd: ${marketInsights.market_cap_usd}
Market direction current direction: ${marketInsights.market_direction_current_direction}
Market direction justification: ${marketInsights.market_direction_justification}
Sentiment classification: ${marketInsights.sentiment_classification}
Sentiment score: ${marketInsights.sentiment_score}
Signal strength classification: ${marketInsights.signal_strength_classification}
Signal strength strength evaluation: ${marketInsights.signal_strength_strength_evaluation}
Trend dominance influence: ${marketInsights.trend_dominance_influence}
Trend overall market trend: ${marketInsights.trend_overall_market_trend}
Volume usd: ${marketInsights.volume_usd}
Trend dominance influence: ${marketInsights.trend_dominance_influence}
Trend dominance influence: ${marketInsights.trend_dominance_influence}

(3) Today’s Crypto Market Bears:
${JSON.stringify(marketBearishCoins, null, 2)}

Based on the information above, analyze the overall sentiment, technical patterns, and market-moving catalysts. Then, identify the single strongest coin *(from Today’s Crypto Market Bears list) that is best positioned for strong downward momentum today. 

NOTE: Return only one coin recommendation *(from Today’s Crypto Market Bears list) for placing a short trade position. Your response must be returned strictly as a JSON object with the following structure:

{
  "coin": "string", 
  "symbol": "string",
  "signal_strength": "string", 
  "market_sentiment": "string", 
  "reasoning": "string"
}
`;
}
