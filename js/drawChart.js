function drawChart(stockName, stockCode, time, price, yesterdayClose, volume, sidewaysAnalysis, container) {
    // 获取容器的实际宽度，并限制最大宽度为屏幕宽度
    const containerWidth = container.clientWidth; // 使用 clientWidth 获取容器宽度
    const chartWidth = containerWidth; // 不再减去额外的边距
    const chartHeight = 300;
    const volumeChartHeight = 100;
    const margin = { top: 40, right: 20, bottom: 30, left: 50 };

    const svg = d3.select(container)
        .append('svg')
        .attr('width', chartWidth) // 直接使用容器宽度
        .attr('height', chartHeight + volumeChartHeight + margin.top + margin.bottom + 60)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint().domain(time).range([0, chartWidth - margin.left - margin.right]);
    const yScale = d3.scaleLinear().domain([yesterdayClose * 0.9, yesterdayClose * 1.1]).range([chartHeight, 0]);
    const volumeScale = d3.scaleLinear().domain([0, d3.max(volume)]).range([volumeChartHeight, 0]);

    const xAxis = d3.axisBottom(xScale).tickValues(time.filter((_, i) => i % 30 === 0));
    const yAxis = d3.axisLeft(yScale);

    svg.append('g').attr('transform', `translate(0,${chartHeight})`).call(xAxis);
    svg.append('g').call(yAxis);

    // 绘制价格折线图
    const line = d3.line().x((_, i) => xScale(time[i])).y((_, i) => yScale(price[i]));
    svg.append('path').datum(price).attr('fill', 'none').attr('stroke', 'steelblue').attr('stroke-width', 1.5).attr('d', line);

    // 添加标题
    svg.append('text').attr('x', chartWidth / 2).attr('y', -20).attr('text-anchor', 'middle').style('font-size', '16px').text(`${stockName} (${stockCode})`);

    // 绘制横盘区域
    sidewaysAnalysis.forEach(region => {
        const startX = xScale(time[region.start]);
        const endX = xScale(time[region.end]);
        const avgX = (startX + endX) / 2; // 横盘区域的中间位置
        const avgY = yScale(region.avgPrice); // 横盘均价对应的 Y 坐标

        svg.append('rect')
            .attr('x', startX)
            .attr('y', 0)
            .attr('width', endX - startX)
            .attr('height', chartHeight)
            .attr('fill', 'yellow')
            .attr('opacity', 0.3); // 半透明效果

        // 在横盘均价附近注明横盘时长，稍微向上移动
        const duration = region.end - region.start + 1; // 横盘时长（分钟）
        svg.append('text')
            .attr('x', avgX)
            .attr('y', avgY - 15) // 向上移动 15 像素
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', 'black')
            .text(`${duration}分钟`);

        // 绘制拉升线
        if (region.hasUptrend) {
            const uptrendStartX = xScale(time[region.uptrendStartIndex]);
            const uptrendStartY = yScale(region.uptrendStartPrice);
            const uptrendEndX = xScale(time[region.start]);
            const uptrendEndY = yScale(price[region.start]);

            svg.append('line')
                .attr('x1', uptrendStartX)
                .attr('y1', uptrendStartY)
                .attr('x2', uptrendEndX)
                .attr('y2', uptrendEndY)
                .attr('stroke', 'red')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4,4'); // 虚线效果

            // 在拉升线下方注明拉升幅度
            const uptrendPercent = region.uptrendPercent; // 拉升幅度
            const labelX = (uptrendStartX + uptrendEndX) / 2; // 拉升线的中间位置
            const labelY = Math.max(uptrendStartY, uptrendEndY) + 15; // 拉升线下方

            svg.append('text')
                .attr('x', labelX)
                .attr('y', labelY) // 拉升线下方
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', 'red')
                .text(`${uptrendPercent}%`);
        }
    });

    // 绘制成交量柱形图
    const volumeGroup = svg.append('g').attr('transform', `translate(0,${chartHeight + 20})`);
    volumeGroup.selectAll('.bar')
        .data(volume)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (_, i) => xScale(time[i]) - 2)
        .attr('y', d => volumeScale(d))
        .attr('width', 4)
        .attr('height', d => volumeChartHeight - volumeScale(d))
        .attr('fill', 'orange');
}