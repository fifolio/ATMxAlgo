import AI_model from "../lib/AI/AI_model";
import GET_forecast_prompt from "../lib/AI/prompts/forecast/GET_forecast_prompt";
import runMarketInsights from "../predictions/market_insights/market_insights";
import coinInsights from "./coinInsights";

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


async function runForecastCoin(coin: string) {

    // STEP 1: GET GLOBAL NEWS (fundamentals)
    async function fetchNews(query: string) {
        const apiKey = import.meta.env.VITE_NEWS_API_KEY;
        const url = `https://corsproxy.io/?https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=50&apiKey=${apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Extract only {title, description}
            return data.articles.map((article: { title: string; description: string }) => ({
                title: article.title,
                description: article.description,
            }));
        } catch (err) {
            console.error(`Error fetching ${query} news:`, err);
            return [];
        }
    }

    async function getAllNews() {
        const [crypto, cryptocurrencies, bitcoin] = await Promise.all([
            fetchNews("crypto"),
            fetchNews("cryptocurrencies"),
            fetchNews("bitcoin"),
        ]);

        // Merge them into a single flat array
        const allNews = [...crypto, ...cryptocurrencies, ...bitcoin];
        return allNews;
    }

    // RUN 'GET MARKET NEWS' FUNC, AND STORE ITS RETURN
    const todaysMarketNews = await getAllNews();

    // STEP 2: GET MARKET INSIGHTS (fundamentals)
    const marketInsights = await runMarketInsights();

    // STEP 3: GET THE REQUESTED COIN INSIGHTS (technical)
    const requestedCoinInsights = await coinInsights(coin);

    // STEP4: MERGE & PASS RESUTLS OF STEP [1,2,3] TO BE AI-ANALYZED
    const merged_prompt_with_fetched_data = GET_forecast_prompt({
        todaysMarketNews: todaysMarketNews,
        marketInsights: marketInsights as MarketInsights,
        requestedCoinInsights: requestedCoinInsights
    });

    // STEP5: Send the collected data to AI model to analyz it, then clean the response, finally return it
    const AI_best_long_response = await AI_model(merged_prompt_with_fetched_data);
    const cleanJson = AI_best_long_response?.replace(/^```json\n/, '').replace(/\n```$/, '');
    const data = JSON.parse(cleanJson ? cleanJson : "{}");

    return data;
}

export default runForecastCoin;