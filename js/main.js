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

        for (let i = 0; i < stockCodes.length; i++) {
            const { code, remark } = stockCodes[i];
            queryButton.text(`正在查询第 ${i + 1} 个股票，代码 ${code}`);
            try {
                const stockData = await fetchStockData(code);
                const sidewaysAnalysis = analyzeSidewaysWithUptrend(
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

                if (sidewaysAnalysis.length > 0) {
                    stocksWithSideways.push({ stockName: stockData.qt[code][1], code, remark, stockData, sidewaysAnalysis });
                } else {
                    stocksWithoutSideways.push({ stockName: stockData.qt[code][1], code, remark });
                }
            } catch (error) {
                alert(`股票代码 ${code} 查询失败：${error.message}`);
            }
        }

        queryButton.prop('disabled', false).text('查询');

        // 渲染符合拉升横盘的股票
        stocksWithSideways.forEach(({ stockName, code, remark, stockData, sidewaysAnalysis }, index) => {
            const stockContainer = $('<div>').addClass('stock-container mb-4');

            // 股票名称部分，点击展开或折叠分时图
            const stockNameElement = $('<span>')
                .addClass('stock-name')
                .text(`${index + 1}. ${stockName}`)
                .css('cursor', 'pointer')
                .click(function () {
                    $(this).closest('.stock-container').find('.stock-chart').toggle();
                });

            // 股票代码部分，点击复制代码
            const stockCodeElement = $('<span>')
                .addClass('stock-code ms-2 text-primary')
                .text(`(${code})`)
                .css('cursor', 'pointer')
                .click(function () {
                    const numericCode = code.slice(2); // 去掉前缀 sz/sh，只保留6位数字
                    navigator.clipboard.writeText(numericCode).then(() => {
                        showToast(`股票代码 ${numericCode} 已复制到剪贴板！`);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                });

            // 备注部分
            const stockRemarkElement = $('<span>')
                .addClass('stock-remark ms-2 text-muted')
                .text(remark ? `[${remark}]` : '');

            const stockHeader = $('<div>')
                .addClass('stock-header')
                .append(stockNameElement)
                .append(stockCodeElement)
                .append(stockRemarkElement);

            const stockChart = $('<div>').addClass('stock-chart').css('display', 'block');
            $('#charts').append(stockContainer.append(stockHeader).append(stockChart));

            drawChart(stockName, code, stockData.time, stockData.price, parseFloat(stockData.qt[code][4]), stockData.volume, sidewaysAnalysis, stockChart[0]);
        });

        // 渲染不符合拉升横盘的股票
        if (stocksWithoutSideways.length > 0) {
            const noSidewaysContainer = $('<div>').addClass('no-sideways-container mb-4');
            const noSidewaysHeader = $('<div>')
                .addClass('no-sideways-header btn btn-link text-decoration-none')
                .text(`未检测到拉升横盘的股票 (${stocksWithoutSideways.length} 个)`)
                .css('cursor', 'pointer')
                .click(function () {
                    $(this).next('.no-sideways-list').toggle();
                });

            const noSidewaysList = $('<div>').addClass('no-sideways-list').css('display', 'none');
            stocksWithoutSideways.forEach(({ stockName, code, remark }, index) => {
                const stockItem = $('<div>')
                    .addClass('stock-item')
                    .html(`${index + 1}. <span class="stock-name">${stockName}</span> <span class="stock-code text-primary" style="cursor: pointer;">(${code})</span> ${remark ? `<span class="stock-remark text-muted">[${remark}]</span>` : ''}`)
                    .find('.stock-code')
                    .click(function () {
                        const numericCode = code.slice(2); // 去掉前缀 sz/sh，只保留6位数字
                        navigator.clipboard.writeText(numericCode).then(() => {
                            showToast(`股票代码 ${numericCode} 已复制到剪贴板！`);
                        }).catch(err => {
                            console.error('复制失败:', err);
                        });
                    }).end();

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