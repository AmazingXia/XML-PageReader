# XML 多页阅读器

一个基于Vue.js的XML文档多页阅读器，支持动态分页、多页渲染和EPUB3风格的阅读体验。

## 功能特性

### 🎯 核心功能

- **文件夹上传**: 支持上传XML文件夹进行预览
- **动态分页渲染**: 根据页面大小自动计算内容分页
- **多页显示**: 支持1页、2页、4页同时显示（默认2页）
- **前后分页**: 支持前后翻页，无需计算总页数
- **图片避免截断**: 智能处理图片元素，避免在页面边界被截断

### 📱 用户体验

- **EPUB3风格**: 参考EPUB3阅读器的排版风格
- **响应式设计**: 支持不同屏幕尺寸
- **夜间模式**: 护眼的夜间阅读模式
- **全屏模式**: 沉浸式阅读体验
- **键盘导航**: 支持方向键、Home键等快捷键

### 🎨 样式优化

- **现代化UI**: 简洁美观的界面设计
- **页面阴影**: 真实的纸张效果
- **边距控制**: 合理的页面边距设置
- **字体优化**: 清晰的字体和行高设置

## 技术架构

### 核心组件

- **PageManager**: 分页管理器，负责动态分页和内容渲染
- **XMLParser**: XML解析器，处理XML文档解析和HTML转换
- **PageViewer**: 页面查看器，提供用户界面和交互

### 分页算法

1. **内容计算**: 根据页面尺寸计算可容纳的内容
2. **智能分页**: 避免图片截断，保持内容完整性
3. **动态加载**: 按需加载XML文件，优化性能
4. **多页渲染**: 支持同时渲染多个页面

## 使用方法

### 基本使用

```javascript
// 初始化PageManager
const pageManager = new PageManager()

// 设置页面尺寸
pageManager.setPageSize('A4')

// 设置每页显示页数
pageManager.setPagesPerView(2)

// 处理上传的文件夹内容
await pageManager.initializeFolderContent(folderContent)

// 渲染页面
const pages = await pageManager.renderPages(0, 2)
```

### 组件使用

```vue
<template>
  <PageViewer
    :content="folderContent"
    :xml-base-path="folderName"
    :xml-file-count="fileCount"
  />
</template>
```

## 配置选项

### 页面尺寸

- `A4`: 210mm × 297mm
- `A5`: 148mm × 210mm
- `Letter`: 216mm × 279mm
- `Legal`: 216mm × 356mm

### 显示模式

- `1页`: 单页显示
- `2页`: 双页显示（默认）
- `4页`: 四页显示

### 样式配置

- 页面边距: 20mm
- 字体大小: 16px
- 行高: 1.6
- 图片处理: 避免截断

## 开发说明

### 项目结构

```
src/
├── components/
│   └── PageViewer.vue      # 页面查看器组件
├── utils/
│   ├── pageManager.js      # 分页管理器
│   └── xmlParser.js        # XML解析器
└── views/
    └── Reader.vue          # 主阅读器页面
```

### 关键算法

1. **DPI计算**: 自动检测设备DPI，确保页面尺寸准确
2. **内容测量**: 使用临时DOM元素测量内容高度
3. **分页决策**: 基于内容高度和图片位置进行分页
4. **动态渲染**: 按需加载和渲染XML内容

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License
