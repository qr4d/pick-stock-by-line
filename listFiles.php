<?php
// 设置响应头，允许跨域（如果需要）
header('Content-Type: application/json');

// 定义文件夹路径
$directory = __DIR__ . '/stockcodes';

// 定义缓存文件路径和缓存时间
$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/fileList.json';
$cacheTime = 3600; // 缓存时间（秒）

// 检查并创建缓存目录
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true); // 创建目录，权限为 0755
}

// 检查缓存文件是否存在且未过期
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    echo file_get_contents($cacheFile);
    exit;
}

// 检查文件夹是否存在
if (!is_dir($directory)) {
    http_response_code(404);
    echo json_encode(['error' => '目录不存在']);
    exit;
}

// 获取文件列表
$files = array_diff(scandir($directory), ['.', '..']); // 排除 . 和 .. 目录

// 构建文件信息数组
$fileList = [];
foreach ($files as $file) {
    $filePath = $directory . '/' . $file;

    // 仅处理 .txt 文件
    if (is_file($filePath) && pathinfo($file, PATHINFO_EXTENSION) === 'txt') {
        $lineCount = count(file($filePath)); // 统计文件行数
        $fileList[] = [
            'name' => $file,
            'lineCount' => $lineCount
        ];
    }
}

// 缓存结果
file_put_contents($cacheFile, json_encode($fileList));

// 返回 JSON 格式的文件列表
echo json_encode($fileList);