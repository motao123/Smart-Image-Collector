<?php
/*
 * Smart Image Collector - Web Image Extraction Tool
 * PHP Backend API File
 * 
 * @author 陌涛 (Mo Tao)
 * @version 1.0.0
 * @website https://imotao.com/
 * @license MIT License
 * 
 * Copyright (c) 2025 陌涛 (Mo Tao)
 * All rights reserved.
 * 
 * Professional web image resource extraction tool
 */
// 禁用错误显示，避免HTML错误信息
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class SimpleMediaCatcher {
    private $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    public function handleRequest() {
        try {
            $rawInput = file_get_contents('php://input');
            
            if (empty($rawInput)) {
                throw new Exception('请求数据为空');
            }
            
            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('JSON解析错误: ' . json_last_error_msg());
            }
            
            if (!$input || !isset($input['action'])) {
                throw new Exception('无效的请求格式');
            }
            
            switch ($input['action']) {
                case 'analyze':
                    if (empty($input['url'])) {
                        throw new Exception('URL参数缺失');
                    }
                    return $this->analyzeUrl($input['url'], $input['options'] ?? []);
                case 'download':
                    if (empty($input['url'])) {
                        throw new Exception('下载URL参数缺失');
                    }
                    return $this->downloadFile($input['url']);
                case 'test':
                    return $this->testConnection();
                default:
                    throw new Exception('未知的操作: ' . $input['action']);
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'debug_info' => [
                    'php_version' => phpversion(),
                    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
                    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'unknown',
                    'raw_input_length' => strlen($rawInput ?? ''),
                    'error_line' => $e->getLine(),
                    'error_file' => basename($e->getFile())
                ]
            ];
        } catch (Error $e) {
            return [
                'success' => false,
                'message' => 'PHP错误: ' . $e->getMessage(),
                'debug_info' => [
                    'error_type' => 'PHP Error',
                    'error_line' => $e->getLine(),
                    'error_file' => basename($e->getFile())
                ]
            ];
        }
    }
    
    private function testConnection() {
        return [
            'success' => true,
            'message' => 'API连接正常',
            'php_version' => phpversion(),
            'curl_enabled' => function_exists('curl_init'),
            'dom_enabled' => class_exists('DOMDocument')
        ];
    }
    
    private function analyzeUrl($url, $options = []) {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new Exception('无效的URL格式');
        }
        
        // 获取网页内容
        $html = $this->fetchUrl($url);
        if (!$html) {
            throw new Exception('无法获取网页内容');
        }
        
        // 解析媒体资源
        $resources = $this->parseResources($html, $url, $options);
        
        return [
            'success' => true,
            'resources' => $resources,
            'total' => count($resources),
            'debug' => [
                'html_length' => strlen($html),
                'base_url' => $url
            ]
        ];
    }
    
    private function fetchUrl($url) {
        if (!function_exists('curl_init')) {
            throw new Exception('cURL扩展未安装');
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);
        
        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($content === false) {
            throw new Exception('cURL错误: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP错误: {$httpCode}");
        }
        
        return $content;
    }
    
    private function parseResources($html, $baseUrl, $options) {
        $resources = [];
        
        // 1. img标签中的图片
        if (preg_match_all('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            foreach ($matches[1] as $src) {
                $absoluteUrl = $this->makeAbsolute($src, $baseUrl);
                if ($absoluteUrl && $this->isImage($absoluteUrl)) {
                    $alt = '';
                    if (preg_match('/<img[^>]+src=["\']' . preg_quote($src, '/') . '["\'][^>]*alt=["\']([^"\']*)["\'][^>]*>/i', $html, $altMatch)) {
                        $alt = $altMatch[1];
                    }
                    
                    $resources[] = [
                        'url' => $absoluteUrl,
                        'type' => 'image',
                        'source' => 'img_tag',
                        'alt' => $alt,
                        'size' => $this->getImageSize($absoluteUrl)
                    ];
                }
            }
        }
        
        // 2. CSS背景图片
        if (preg_match_all('/background(?:-image)?\s*:\s*url\(["\']?([^"\')\s]+)["\']?\)/i', $html, $matches)) {
            foreach ($matches[1] as $src) {
                $absoluteUrl = $this->makeAbsolute($src, $baseUrl);
                if ($absoluteUrl && $this->isImage($absoluteUrl)) {
                    $resources[] = [
                        'url' => $absoluteUrl,
                        'type' => 'image',
                        'source' => 'css_background',
                        'alt' => '',
                        'size' => $this->getImageSize($absoluteUrl)
                    ];
                }
            }
        }
        
        // 3. 内联样式中的背景图片
        if (preg_match_all('/style=["\'][^"\']*background[^"\']*url\(["\']?([^"\')\s]+)["\']?\)[^"\']*["\']/', $html, $matches)) {
            foreach ($matches[1] as $src) {
                $absoluteUrl = $this->makeAbsolute($src, $baseUrl);
                if ($absoluteUrl && $this->isImage($absoluteUrl)) {
                    $resources[] = [
                        'url' => $absoluteUrl,
                        'type' => 'image',
                        'source' => 'inline_style',
                        'alt' => '',
                        'size' => $this->getImageSize($absoluteUrl)
                    ];
                }
            }
        }
        
        // 4. 直接的图片URL
        if (preg_match_all('/https?:\/\/[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp|svg|ico)(?:\?[^\s"\'<>]*)?/i', $html, $matches)) {
            foreach ($matches[0] as $url) {
                if ($this->isImage($url)) {
                    $resources[] = [
                        'url' => $url,
                        'type' => 'image',
                        'source' => 'text_url',
                        'alt' => '',
                        'size' => $this->getImageSize($url)
                    ];
                }
            }
        }
        
        // 5. data-src属性（懒加载图片）
        if (preg_match_all('/<img[^>]+data-src=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            foreach ($matches[1] as $src) {
                $absoluteUrl = $this->makeAbsolute($src, $baseUrl);
                if ($absoluteUrl && $this->isImage($absoluteUrl)) {
                    $resources[] = [
                        'url' => $absoluteUrl,
                        'type' => 'image',
                        'source' => 'lazy_load',
                        'alt' => '',
                        'size' => $this->getImageSize($absoluteUrl)
                    ];
                }
            }
        }
        
        // 去重并按大小排序
        $resources = $this->removeDuplicates($resources);
        
        // 按图片大小排序（大图片优先）
        usort($resources, function($a, $b) {
            $sizeA = $a['size'] ?? 0;
            $sizeB = $b['size'] ?? 0;
            return $sizeB - $sizeA;
        });
        
        return $resources;
    }
    
    private function getImageSize($url) {
        try {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_NOBODY => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_USERAGENT => $this->userAgent,
                CURLOPT_SSL_VERIFYPEER => false
            ]);
            
            curl_exec($ch);
            $size = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
            curl_close($ch);
            
            return $size > 0 ? (int)$size : null;
        } catch (Exception $e) {
            return null;
        }
    }
    
    private function makeAbsolute($url, $baseUrl) {
        if (empty($url)) return null;
        
        // 已经是绝对URL
        if (preg_match('/^https?:\/\//', $url)) {
            return $url;
        }
        
        // 协议相对URL
        if (strpos($url, '//') === 0) {
            $scheme = parse_url($baseUrl, PHP_URL_SCHEME);
            return $scheme . ':' . $url;
        }
        
        // 解析基础URL
        $base = parse_url($baseUrl);
        if (!$base) return null;
        
        $scheme = $base['scheme'];
        $host = $base['host'];
        $port = isset($base['port']) ? ':' . $base['port'] : '';
        
        // 绝对路径
        if (strpos($url, '/') === 0) {
            return $scheme . '://' . $host . $port . $url;
        }
        
        // 相对路径
        $path = isset($base['path']) ? $base['path'] : '/';
        $dir = dirname($path);
        if ($dir === '.') $dir = '';
        
        return $scheme . '://' . $host . $port . $dir . '/' . $url;
    }
    
    private function isImage($url) {
        if (empty($url)) return false;
        
        // 检查常见图片扩展名
        if (preg_match('/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i', $url)) {
            return true;
        }
        
        // 检查是否包含图片相关关键词
        if (preg_match('/\/(image|img|photo|pic|avatar|thumb|banner|logo)\//i', $url) && 
            preg_match('/^https?:\/\//', $url)) {
            return true;
        }
        
        return false;
    }
    
    private function removeDuplicates($resources) {
        $unique = [];
        $urls = [];
        
        foreach ($resources as $resource) {
            if (!in_array($resource['url'], $urls)) {
                $urls[] = $resource['url'];
                $unique[] = $resource;
            }
        }
        
        return $unique;
    }
    
    private function downloadFile($url) {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new Exception('无效的URL');
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_REFERER => $url
        ]);
        
        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);
        
        if ($httpCode !== 200 || $content === false) {
            throw new Exception('下载失败');
        }
        
        // 设置适当的响应头
        header('Content-Type: ' . $contentType);
        header('Content-Length: ' . strlen($content));
        header('Content-Disposition: attachment; filename="' . basename(parse_url($url, PHP_URL_PATH)) . '"');
        
        echo $content;
        exit;
    }
}

// 处理请求
$catcher = new SimpleMediaCatcher();
$response = $catcher->handleRequest();
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>