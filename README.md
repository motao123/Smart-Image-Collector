# Smart Image Collector - 智能图片采集器

> Professional web image resource extraction tool - 专业的网页图片资源提取工具

## 📖 Project Information | 项目信息

**Author:** 陌涛 (Mo Tao)  
**Version:** 1.0.0  
**Website:** https://imotao.com/  
**License:** MIT License  

## 📋 Description | 项目简介

Smart Image Collector is a professional web image extraction tool that can intelligently identify and extract various image resources from web pages. It supports multiple image sources including IMG tags, CSS background images, inline styles, lazy-loaded images, etc.

智能图片采集器是一个专业的网页图片提取工具，能够智能识别和提取网页中的各种图片资源。支持多种图片来源，包括IMG标签、CSS背景图片、内联样式、懒加载图片等。

## ✨ Features | 主要功能

- 🖼️ **Smart Image Extraction** - Support for 5 different image sources | **智能图片提取** - 支持5种不同来源的图片提取
- 📥 **Batch Download** - Support for single and batch download functions | **批量下载** - 支持单个和批量下载功能
- 🎨 **Modern Interface** - Purple-blue gradient background, responsive design | **现代化界面** - 紫蓝渐变背景，响应式设计
- ⚡ **Smart Sorting** - Automatic sorting by image size, large images first | **智能排序** - 按图片大小自动排序，大图片优先
- 💡 **User-friendly Tips** - Friendly reminders during batch downloads | **友好提示** - 批量下载时显示温馨提醒

## 🚀 Quick Start | 快速开始

### System Requirements | 环境要求
- PHP 7.0 or higher | PHP 7.0 或更高版本
- cURL and DOM extensions enabled | 启用 cURL 和 DOM 扩展

### Installation & Usage | 安装使用
1. Download project files to local directory | 下载项目文件到本地目录
2. Start PHP built-in server | 启动PHP内置服务器：
   ```bash
   php -S localhost:8000
   ```
3. Access in browser | 在浏览器中访问：`http://localhost:8000`

### How to Use | 使用方法
1. Enter the URL of the webpage to analyze | 在输入框中输入要分析的网页URL
2. Click "Start Collection" button | 点击"开始采集"按钮
3. Wait for analysis to complete, view extracted images | 等待分析完成，查看提取到的图片
4. Check desired images (checkbox next to download button) | 勾选需要的图片（复选框在下载按钮旁边）
5. Click "Download Selected" for batch download | 点击"下载选中"进行批量下载

## 📁 Project Structure | 项目结构

```
Smart Image Collector/
├── index.html      # Main page | 主页面
├── style.css       # Stylesheet | 样式文件
├── script.js       # JavaScript logic | JavaScript逻辑
├── api_fixed.php   # PHP backend API | PHP后端API
└── README.md       # Project documentation | 项目说明
```

## 🔧 Technical Features | 技术特点

- **Separated Architecture** - HTML, CSS, JavaScript completely separated | **分离式架构** - HTML、CSS、JavaScript完全分离
- **Image-focused** - Removed video/audio features, optimized for image extraction | **专注图片** - 移除视频音频功能，专门优化图片提取
- **Comprehensive Error Handling** - Fixed JSON parsing and PHP errors | **完善错误处理** - 修复了JSON解析和PHP错误
- **Batch Download Optimization** - Automatic 0.5s interval to avoid browser blocking | **批量下载优化** - 自动间隔0.5秒，避免浏览器阻止

## 📋 Supported Image Sources | 支持的图片来源

| Source Type | Description | Example |
|-------------|-------------|---------|
| IMG Tags | Images in HTML img tags | `<img src="image.jpg">` |
| CSS Background | Background images in CSS stylesheets | `background-image: url(bg.jpg)` |
| Inline Styles | Background images in HTML style attributes | `style="background: url(pic.jpg)"` |
| Lazy Loading | Images with data-src attributes | `<img data-src="lazy.jpg">` |
| Text URLs | Image links in page text | Direct image URL links |

## 🎯 Version Information | 版本信息

- **Version:** 1.0.0
- **Release Date:** 2025
- **Author:** 陌涛 (Mo Tao)
- **Website:** https://imotao.com/

## 📄 Copyright Information | 版权信息

```
Smart Image Collector - Web Image Extraction Tool
Copyright (c) 2025 陌涛 (Mo Tao)
All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🤝 Contributing | 贡献

Welcome to submit Issues and Pull Requests to improve this project.  
欢迎提交Issue和Pull Request来改进这个项目。

## 📞 Support | 支持

If you encounter problems during use, please check the browser console for error messages, or submit an Issue describing the specific problem.  
如果您在使用过程中遇到问题，请查看浏览器控制台的错误信息，或提交Issue描述具体问题。

---

**Author:** 陌涛 (Mo Tao)  
**Website:** https://imotao.com/  
**License:** MIT License
