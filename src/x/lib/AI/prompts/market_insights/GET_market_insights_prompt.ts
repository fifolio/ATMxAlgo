// CoinyBubble API
interface CoinyBubbleData {
  timestamp: string;
  actual_value: number;
  previous_value: number;
  bitcoin_price_usd: number;
  previous_bitcoin_price_usd: number;
}

// Alternative.me Global Market Data API (/v2/global/)
interface AlternativeMeQuotes {
  total_market_cap: number;
  total_volume_24h: number;
}

interface AlternativeMeData {
  active_cryptocurrencies: number;
  active_markets: number;
  bitcoin_percentage_of_market_cap: number;
  quotes: {
    USD: AlternativeMeQuotes;
  };
  last_updated: number;
}

interface AlternativeMeMetadata {
  timestamp: number;
  error: string | null;
}

interface AlternativeMeResponse {
  data: AlternativeMeData;
  metadata: AlternativeMeMetadata;
}

// Combined Market Sentiment Response
interface MarketSentimentResponse {
  cb: CoinyBubbleData | null;
  am: AlternativeMeResponse | null;
  error?: string;
}


export default function GET_market_insights_prompt(data: MarketSentimentResponse) {

  // Ddistribution objects from the data
  const { cb, am } = data;

  return `
You are an expert financial analyst specializing in cryptocurrency markets. Using the following data, provide a detailed market insight report:

Data:
Timestamp: ${cb?.timestamp}
Actual Value: ${cb?.actual_value}
Previous Value: ${cb?.previous_value}
Bitcoin Price USD: ${cb?.bitcoin_price_usd}
Previous Bitcoin Price USD: ${cb?.previous_bitcoin_price_usd}
Active Cryptocurrencies: ${am?.data.active_cryptocurrencies}
Active Markets: ${am?.data.active_markets}
Bitcoin Percentage of Market Cap: ${am?.data.bitcoin_percentage_of_market_cap}
Total Market Cap: ${am?.data.quotes.USD.total_market_cap}
Total Volume 24h: ${am?.data.quotes.USD.total_volume_24h}


Instructions:

1. Trend Summary:

* Analyze the overall market trend using the provided data.
* Consider the 24-hour market cap change, volume, and sentiment classification.
* Include insights on how Bitcoin and Ethereum dominance might influence the trend.

2. Market Direction:

* Determine the current market direction: bullish or bearish.
* Justify the conclusion using the sentiment score and classification, market cap movement, and trading volume.

3. Signal Strength:

* Evaluate the strength of the market signal based on the data.
* Use metrics such as market cap change, volume, sentiment, and dominance percentages.
* Classify the signal as weak, moderate, or strong.

-
Ensure the analysis is thorough, data-driven, and suitable for professional investors.
* The key-value pairs must be clear text, No symbols included. 
* Return everything in form of a JSON object, following constantly the following structure:

{
  "timestamp": ,
  "market_cap_usd": ,
  "volume_usd": ,
  "btc_dominance": ,
  "sentiment_score": ,
  "sentiment_classification": [ONLY: Bullish OR Bearish (NO Neutral)],
  "bitcoin_price_USD: ,
  "previous_bitcoin_price_USD: ,
  "active_cryptocurrencies: ,
  "active_markets: ,

  "trend_summary": {
      "overall_market_trend": ,
      "dominance_influence": 
    },
    "market_direction": {
      "current_direction": [ONLY: Bullish OR Bearish (NO Neutral)],
      "justification": 
    },
    "signal_strength": {
      "strength_evaluation": ,
      "classification": [ONLY: Bullish OR Bearish (NO Neutral)] 
    }
} 
    `
};