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
class ImageCollector {
    constructor() {
        this.images = [];
        this.selectedImages = new Set();
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEvents();
            });
        } else {
            this.bindEvents();
        }
        console.log('🖼️ 智能图片采集器已启动 - v1.0.0');
    }

    bindEvents() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const urlInput = document.getElementById('urlInput');
        const selectAllBtn = document.getElementById('selectAllBtn');
        const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeUrl();
            });
        }

        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.analyzeUrl();
                }
            });
        }

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.toggleSelectAll();
            });
        }

        if (downloadSelectedBtn) {
            downloadSelectedBtn.addEventListener('click', () => {
                this.downloadSelected();
            });
        }
    }

    async analyzeUrl() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('请输入有效的URL地址');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showError('请输入有效的URL格式');
            return;
        }

        this.showLoading(true);
        this.hideError();
        this.hideResults();
        this.hideBatchNotice();

        try {
            const response = await fetch('api_fixed.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'analyze',
                    url: url,
                    options: {
                        includeImages: true
                    }
                })
            });

            const responseText = await response.text();
            console.log('API原始响应:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON解析错误:', jsonError);
                console.error('响应内容:', responseText);
                
                if (responseText.includes('<br />') || responseText.includes('<b>')) {
                    this.showError('服务器返回了PHP错误信息，请检查服务器配置或查看浏览器控制台');
                } else {
                    this.showError('服务器响应格式错误: ' + jsonError.message);
                }
                return;
            }

            console.log('API解析后数据:', data);

            if (data.success) {
                this.images = Array.isArray(data.resources) ? data.resources : [];
                
                if (this.images.length === 0) {
                    this.showError('未找到任何图片资源，可能是网站结构特殊或有防爬虫保护');
                } else {
                    this.displayResults();
                }
            } else {
                let errorMsg = data.message || '分析失败，请检查URL是否正确';
                if (data.debug_info) {
                    console.error('调试信息:', data.debug_info);
                    errorMsg += '\n\n调试信息已输出到控制台';
                }
                this.showError(errorMsg);
            }
        } catch (error) {
            console.error('分析错误:', error);
            if (error.message.includes('Failed to fetch')) {
                this.showError('无法连接到服务器，请检查PHP服务是否正常运行');
            } else {
                this.showError('分析失败: ' + error.message);
            }
        } finally {
            this.showLoading(false);
        }
    }

    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        const resultsCount = document.getElementById('resultsCount');
        const imagesGrid = document.getElementById('imagesGrid');
        const emptyState = document.getElementById('emptyState');

        resultsCount.textContent = `找到 ${this.images.length} 张图片`;
        imagesGrid.innerHTML = '';

        this.images.forEach((image, index) => {
            const card = this.createImageCard(image, index);
            imagesGrid.appendChild(card);
        });

        resultsSection.style.display = 'block';
        emptyState.style.display = 'none';

        this.selectedImages.clear();
        this.updateSelectedCount();
    }

    createImageCard(image, index) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const sizeText = image.size ? this.formatFileSize(image.size) : '未知大小';
        const sourceText = this.getSourceLabel(image.source);
        
        card.innerHTML = `
            <div class="image-preview">
                <div class="image-loading"></div>
                <img src="${image.url}" alt="${image.alt || '图片'}" 
                     onload="this.previousElementSibling.style.display='none'; this.style.display='block';"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     style="display:none;">
                <div class="image-placeholder" style="display:none;">
                    <i class="fas fa-image-slash"></i>
                </div>
            </div>
            <div class="image-info">
                <div class="image-url">${this.truncateUrl(image.url)}</div>
                <div class="image-meta">
                    <span class="image-source">${sourceText}</span>
                    <span class="image-size">${sizeText}</span>
                </div>
                <div class="image-actions">
                    <input type="checkbox" class="image-select-checkbox" data-index="${index}" id="select-${index}">
                    <button class="download-btn" onclick="imageCollector.downloadImage(${index})">
                        <i class="fas fa-download"></i> 下载
                    </button>
                    <button class="preview-btn" onclick="imageCollector.previewImage('${image.url}')">
                        <i class="fas fa-eye"></i> 预览
                    </button>
                </div>
            </div>
        `;

        const selectCheckbox = card.querySelector('.image-select-checkbox');
        
        // 复选框事件
        selectCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedImages.add(index);
            } else {
                this.selectedImages.delete(index);
            }
            this.updateSelectedCount();
        });

        return card;
    }

    getSourceLabel(source) {
        const labels = {
            'img_tag': 'IMG标签',
            'css_background': 'CSS背景',
            'inline_style': '内联样式',
            'text_url': '文本URL',
            'lazy_load': '懒加载'
        };
        return labels[source] || source || '未知来源';
    }

    truncateUrl(url, maxLength = 60) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    toggleSelectAll() {
        const selectAllBtn = document.getElementById('selectAllBtn');
        const selectCheckboxes = document.querySelectorAll('.image-select-checkbox');
        
        if (this.selectedImages.size === this.images.length) {
            this.selectedImages.clear();
            selectCheckboxes.forEach(cb => cb.checked = false);
            selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> 全选';
        } else {
            this.selectedImages.clear();
            selectCheckboxes.forEach((cb, index) => {
                cb.checked = true;
                this.selectedImages.add(index);
            });
            selectAllBtn.innerHTML = '<i class="fas fa-square"></i> 取消全选';
        }
        
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const downloadBtn = document.getElementById('downloadSelectedBtn');
        const selectAllBtn = document.getElementById('selectAllBtn');
        
        downloadBtn.textContent = `下载选中 (${this.selectedImages.size})`;
        downloadBtn.disabled = this.selectedImages.size === 0;
        
        if (this.selectedImages.size === this.images.length && this.images.length > 0) {
            selectAllBtn.innerHTML = '<i class="fas fa-square"></i> 取消全选';
        } else {
            selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> 全选';
        }
    }

    async downloadImage(index) {
        const image = this.images[index];
        
        try {
            const response = await fetch('api_fixed.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'download',
                    url: image.url
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const fileName = this.getFileName(image.url);
                this.downloadBlob(blob, fileName);
            } else {
                console.error('下载失败:', image.url);
                this.showError('下载失败，请稍后重试');
            }
        } catch (error) {
            console.error('下载错误:', error);
            this.showError('下载失败: ' + error.message);
        }
    }

    async downloadSelected() {
        if (this.selectedImages.size === 0) return;

        // 显示批量下载提醒
        this.showBatchNotice();

        const selectedArray = Array.from(this.selectedImages);
        let successCount = 0;
        let failCount = 0;

        // 更新按钮状态
        const downloadBtn = document.getElementById('downloadSelectedBtn');
        const originalText = downloadBtn.textContent;
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 下载中...';

        for (let i = 0; i < selectedArray.length; i++) {
            const index = selectedArray[i];
            try {
                await this.downloadImage(index);
                successCount++;
                
                // 更新进度
                downloadBtn.textContent = `下载中... (${i + 1}/${selectedArray.length})`;
                
                // 延迟0.5秒，避免浏览器阻止
                if (i < selectedArray.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                failCount++;
                console.error('批量下载错误:', error);
            }
        }

        // 恢复按钮状态
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;

        // 隐藏提醒并显示结果
        this.hideBatchNotice();
        
        if (failCount > 0) {
            this.showError(`批量下载完成！成功下载 ${successCount} 张图片，失败 ${failCount} 张`);
        } else {
            this.showError(`批量下载完成！成功下载 ${successCount} 张图片`, 'success');
        }
    }

    previewImage(url) {
        window.open(url, '_blank');
    }

    getFileName(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            
            if (filename && filename.includes('.')) {
                return filename;
            }
            
            const timestamp = new Date().getTime();
            const extension = this.getImageExtension(url) || 'jpg';
            return `image_${timestamp}.${extension}`;
        } catch (error) {
            const timestamp = new Date().getTime();
            return `image_${timestamp}.jpg`;
        }
    }

    getImageExtension(url) {
        const match = url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)(\?.*)?$/i);
        return match ? match[1].toLowerCase() : null;
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (show) {
            loading.style.display = 'block';
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 采集中...';
        } else {
            loading.style.display = 'none';
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> 开始采集';
        }
    }

    showError(message, type = 'error') {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        
        if (type === 'success') {
            errorDiv.style.background = '#d4edda';
            errorDiv.style.color = '#155724';
            errorDiv.style.borderLeftColor = '#28a745';
        } else {
            errorDiv.style.background = '#fee';
            errorDiv.style.color = '#c33';
            errorDiv.style.borderLeftColor = '#c33';
        }
        
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.style.display = 'none';
    }

    showBatchNotice() {
        const noticeDiv = document.getElementById('batchNotice');
        noticeDiv.style.display = 'block';
    }

    hideBatchNotice() {
        const noticeDiv = document.getElementById('batchNotice');
        noticeDiv.style.display = 'none';
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        const emptyState = document.getElementById('emptyState');
        
        resultsSection.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// 初始化应用
const imageCollector = new ImageCollector();