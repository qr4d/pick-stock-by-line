// 检测横盘前的拉升（找到拉升的开始点和结束点）
function detectUptrendBeforeSideways(priceData, startIndex, maxGapToSideways = 5, yesterdayClose, minUptrendBeforePercent, maxUptrendBeforeDuration) {
    // 在横盘开始点前后 maxGapToSideways 分钟内，找到价格的最高点作为拉升的结束点
    const searchRangeStart = Math.max(0, startIndex - maxGapToSideways);
    const searchRangeEnd = startIndex + maxGapToSideways + 1;
    const searchRange = priceData.slice(searchRangeStart, searchRangeEnd);
    const uptrendEndPrice = Math.max(...searchRange);

    // 手动找到 uptrendEndPrice 的最后一个索引，确保在指定范围内
    let uptrendEndIndex = -1;
    for (let i = searchRangeEnd - 1; i >= searchRangeStart; i--) {
        if (priceData[i] === uptrendEndPrice) {
            uptrendEndIndex = i;
            break;
        }
    }

    // 从拉升结束点向前 maxUptrendBeforeDuration 分钟内，找到价格的最低点作为拉升的开始点
    const startSearchIndex = Math.max(0, uptrendEndIndex - maxUptrendBeforeDuration);
    const endSearchIndex = uptrendEndIndex + 1;
    const uptrendStartPrice = Math.min(...priceData.slice(startSearchIndex, endSearchIndex));

    // 手动找到 uptrendStartPrice 的最后一个索引
    let uptrendStartIndex = -1;
    for (let i = endSearchIndex - 1; i >= startSearchIndex; i--) {
        if (priceData[i] === uptrendStartPrice) {
            uptrendStartIndex = i;
            break;
        }
    }

    // 计算拉升幅度
    const uptrendPercent = ((uptrendEndPrice / yesterdayClose - 1) * 100) - ((uptrendStartPrice / yesterdayClose - 1) * 100);

    // 如果拉升幅度大于最小拉升幅度阈值，则返回拉升的开始点和结束点
    if (uptrendPercent > minUptrendBeforePercent) {
        return { uptrendStartIndex, uptrendEndIndex, uptrendPercent };
    } else {
        // 否则返回 null，表示没有符合条件的拉升
        return null;
    }
}

// 检测横盘后的拉升（找到拉升的开始点和结束点）
function detectUptrendAfterSideways(priceData, endIndex, maxGapToSideways = 5, yesterdayClose, minUptrendAfterPercent, maxUptrendAfterDuration) {
    // 在横盘结束点前后 maxGapToSideways 分钟内，找到价格的最低点作为拉升的开始点
    const searchRangeStart = Math.max(0, endIndex - maxGapToSideways);
    const searchRangeEnd = endIndex + maxGapToSideways + 1;
    const searchRange = priceData.slice(searchRangeStart, searchRangeEnd);
    const uptrendStartPrice = Math.min(...searchRange);

    // 手动找到 uptrendStartPrice 的第一个索引，确保在指定范围内
    let uptrendStartIndex = -1;
    for (let i = searchRangeStart; i < searchRangeEnd; i++) {
        if (priceData[i] === uptrendStartPrice) {
            uptrendStartIndex = i;
            break;
        }
    }

    // 从拉升开始点向后 maxUptrendAfterDuration 分钟内，找到价格的最高点作为拉升的结束点
    const startSearchIndex = uptrendStartIndex;
    const endSearchIndex = Math.min(priceData.length, uptrendStartIndex + maxUptrendAfterDuration + 1);
    const uptrendEndPrice = Math.max(...priceData.slice(startSearchIndex, endSearchIndex));

    // 手动找到 uptrendEndPrice 的第一个索引
    let uptrendEndIndex = -1;
    for (let i = startSearchIndex; i < endSearchIndex; i++) {
        if (priceData[i] === uptrendEndPrice) {
            uptrendEndIndex = i;
            break;
        }
    }

    // 计算拉升幅度
    const uptrendPercent = ((uptrendEndPrice / yesterdayClose - 1) * 100) - ((uptrendStartPrice / yesterdayClose - 1) * 100);

    // 如果拉升幅度大于最小拉升幅度阈值，则返回拉升的开始点和结束点
    if (uptrendPercent > minUptrendAfterPercent) {
        return { uptrendStartIndex, uptrendEndIndex, uptrendPercent };
    } else {
        // 否则返回 null，表示没有符合条件的拉升
        return null;
    }
}

// 分析横盘并查看横盘前有没有拉升或横盘后有没有拉升
function analyzeSidewaysWithUptrend(priceData, timeData, parameters) {
    const sidewaysRegions = [];
    let startIndex = 0;
    let isSideways = false;

    for (let i = 1; i < priceData.length; i++) {
        const segment = priceData.slice(startIndex, i + 1);
        const [minPrice, maxPrice] = [Math.min(...segment), Math.max(...segment)];
        const avgPrice = (minPrice + maxPrice) / 2;
        const priceRangePercent = ((maxPrice - minPrice) / avgPrice) * 100;

        // 判断是否在横盘范围内
        const withinRange = priceRangePercent <= parameters.maxSidewaysRange &&
                            avgPrice >= parameters.yesterdayClose*(100+parameters.minSidewaysHeight)/100 &&
                            avgPrice <= parameters.yesterdayClose*(100+parameters.maxSidewaysHeight)/100;

        if (!withinRange) {
            if (isSideways) {
                const duration = i - startIndex;
                if (duration >= parameters.minSidewaysDuration) {
                    // 检测横盘前的拉升
                    const uptrendBefore = parameters.enableUptrendBeforeSideways
                        ? detectUptrendBeforeSideways(
                            priceData,
                            startIndex,
                            parameters.maxGapToSideways,
                            parameters.yesterdayClose,
                            parameters.minUptrendBeforePercent,
                            parameters.maxUptrendBeforeDuration
                        )
                        : null;

                    // 检测横盘后的拉升
                    const uptrendAfter = parameters.enableUptrendAfterSideways
                        ? detectUptrendAfterSideways(
                            priceData,
                            i - 1,
                            parameters.maxGapToSideways,
                            parameters.yesterdayClose,
                            parameters.minUptrendAfterPercent,
                            parameters.maxUptrendAfterDuration
                        )
                        : null;

                    // 根据勾选状态严格筛选横盘区域
                    const isValidRegion =
                        (!parameters.enableUptrendBeforeSideways || (uptrendBefore && uptrendBefore.uptrendPercent >= parameters.minUptrendBeforePercent)) &&
                        (!parameters.enableUptrendAfterSideways || (uptrendAfter && uptrendAfter.uptrendPercent >= parameters.minUptrendAfterPercent));

                    if (isValidRegion) {
                        sidewaysRegions.push({
                            start: startIndex,
                            end: i - 1,
                            duration,
                            avgPrice: avgPrice.toFixed(2),
                            priceRange: priceRangePercent.toFixed(2),
                            uptrendBefore: uptrendBefore && uptrendBefore.uptrendPercent >= parameters.minUptrendBeforePercent ? uptrendBefore : null,
                            uptrendAfter: uptrendAfter && uptrendAfter.uptrendPercent >= parameters.minUptrendAfterPercent ? uptrendAfter : null
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
