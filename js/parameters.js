const parameters = {
    minDuration: 15,
    maxPriceRangePercent: 2,
    uptrendThreshold: 3,
    uptrendMaxDuration: 30,
    maxSidewaysHeight: 7,
    minSidewaysHeight: 1 // 新增参数：横盘高度下限百分比
};

function updateParameters() {
    // 更新参数
    parameters.minDuration = parseInt($('#minDuration').val());
    parameters.maxPriceRangePercent = parseFloat($('#maxPriceRangePercent').val());
    parameters.uptrendThreshold = parseFloat($('#uptrendThreshold').val());
    parameters.uptrendMaxDuration = parseInt($('#uptrendMaxDuration').val());
    parameters.maxSidewaysHeight = parseFloat($('#maxSidewaysHeight').val());
    parameters.minSidewaysHeight = parseFloat($('#minSidewaysHeight').val());

    // 禁用按钮
    const applyButton = $('#applyParameters');
    applyButton.prop('disabled', true);

    // 显示 Toast 提示
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
                        .text('参数已更新！')
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

    // 初始化并显示 Toast
    const bootstrapToast = new bootstrap.Toast(toast[0], { delay: 3000 });
    bootstrapToast.show();

    // 等待 Toast 消失后恢复按钮状态
    toast.on('hidden.bs.toast', () => {
        applyButton.prop('disabled', false);
        toast.remove(); // 移除 Toast 元素
    });
}