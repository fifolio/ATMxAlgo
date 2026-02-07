import { useLoading } from "../../../stores";
import { GET_insights, POST_insights } from "../../../apis";
import AI_model from "../../lib/AI/AI_model";
import GET_market_insights_prompt from "../../lib/AI/prompts/market_insights/GET_market_insights_prompt";

// CoinyBubble API
interface CoinyBubbleData {
  timestamp: string;
  actual_value: number;
  previous_value: number;
  bitcoin_price_usd: number;
  previous_bitcoin_price_usd: number;
}

// Alternative.me Global Market Data API
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


async function runMarketInsights() {

  const { setIsLoading } = useLoading.getState();
  setIsLoading(true);

  let market_insights;

  // Check if database contains a pre-storred today's insights
  const insightsFromDatabase = await GET_insights(new Date().toISOString().split('T')[0]);

  // if database pre-sotrred the requested document, return it 
  if (insightsFromDatabase && insightsFromDatabase.total > 0) {
    market_insights = insightsFromDatabase.documents[0];

    return market_insights;
  } else {
    // if database not pre-storred the requested document, start fetching new market insights, then store it for future calls

    async function fetchMarketSentiment() {
      try {
        // Fetch CoinyBubble sentiment data
        const resp1 = await fetch('https://api.coinybubble.com/v1/latest');

        if (!resp1.ok) {
          throw new Error(`CoinyBubble API error: ${resp1.status} ${resp1.statusText}`);
        }

        // Turn the returned date from 'CoinyBubble' into JSON format
        const cb = await resp1.json();

        // Fetch Alternative.me global market data (with CORS proxy)
        const resp2 = await fetch('https://api.allorigins.win/raw?url=https://api.alternative.me/v2/global/');

        if (!resp2.ok) {
          throw new Error(`Alternative.me API error: ${resp2.status} ${resp2.statusText}`);
        }

        // Turn the returned date from 'Alternative' into JSON format
        const am = await resp2.json();

        return {
          cb,
          am,
        };
      } catch (error) {
        console.error('Error fetching market sentiment:', (error as Error).message);
        return {
          cb: null,
          am: null,
          error: (error as Error).message
        };
      }
    }

    // Fetch market sentiment data, then pass the return to 'market_insights'
    market_insights = await fetchMarketSentiment();
  }

  // Merge the collected data with Get insights prompts
  const merged_get_insights_prompt_with_fetched_data = GET_market_insights_prompt(market_insights as MarketSentimentResponse)

  // Send the collected data to AI model to analyz it
  const AI_insights_report = await AI_model(merged_get_insights_prompt_with_fetched_data);
  const cleanJson = AI_insights_report?.replace(/^```json\n/, '').replace(/\n```$/, '');
  const data = JSON.parse(cleanJson ? cleanJson : "{}");

  // Store returned data into the database 
  const payload = {
    date: new Date().toISOString().split('T')[0],
    timestamp: data.timestamp,
    market_cap_usd: Number(data.market_cap_usd),
    volume_usd: Number(data.volume_usd),
    btc_dominance: Number(data.btc_dominance),
    sentiment_score: Number(data.sentiment_score),
    sentiment_classification: data.sentiment_classification,
    bitcoin_price_USD: Number(data.bitcoin_price_USD),
    previous_bitcoin_price_USD: Number(data.previous_bitcoin_price_USD),
    active_cryptocurrencies: Number(data.active_cryptocurrencies),
    active_markets: Number(data.active_markets),
    trend_overall_market_trend: data.trend_summary.overall_market_trend,
    trend_dominance_influence: data.trend_summary.dominance_influence,
    market_direction_current_direction: data.market_direction.current_direction,
    market_direction_justification: data.market_direction.justification,
    signal_strength_strength_evaluation: data.signal_strength.strength_evaluation,
    signal_strength_classification: data.signal_strength.classification,
  };

  await POST_insights(payload).catch((err) => {
      console.error("Error posting today's insights:", err);
    })



  return payload;
}

export default runMarketInsights;
