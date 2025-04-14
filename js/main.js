$(document).ready(function () {
    initializeParametersForm();

    // 动态绑定参数输入框和复选框的 change 事件
    $('#parameterForm input').on('change', function () {
        updateParameters(); // 调用参数更新函数
    });

    // 动态加载股票文件列表
    async function loadStockFiles() {
        try {
            const response = await fetch('./listFiles.php');
            if (!response.ok) throw new Error('无法加载文件列表');
            const fileList = await response.json();

            if (fileList.error) {
                throw new Error(fileList.error);
            }

            const options = fileList.map(file => {
                const baseName = file.name.replace(/^.*[\\/]/, '').replace(/\.txt$/, '');
                return `<option value="${file.name}">${baseName} (${file.lineCount} 个股票)</option>`;
            });

            $('#fileSelector').html(options.join('')); // 一次性更新 DOM
            $('#fileInfo').text('文件列表加载完成');
        } catch (error) {
            console.error('加载文件列表失败:', error);
            $('#fileInfo').text('加载文件列表失败，请检查网络或文件夹是否存在');
        }
    }

    // 加载文件列表
    loadStockFiles();

    // 初始化横盘前/后拉升参数显示状态
    toggleUptrendBeforeParams();
    toggleUptrendAfterParams();

    $('#queryButton').click(async function () {
        let stockEntries = $('#stockCodes').val().split(',').map(code => ({ code: code.trim(), remark: '' })).filter(entry => entry.code);

        // 如果用户未输入股票代码，则根据文件选择器加载默认文件
        if (stockEntries.length === 0) {
            const selectedFile = $('#fileSelector').val(); // 获取文件选择器的值
            stockEntries = await loadStockCodesFromFile(selectedFile); // 从文件加载股票代码和备注
        }

        $('#charts').empty();
        const stocksWithSideways = [];
        const stocksWithoutSideways = [];
        const queryButton = $('#queryButton');
        queryButton.prop('disabled', true);

        for (let i = 0; i < stockEntries.length; i++) {
            const { code, remark } = stockEntries[i];
            queryButton.text(`正在查询第 ${i + 1} 个股票，代码 ${code}`);
            try {
                const stockData = await fetchStockData(code);

                // 分析横盘和拉升
                const analysisResult = analyzeSidewaysWithUptrend(
                    stockData.price,
                    stockData.time,
                    { ...parameters, yesterdayClose: stockData.yesterdayClose } // 使用 API 返回的 yesterdayClose
                );

                if (analysisResult.length > 0) {
                    stocksWithSideways.push({ stockName: stockData.qt[code][1], code, remark, stockData, analysisResult });
                } else {
                    stocksWithoutSideways.push({ stockName: stockData.qt[code][1], code, remark });
                }
            } catch (error) {
                showError(`股票代码 ${code} 查询失败：${error.message}`);
            }
        }

        queryButton.prop('disabled', false).text('查询');

        // 渲染符合条件的股票
        stocksWithSideways.forEach(({ stockName, code, remark, stockData, analysisResult }, index) => {
            const stockContainer = $('<div>').addClass('stock-container mb-4');

            // 股票名称（点击折叠分时图）
            const stockHeader = $('<div>')
                .addClass('stock-header')
                .html(`${index + 1}. <span class="stock-name">${stockName}</span> (<span class="stock-code">${code}</span>) ${remark}`) // 添加股票名称和代码
                .css('cursor', 'pointer')
                .click(function (event) {
                    if ($(event.target).hasClass('stock-code')) {
                        // 如果点击的是股票代码，复制代码
                        const numericCode = code.slice(2); // 提取6位数字代码
                        navigator.clipboard.writeText(numericCode).then(() => {
                            showToast(`股票代码 ${numericCode} 已复制到剪贴板`, 'success');
                        }).catch(() => {
                            showToast('复制失败，请手动复制', 'danger');
                        });
                    } else {
                        // 如果点击的是股票名称，折叠分时图
                        $(this).next('.stock-chart').toggle();
                    }
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
                    .html(`${index + 1}. <span class="stock-name">${stockName}</span> (<span class="stock-code">${code}</span>) ${remark}`) // 添加股票名称和代码
                    .css('cursor', 'pointer')
                    .click(function (event) {
                        if ($(event.target).hasClass('stock-code')) {
                            // 如果点击的是股票代码，复制代码
                            const numericCode = code.slice(2); // 提取6位数字代码
                            navigator.clipboard.writeText(numericCode).then(() => {
                                showToast(`股票代码 ${numericCode} 已复制到剪贴板`, 'success');
                            }).catch(() => {
                                showToast('复制失败，请手动复制', 'danger');
                            });
                        }
                    });

                noSidewaysList.append(stockItem);
            });

            $('#charts').append(noSidewaysContainer.append(noSidewaysHeader).append(noSidewaysList));
        }
    });

    async function loadStockCodesFromFile(fileName) {
        try {
            const filePath = `./stockcodes/${fileName}`;
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`无法加载文件 ${filePath}`);
            const text = await response.text();

            // 解析股票代码和备注
            return text
                .split('\n')
                .map(line => {
                    const parts = line.trim().split(/\s+/); // 按空格分隔
                    if (parts.length > 1) {
                        return { code: parts[0], remark: parts.slice(1).join(' ') }; // 股票代码和备注
                    } else if (parts.length === 1) {
                        return { code: parts[0], remark: '' }; // 没有备注时，备注为空
                    }
                    return null;
                })
                .filter(entry => entry && entry.code && !entry.code.startsWith('//')); // 过滤空行和注释
        } catch (error) {
            console.error(`读取文件 ${fileName} 失败:`, error);
            showError(`读取文件 ${fileName} 失败，请检查文件是否存在或网络是否正常。`);
            return [];
        }
    }
});

function toggleUptrendBeforeParams() {
    const isChecked = $('#enableUptrendBeforeSideways').is(':checked');
    if (isChecked) {
        $('#uptrendBeforeSidewaysParams').show();
    } else {
        $('#uptrendBeforeSidewaysParams').hide();
    }
}

function toggleUptrendAfterParams() {
    const isChecked = $('#enableUptrendAfterSideways').is(':checked');
    if (isChecked) {
        $('#uptrendAfterSidewaysParams').show();
    } else {
        $('#uptrendAfterSidewaysParams').hide();
    }
}

function showError(message) {
    const toast = $('<div>')
        .addClass('toast align-items-center text-bg-danger border-0')
        .attr('role', 'alert')
        .css({ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1050 })
        .append(
            $('<div>').addClass('d-flex')
                .append($('<div>').addClass('toast-body').text(message))
                .append($('<button>').addClass('btn-close btn-close-white me-2 m-auto').attr('type', 'button').attr('data-bs-dismiss', 'toast'))
        );

    $('body').append(toast);
    const bootstrapToast = new bootstrap.Toast(toast[0], { delay: 3000 });
    bootstrapToast.show();
    toast.on('hidden.bs.toast', () => toast.remove());
}

function showToast(message, type) {
    const toast = $('<div>')
        .addClass(`toast align-items-center text-bg-${type} border-0`)
        .attr('role', 'alert')
        .css({ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1050 })
        .append(
            $('<div>').addClass('d-flex')
                .append($('<div>').addClass('toast-body').text(message))
                .append($('<button>').addClass('btn-close btn-close-white me-2 m-auto').attr('type', 'button').attr('data-bs-dismiss', 'toast'))
        );

    $('body').append(toast);
    const bootstrapToast = new bootstrap.Toast(toast[0], { delay: 3000 });
    bootstrapToast.show();
    toast.on('hidden.bs.toast', () => toast.remove());
}