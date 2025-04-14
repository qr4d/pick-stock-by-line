const defaultParameters = {
    minSidewaysDuration: 15,
    maxSidewaysRange: 2,
    minSidewaysHeight: 1,
    maxSidewaysHeight: 7,
    enableUptrendBeforeSideways: true,
    minUptrendBeforePercent: 3,
    maxUptrendBeforeDuration: 20,
    enableUptrendAfterSideways: true,
    minUptrendAfterPercent: 3,
    maxUptrendAfterDuration: 20,
    maxGapToSideways: 5
};

const parameters = { ...defaultParameters };

function initializeParametersForm() {
    $('#minSidewaysDuration').val(defaultParameters.minSidewaysDuration);
    $('#maxSidewaysRange').val(defaultParameters.maxSidewaysRange);
    $('#minSidewaysHeight').val(defaultParameters.minSidewaysHeight);
    $('#maxSidewaysHeight').val(defaultParameters.maxSidewaysHeight);
    $('#enableUptrendBeforeSideways').prop('checked', defaultParameters.enableUptrendBeforeSideways);
    $('#minUptrendBeforePercent').val(defaultParameters.minUptrendBeforePercent);
    $('#maxUptrendBeforeDuration').val(defaultParameters.maxUptrendBeforeDuration);
    $('#enableUptrendAfterSideways').prop('checked', defaultParameters.enableUptrendAfterSideways);
    $('#minUptrendAfterPercent').val(defaultParameters.minUptrendAfterPercent);
    $('#maxUptrendAfterDuration').val(defaultParameters.maxUptrendAfterDuration);
}

function updateParameters() {
    parameters.minSidewaysDuration = parseInt($('#minSidewaysDuration').val());
    parameters.maxSidewaysRange = parseFloat($('#maxSidewaysRange').val());
    parameters.minSidewaysHeight = parseFloat($('#minSidewaysHeight').val());
    parameters.maxSidewaysHeight = parseFloat($('#maxSidewaysHeight').val());
    parameters.enableUptrendBeforeSideways = $('#enableUptrendBeforeSideways').is(':checked');
    parameters.minUptrendBeforePercent = parseFloat($('#minUptrendBeforePercent').val());
    parameters.maxUptrendBeforeDuration = parseInt($('#maxUptrendBeforeDuration').val());
    parameters.enableUptrendAfterSideways = $('#enableUptrendAfterSideways').is(':checked');
    parameters.minUptrendAfterPercent = parseFloat($('#minUptrendAfterPercent').val());
    parameters.maxUptrendAfterDuration = parseInt($('#maxUptrendAfterDuration').val());

    console.log('参数已更新:', parameters); // 调试输出
}