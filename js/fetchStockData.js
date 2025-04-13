// 股票数据获取函数
async function fetchStockData(stockCode) {
    try {
        const timestamp = new Date().getTime();
        const url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?_var=min_data_${stockCode}&code=${stockCode}&r=${timestamp}`;
        const response = await fetch(url);
        const text = await response.text();
        const prefix = `min_data_${stockCode}=`;
        if (text.startsWith(prefix)) {
            const jsonData = JSON.parse(text.substring(prefix.length));
            if (jsonData && jsonData.code === 0 && jsonData.data && jsonData.data[stockCode]) {
                const stockData = jsonData.data[stockCode];

                // 提取时间、价格和成交量数据
                if (stockData.data && Array.isArray(stockData.data.data)) {
                    const time = [];
                    const price = [];
                    const volume = [];
                    let previousVolume = 0;

                    stockData.data.data.forEach(entry => {
                        const parts = entry.split(" ");
                        time.push(parts[0]);
                        price.push(parseFloat(parts[1]));
                        const cumulativeVolume = parseInt(parts[2], 10);
                        volume.push(cumulativeVolume - previousVolume);
                        previousVolume = cumulativeVolume;
                    });

                    return {
                        time,
                        price,
                        volume,
                        qt: stockData.qt
                    };
                } else {
                    throw new Error("API 返回的数据结构不完整或缺少必要字段");
                }
            }
            throw new Error("获取股票数据失败，数据结构异常");
        } else {
            throw new Error("获取股票数据失败，未获取到预期格式的数据");
        }
    } catch (error) {
        console.error(`获取股票 ${stockCode} 数据失败:`, error);
        throw error;
    }
}