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

                    // 提取昨日收盘价
                    const yesterdayClose = parseFloat(stockData.qt[stockCode][4]);

                    return {
                        time,
                        price,
                        volume,
                        yesterdayClose, // 添加昨日收盘价
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

// 获取日K图数据
async function fetchDailyKlineData(stockCode) {
    try {
        const timestamp = new Date().getTime();
        const url = `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?_var=kline_dayqfq&param=${stockCode},day,,,180,qfq&r=${timestamp}`;
        const response = await fetch(url);
        const text = await response.text();
        const prefix = `kline_dayqfq=`;

        if (text.startsWith(prefix)) {
            const jsonData = JSON.parse(text.substring(prefix.length));
            if (jsonData && jsonData.code === 0 && jsonData.data && jsonData.data[stockCode]) {
                const klineData = jsonData.data[stockCode].qfqday;
                return klineData.map(entry => ({
                    date: entry[0], // 日期
                    open: parseFloat(entry[1]), // 开盘价
                    close: parseFloat(entry[2]), // 收盘价
                    high: parseFloat(entry[3]), // 最高价
                    low: parseFloat(entry[4]), // 最低价
                    volume: parseInt(entry[5], 10) // 成交量
                }));
            } else {
                throw new Error("API 返回的数据结构不完整或缺少必要字段");
            }
        } else {
            throw new Error("API 返回的数据格式不正确");
        }
    } catch (error) {
        console.error(`获取股票 ${stockCode} 的日K图数据失败:`, error);
        throw error;
    }
}