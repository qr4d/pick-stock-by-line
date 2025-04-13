// 检测横盘前是否有拉升的函数
function detectUptrendBeforeSideways(priceData, startIndex, uptrendThreshold = 3, maxUptrendDuration = 30, maxGapToSideways = 5) {
    const endIndex = startIndex;
    const startIndexLimit = Math.max(0, startIndex - maxUptrendDuration);

    let maxUptrendPercent = 0;
    let bestStartIndex = -1;

    for (let i = startIndexLimit; i < endIndex; i++) {
        const uptrendPercent = ((priceData[endIndex] / priceData[i]) - 1) * 100;
        const gapToSideways = endIndex - i;

        if (uptrendPercent >= uptrendThreshold && gapToSideways <= maxGapToSideways) {
            if (uptrendPercent > maxUptrendPercent) {
                maxUptrendPercent = uptrendPercent;
                bestStartIndex = i;
            }
        }
    }

    return {
        hasUptrend: bestStartIndex !== -1,
        uptrendPercent: maxUptrendPercent.toFixed(2),
        uptrendStartIndex: bestStartIndex
    };
}

// 横盘分析函数
function analyzeSidewaysWithUptrend(priceData, timeData, minDuration, maxPriceRangePercent, uptrendThreshold, uptrendMaxDuration, yesterdayClose, minSidewaysHeight, maxSidewaysHeight) {
    const sidewaysRegions = [];
    let startIndex = 0;
    let isSideways = false;

    for (let i = 1; i < priceData.length; i++) {
        const segment = priceData.slice(startIndex, i + 1);
        const minPrice = Math.min(...segment);
        const maxPrice = Math.max(...segment);
        const avgPrice = (minPrice + maxPrice) / 2;
        const priceRangePercent = ((maxPrice - minPrice) / avgPrice) * 100;

        const withinRange = priceRangePercent <= maxPriceRangePercent;// 增加下限判断

        if (!withinRange) {
            if (isSideways) {
                const duration = i - startIndex;
                if (duration >= minDuration) {
                    const { hasUptrend, uptrendPercent, uptrendStartIndex } = detectUptrendBeforeSideways(
                        priceData,
                        startIndex,
                        uptrendThreshold,
                        uptrendMaxDuration,
                        5
                    );
                    const priceuptrendPercent = (avgPrice / yesterdayClose) * 100 - 100;

                    if (hasUptrend && priceuptrendPercent <= maxSidewaysHeight && priceuptrendPercent >= minSidewaysHeight) {
                        sidewaysRegions.push({
                            start: startIndex,
                            end: i - 1,
                            duration,
                            avgPrice: avgPrice.toFixed(2),
                            priceRange: priceRangePercent.toFixed(2),
                            hasUptrend,
                            uptrendPercent,
                            uptrendStartIndex,
                            uptrendStartTime: timeData[uptrendStartIndex],
                            uptrendStartPrice: priceData[uptrendStartIndex]
                        });
                    }
                }
                isSideways = false;
            }
            startIndex = i;
        } else if (!isSideways && withinRange) {
            isSideways = true;
            startIndex = i - 1;
        }
    }

    return sidewaysRegions;
}

// 分析横盘后拉升的函数
function analyzeUptrendAfterSideways(priceData, timeData, minDuration, maxPriceRangePercent, uptrendThreshold, uptrendMaxDuration, yesterdayClose, minSidewaysHeight, maxSidewaysHeight) {
    const uptrendRegions = [];
    let startIndex = 0;
    let isSideways = false;

    for (let i = 1; i < priceData.length; i++) {
        const segment = priceData.slice(startIndex, i + 1);
        const minPrice = Math.min(...segment);
        const maxPrice = Math.max(...segment);
        const avgPrice = (minPrice + maxPrice) / 2;
        const priceRangePercent = ((maxPrice - minPrice) / avgPrice) * 100;

        const withinRange = priceRangePercent <= maxPriceRangePercent && priceRangePercent >= minSidewaysHeight;

        if (!withinRange) {
            if (isSideways) {
                const duration = i - startIndex;
                if (duration >= minDuration) {
                    // 检测横盘结束后的拉升
                    const { hasUptrend, uptrendPercent, uptrendStartIndex } = detectUptrendBeforeSideways(
                        priceData,
                        i + 1, // 从横盘结束后的索引开始检测拉升
                        uptrendThreshold,
                        uptrendMaxDuration,
                        5
                    );

                    if (hasUptrend && avgPrice >= yesterdayClose * (1 + minSidewaysHeight / 100)) {
                        uptrendRegions.push({
                            start: startIndex,
                            end: i - 1,
                            duration,
                            avgPrice: avgPrice.toFixed(2),
                            priceRange: priceRangePercent.toFixed(2),
                            hasUptrend,
                            uptrendPercent,
                            uptrendStartIndex,
                            uptrendStartTime: timeData[uptrendStartIndex],
                            uptrendStartPrice: priceData[uptrendStartIndex]
                        });
                    }
                }
                isSideways = false;
            }
            startIndex = i;
        } else if (!isSideways && withinRange) {
            isSideways = true;
            startIndex = i - 1;
        }
    }

    return uptrendRegions;
}
