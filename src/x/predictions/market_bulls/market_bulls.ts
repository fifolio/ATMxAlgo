import { useLoading } from "../../../stores";
import { GET_historical_market_bulls, POST_bulls, POST_historical_market_bulls } from "../../../apis";

interface BullishCoinMarketData {
    current_price: number;
    price_change_percentage_24h_in_currency: number;
    price_change_percentage_7d_in_currency: number;
    market_cap: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    ath_change_percentage: number;
}

async function runMarketBulls() {

    const { setIsLoading } = useLoading.getState();
    setIsLoading(true);

    let todaysHistoricalBullishCoins;
    let todaysHistoricalBullsID;


    // Check if database historical data collections contains a pre-storred today's historical data
    const todaysHistoricalBullsContainer = await GET_historical_market_bulls(new Date().toISOString().split('T')[0]);

    if (todaysHistoricalBullsContainer && todaysHistoricalBullsContainer.total > 0) {

        // if today's historical data found pre-storred, return its bullish coins
        todaysHistoricalBullishCoins = todaysHistoricalBullsContainer.documents[0].bullishCoins;

    } else {
        // If no historical data, create a new historical doc to store today's bullish coins in     
        const createTodaysHistoricalBulls = await POST_historical_market_bulls({ date: new Date().toISOString().split('T')[0] });
        todaysHistoricalBullsID = createTodaysHistoricalBulls && createTodaysHistoricalBulls?.$id;

        // After create today's historical doc, fetch all coins
        const allMarketCoins = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=24h,7d');

        const allMarketCoinsJSON = await allMarketCoins.json();

        // Filter bullish coins
        const bullishCoins = allMarketCoinsJSON.filter((coin: BullishCoinMarketData) => {
            const nearDailyHigh = (coin.high_24h - coin.current_price) / coin.high_24h <= 0.10;
            const nearATH = coin.ath_change_percentage > -20;
            // const current_price = coin.current_price < 10;

            return (
                coin.price_change_percentage_24h_in_currency > 0 &&
                coin.price_change_percentage_7d_in_currency > 0 &&
                // coin.market_cap > 5000000 &&
                // coin.total_volume > 1000000 &&
                nearDailyHigh &&
                nearATH
                // current_price
            );
        });

        // After filtering bullish coins, store them on the database linked to today's historical doc
        for (let i = 0; i < bullishCoins.length; i++) {
            await POST_bulls({
                historicalBullishDocID: String(todaysHistoricalBullsID),
                symbol: bullishCoins[i].symbol,
                name: bullishCoins[i].name,
                current_price: Number(bullishCoins[i].current_price),
                market_cap: bullishCoins[i].market_cap,
                market_cap_rank: bullishCoins[i].market_cap_rank,
                fully_diluted_valuation: bullishCoins[i].fully_diluted_valuation,
                total_volume: bullishCoins[i].total_volume,
                high_24h: Number(bullishCoins[i].high_24h),
                low_24h: Number(bullishCoins[i].low_24h),
                price_change_24h: bullishCoins[i].price_change_24h,
                price_change_percentage_24h: bullishCoins[i].price_change_percentage_24h,
                market_cap_change_24h: Number.isInteger(bullishCoins[i].market_cap_change_24h) ? bullishCoins[i].market_cap_change_24h : 0,
                market_cap_change_percentage_24h: Number(bullishCoins[i].market_cap_change_percentage_24h),
                circulating_supply: Number(bullishCoins[i].circulating_supply),
                total_supply: Number(bullishCoins[i].total_supply),
                max_supply: Number(bullishCoins[i].max_supply),
                ath: Number(bullishCoins[i].ath),
                ath_change_percentage: Number(bullishCoins[i].ath_change_percentage),
                ath_date: bullishCoins[i].ath_date,
                atl: Number(bullishCoins[i].atl),
                atl_change_percentage: Number(bullishCoins[i].atl_change_percentage),
                atl_date: bullishCoins[i].atl_date,
                last_updated: bullishCoins[i].last_updated,
                price_change_percentage_24h_in_currency: Number(bullishCoins[i].price_change_percentage_24h_in_currency),
                price_change_percentage_7d_in_currency: Number(bullishCoins[i].price_change_percentage_7d_in_currency),
            }).catch((err) => {
                console.error("Error posting today's bulls:", err);
            })

            // Throttle API requests: wait 1.5 seconds between calls to avoid hitting rate limits
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        todaysHistoricalBullishCoins = bullishCoins
    }

    return todaysHistoricalBullishCoins;
}

export default runMarketBulls;