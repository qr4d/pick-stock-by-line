$(document).ready(function () {
    $('#applyParameters').click(updateParameters);

    $('#queryButton').click(async function () {
        let stockCodes = $('#stockCodes').val().split(',').map(code => code.trim()).filter(code => code);

        if (stockCodes.length === 0) {
            const response = await fetch('./stockcodes.txt');
            const text = await response.text();
            stockCodes = text.split('\n').map(line => {
                const [code, remark] = line.split(/\s+/); // 分割股票代码和备注信息
                return { code: code.trim(), remark: remark ? remark.trim() : '' };
            }).filter(entry => entry.code && !entry.code.startsWith('//'));
        } else {
            stockCodes = stockCodes.map(code => ({ code, remark: '' })); // 如果没有备注信息，默认为空
        }

        $('#charts').empty();
        const stocksWithSideways = [];
        const stocksWithoutSideways = [];
        const queryButton = $('#queryButton');
        queryButton.prop('disabled', true);

        // 获取筛选模式
        const filterMode = $('input[name="filterMode"]:checked').val();

        for (let i = 0; i < stockCodes.length; i++) {
            const { code, remark } = stockCodes[i];
            queryButton.text(`正在查询第 ${i + 1} 个股票，代码 ${code}`);
            try {
                const stockData = await fetchStockData(code);
                let analysisResult;

                if (filterMode === 'uptrendToSideways') {
                    // 拉升后横盘
                    analysisResult = analyzeSidewaysWithUptrend(
                        stockData.price,
                        stockData.time,
                        parameters.minDuration,
                        parameters.maxPriceRangePercent,
                        parameters.uptrendThreshold,
                        parameters.uptrendMaxDuration,
                        parseFloat(stockData.qt[code][4]), // 昨日收盘价
                        parameters.minSidewaysHeight,
                        parameters.maxSidewaysHeight
                    );
                } else if (filterMode === 'sidewaysToUptrend') {
                    // 横盘后拉升
                    analysisResult = analyzeUptrendAfterSideways(
                        stockData.price,
                        stockData.time,
                        parameters.minDuration,
                        parameters.maxPriceRangePercent,
                        parameters.uptrendThreshold,
                        parameters.uptrendMaxDuration,
                        parseFloat(stockData.qt[code][4]), // 昨日收盘价
                        parameters.minSidewaysHeight,
                        parameters.maxSidewaysHeight
                    );
                }

                if (analysisResult.length > 0) {
                    stocksWithSideways.push({ stockName: stockData.qt[code][1], code, remark, stockData, analysisResult });
                } else {
                    stocksWithoutSideways.push({ stockName: stockData.qt[code][1], code, remark });
                }
            } catch (error) {
                alert(`股票代码 ${code} 查询失败：${error.message}`);
            }
        }

        queryButton.prop('disabled', false).text('查询');

        // 渲染符合条件的股票
        stocksWithSideways.forEach(({ stockName, code, remark, stockData, analysisResult }, index) => {
            const stockContainer = $('<div>').addClass('stock-container mb-4');
            const stockHeader = $('<div>')
                .addClass('stock-header')
                .text(`${index + 1}. ${stockName} (${code}) ${remark ? `[${remark}]` : ''}`)
                .css('cursor', 'pointer')
                .click(function () {
                    $(this).next('.stock-chart').toggle();
                });

            const stockChart = $('<div>').addClass('stock-chart').css('display', 'block');
            $('#charts').append(stockContainer.append(stockHeader).append(stockChart));

            drawChart(stockName, code, stockData.time, stockData.price, parseFloat(stockData.qt[code][4]), stockData.volume, analysisResult, stockChart[0]);
        });

        // 渲染不符合条件的股票
        if (stocksWithoutSideways.length > 0) {
            const noSidewaysContainer = $('<div>').addClass('no-sideways-container mb-4');
            const noSidewaysHeader = $('<div>')
                .addClass('no-sideways-header btn btn-link text-decoration-none')
                .text(`未检测到符合条件的股票 (${stocksWithoutSideways.length} 个)`)
                .css('cursor', 'pointer')
                .click(function () {
                    $(this).next('.no-sideways-list').toggle();
                });

            const noSidewaysList = $('<div>').addClass('no-sideways-list').css('display', 'none');
            stocksWithoutSideways.forEach(({ stockName, code, remark }, index) => {
                const stockItem = $('<div>')
                    .addClass('stock-item')
                    .text(`${index + 1}. ${stockName} (${code}) ${remark ? `[${remark}]` : ''}`);
                noSidewaysList.append(stockItem);
            });

            $('#charts').append(noSidewaysContainer.append(noSidewaysHeader).append(noSidewaysList));
        }
    });

    // 显示 Toast 提示
    function showToast(message) {
        const toast = $('<div>')
            .addClass('toast align-items-center text-bg-success border-0')
            .attr('role', 'alert')
            .css({
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1050
            })
            .append(
                $('<div>')
                    .addClass('d-flex')
                    .append(
                        $('<div>')
                            .addClass('toast-body')
                            .text(message)
                    )
                    .append(
                        $('<button>')
                            .addClass('btn-close btn-close-white me-2 m-auto')
                            .attr('type', 'button')
                            .attr('data-bs-dismiss', 'toast')
                            .attr('aria-label', 'Close')
                    )
            );

        $('body').append(toast);

        const bootstrapToast = new bootstrap.Toast(toast[0], { delay: 3000 });
        bootstrapToast.show();

        toast.on('hidden.bs.toast', () => {
            toast.remove(); // 移除 Toast 元素
        });
    }
});