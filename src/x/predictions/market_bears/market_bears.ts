import { useLoading } from "../../../stores";
import { GET_historical_market_bears, POST_bears, POST_historical_market_bears } from "../../../apis";

interface BearishCoinMarketData {
    current_price: number;
    price_change_percentage_24h_in_currency: number;
    price_change_percentage_7d_in_currency: number;
    market_cap: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    ath_change_percentage: number;
}

async function runMarketBears() {

    const { setIsLoading } = useLoading.getState();
    setIsLoading(true);

    let todaysHistoricalBearishCoins;
    let todaysHistoricalBearsID;


    // Check if database historical data collections contains a pre-storred today's historical data
    const todaysHistoricalBearsContainer = await GET_historical_market_bears(new Date().toISOString().split('T')[0]);

    if (todaysHistoricalBearsContainer && todaysHistoricalBearsContainer.total > 0) {

        // if today's historical data found pre-storred, return its bearish coins
        todaysHistoricalBearishCoins = todaysHistoricalBearsContainer.documents[0].bearishCoins;

    } else {
        // If no historical data, create a new historical doc to store today's bullish coins in     
        const createTodaysHistoricalBears = await POST_historical_market_bears({ date: new Date().toISOString().split('T')[0] });
        todaysHistoricalBearsID = createTodaysHistoricalBears && createTodaysHistoricalBears?.$id;

        // After create today's historical doc, fetch all coins
        const allMarketCoins = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=24h,7d');

        const allMarketCoinsJSON = await allMarketCoins.json();

        // Filter bearish coins
        const bearishCoins = allMarketCoinsJSON.filter((coin: BearishCoinMarketData) => {
            const nearDailyLow = (coin.current_price - coin.low_24h) / coin.low_24h < 0.02;
            const farBelowATH = coin.ath_change_percentage < -50; // e.g. 50% or more below ATH
            const current_price = coin.current_price < 10;

            return (
                coin.price_change_percentage_24h_in_currency < 0 &&
                coin.price_change_percentage_7d_in_currency < 0 &&
                // coin.market_cap > 5000000 &&
                // coin.total_volume > 1000000 &&
                nearDailyLow &&
                farBelowATH &&
                current_price
            );
        });

        // After filtering bullish coins, store them on the database linked to today's historical doc
        for (let i = 0; i < bearishCoins.length; i++) {
            await POST_bears({
                historicalBearishDocID: String(todaysHistoricalBearsID),
                symbol: bearishCoins[i].symbol,
                name: bearishCoins[i].name,
                current_price: bearishCoins[i].current_price,
                market_cap: bearishCoins[i].market_cap,
                market_cap_rank: bearishCoins[i].market_cap_rank,
                fully_diluted_valuation: bearishCoins[i].fully_diluted_valuation,
                total_volume: bearishCoins[i].total_volume,
                high_24h: bearishCoins[i].high_24h,
                low_24h: bearishCoins[i].low_24h,
                price_change_24h: bearishCoins[i].price_change_24h,
                price_change_percentage_24h: bearishCoins[i].price_change_percentage_24h,
                market_cap_change_24h: Number.isInteger(bearishCoins[i].market_cap_change_24h) ? bearishCoins[i].market_cap_change_24h : 0,
                market_cap_change_percentage_24h: bearishCoins[i].market_cap_change_percentage_24h,
                circulating_supply: bearishCoins[i].circulating_supply,
                total_supply: bearishCoins[i].total_supply,
                max_supply: bearishCoins[i].max_supply,
                ath: bearishCoins[i].ath,
                ath_change_percentage: bearishCoins[i].ath_change_percentage,
                ath_date: bearishCoins[i].ath_date,
                atl: bearishCoins[i].atl,
                atl_change_percentage: bearishCoins[i].atl_change_percentage,
                atl_date: bearishCoins[i].atl_date,
                last_updated: bearishCoins[i].last_updated,
                price_change_percentage_24h_in_currency: bearishCoins[i].price_change_percentage_24h_in_currency,
                price_change_percentage_7d_in_currency: bearishCoins[i].price_change_percentage_7d_in_currency,
            }).catch((err) => {
                console.error("Error posting today's Bears:", err);
            })

            // Throttle API requests: wait 1.5 seconds between calls to avoid hitting rate limits
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        todaysHistoricalBearishCoins = bearishCoins
    }

    return todaysHistoricalBearishCoins;
}

export default runMarketBears;