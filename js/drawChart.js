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

    // 绘制昨日收盘价的虚线

    for(let i = -5; i < 6; i++) {
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', yScale(yesterdayClose*(1+i*0.02)))
            .attr('x2', chartWidth - margin.left - margin.right)
            .attr('y2', yScale(yesterdayClose*(1+i*0.02)))
            .attr('stroke', 'gray')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,'+Math.abs(i*2)); // 虚线
        svg.append('text')
            .attr('x', chartWidth - margin.left - margin.right-10) // 向左偏移 10 像素
            .attr('y', yScale(yesterdayClose*(1+i*0.02)) ) // 向下偏移 5 像素以居中
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .style('fill', 'gray')
            .text(i*2 + '%');  
    }


    // 绘制横盘和拉升区域
    sidewaysAnalysis.forEach(region => {
        // 横盘区域的时间范围
        const startX = xScale(time[region.start]);
        const endX = xScale(time[region.end]);

        // 横盘区域的价格范围
        const priceRange = price.slice(region.start, region.end + 1); // 提取横盘区域的价格数据
        const minPrice = Math.min(...priceRange); // 横盘区域最低点
        const maxPrice = Math.max(...priceRange); // 横盘区域最高点

        // 映射到图表的 Y 坐标
        const minY = yScale(maxPrice); // 注意：Y 坐标是从上到下的，价格越高 Y 越小
        const maxY = yScale(minPrice);

        // 绘制横盘区域矩形
        svg.append('rect')
            .attr('x', startX)
            .attr('y', minY) // 从最高点开始
            .attr('width', endX - startX)
            .attr('height', maxY - minY) // 高度为最低点和最高点之间的差
            .attr('fill', 'yellow')
            .attr('opacity', 0.3); // 半透明效果

        // 在横盘均价附近注明横盘时长
        const avgX = (startX + endX) / 2; // 横盘区域的中间位置
        const avgY = (minY + maxY) / 2; // 横盘区域的中间高度
        const duration = region.end - region.start + 1; // 横盘时长（分钟）
        svg.append('text')
            .attr('x', avgX)
            .attr('y', avgY - 15) // 向上移动 15 像素
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', 'black')
            .text(`${duration}分钟`);
            
        // 绘制横盘前的拉升线
        if (region.uptrendBefore) {
            const { uptrendStartIndex, uptrendEndIndex, uptrendPercent } = region.uptrendBefore;

            // 计算拉升线中点坐标
            const midX = (xScale(time[uptrendStartIndex]) + xScale(time[uptrendEndIndex])) / 2;
            const midY = (yScale(price[uptrendStartIndex]) + yScale(price[uptrendEndIndex])) / 2;

            svg.append('line')
                .attr('x1', xScale(time[uptrendStartIndex]))
                .attr('y1', yScale(price[uptrendStartIndex]))
                .attr('x2', xScale(time[uptrendEndIndex]))
                .attr('y2', yScale(price[uptrendEndIndex]))
                .attr('stroke', 'red')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4,4'); // 虚线

            // 在拉升线中点右侧注明拉升百分比
            svg.append('text')
                .attr('x', midX + 5) // 向右偏移 5 像素
                .attr('y', midY) // 保持在中点高度
                .attr('text-anchor', 'start')
                .style('font-size', '12px')
                .style('fill', 'red')
                .text(`${uptrendPercent.toFixed(2)}%`);
        }

        // 绘制横盘后的拉升线
        if (region.uptrendAfter) {
            const { uptrendStartIndex, uptrendEndIndex, uptrendPercent } = region.uptrendAfter;

            // 计算拉升线中点坐标
            const midX = (xScale(time[uptrendStartIndex]) + xScale(time[uptrendEndIndex])) / 2;
            const midY = (yScale(price[uptrendStartIndex]) + yScale(price[uptrendEndIndex])) / 2;

            svg.append('line')
                .attr('x1', xScale(time[uptrendStartIndex]))
                .attr('y1', yScale(price[uptrendStartIndex]))
                .attr('x2', xScale(time[uptrendEndIndex]))
                .attr('y2', yScale(price[uptrendEndIndex]))
                .attr('stroke', 'green')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4,4'); // 虚线

            // 在拉升线中点右侧注明拉升百分比
            svg.append('text')
                .attr('x', midX + 5) // 向右偏移 5 像素
                .attr('y', midY) // 保持在中点高度
                .attr('text-anchor', 'start')
                .style('font-size', '12px')
                .style('fill', 'green')
                .text(`${uptrendPercent.toFixed(2)}%`);
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