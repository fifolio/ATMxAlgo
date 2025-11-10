import { useLoading } from "../../../stores";
import AI_model from "../../lib/AI/AI_model";
import GET_best_long_prompt, { type MarketInsights } from "../../lib/AI/prompts/best_long/GET_best_long_prompt";
import runMarketBulls from "../../predictions/market_bulls/market_bulls";
import runMarketInsights from "../../predictions/market_insights/market_insights";




async function runBestLong() {

    const { setIsLoading } = useLoading.getState();
    setIsLoading(true);

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

    // Run fetch market news, and store its return
    const todaysMarketNews = await getAllNews();


    // STEP 2: GET MARKET INSIGHTS (technical)
    const todaysMarketInsights = await runMarketInsights() as MarketInsights;


    // STEP3: GET BULLISH COINS (technical)
    const todaysMarketBullishCoins = await runMarketBulls();

    // STEP4: PASS RESUTLS OF STEP [1,2,3] TO BE AI-ANALYZED
    // Merge the collected data with Get insights prompts
    const merged_prompt_with_fetched_data = GET_best_long_prompt({
        marketBullishCoins: todaysMarketBullishCoins,
        marketInsights: todaysMarketInsights,
        marketNews: todaysMarketNews
    })

    // STEP5: Send the collected data to AI model to analyz it, then clean the response, finally return it
    const AI_best_long_response = await AI_model(merged_prompt_with_fetched_data);
    const cleanJson = AI_best_long_response?.replace(/^```json\n/, '').replace(/\n```$/, '');
    const data = JSON.parse(cleanJson ? cleanJson : "{}");

    return data;
}

export default runBestLong;