async function coinInsights(desiredCoin: string) {
  const coinpaprika_url = 'https://api.coinpaprika.com/v1/tickers';
  const coingecko_base = 'https://api.coingecko.com/api/v3/coins/markets';
  let pageNum = 1;
  let insights = null;
  let requestCount = 0;

  const sleep = () => new Promise(resolve => setTimeout(resolve, 60000));

  async function fetchFromCoinGecko(page: number) {
    const url = `${coingecko_base}?vs_currency=usd&order=market_cap_desc&page=${page}&per_page=250&sparkline=false&price_change_percentage=24h,7d`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko request failed (page ${page})`);
    const data = await res.json();
    return data.find((coin: { symbol: string }) => coin.symbol === desiredCoin.toLowerCase());
  }

  // --- STEP 1: CoinPaprika ---
  try {
    const response = await fetch(coinpaprika_url);
    if (!response.ok) throw new Error("CoinPaprika request failed");
    const data = await response.json();

    insights = data.find((coin: { symbol: string }) => coin.symbol === desiredCoin);
    if (insights) {
      // console.log(`✅ Found ${desiredCoin} on CoinPaprika`);
      return insights;
    } 
    // else {
    //   console.warn(`⚠️ ${desiredCoin} not found on CoinPaprika. Trying CoinGecko...`);
    // }
  } catch (err) {
    console.error(`❌ CoinPaprika fetch failed:`, err);
  }

  // --- STEP 2: CoinGecko ---
  const MAX_PAGES = 999;
  while (!insights && pageNum <= MAX_PAGES) {
    try {
      console.log(`🔍 Checking CoinGecko (page ${pageNum})...`);
      insights = await fetchFromCoinGecko(pageNum);
      requestCount++;

      if (insights) {
        // console.log(`✅ Found ${desiredCoin} on CoinGecko (page ${pageNum})`);
        return insights;
      } else {

        // Move wait after increment
        pageNum++;

        // Wait every 6 requests
        if (requestCount % 5 === 0) {
          console.warn(`⏳ Hit 6 requests — waiting 60 seconds to respect rate limit...`);
          await sleep();
        }
      }


    } catch (err) {
      // ❌ Don’t break — just continue after logging
      console.error(`❌ Error fetching CoinGecko page ${pageNum}:`, err);
      pageNum++;
    }
  }

  // console.error(`🚫 ${desiredCoin} not found on either API after ${pageNum - 1} pages.`);
  return null;
}

export default coinInsights;
