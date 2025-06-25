# XML 多页阅读器

基于 Vue2 开发的 XML 多页阅读器，支持类似 EPUB3 的阅读体验。

## 功能特性

### 核心功能
- ✅ XML 数据解析和渲染
- ✅ 智能分页排版算法
- ✅ 动态页面尺寸切换（A4、A5、Letter、Legal）
- ✅ 前后翻页操作
- ✅ 页面跳转（首页、末页）

### 增强功能
- ✅ 全屏阅读模式
- ✅ 夜间模式
- ✅ 键盘快捷键支持
- ✅ 响应式设计
- ✅ 图片防截断处理
- ✅ 文件上传和示例文件加载

### 技术特性
- ✅ 虚拟渲染优化
- ✅ 自适应排版
- ✅ 现代化 UI 设计
- ✅ 跨浏览器兼容

## 项目结构

```
src/
├── components/          # 组件
│   └── PageViewer.vue  # 页面查看器组件
├── utils/              # 工具类
│   ├── xmlParser.js    # XML 解析工具
│   └── pageLayout.js   # 分页排版工具
├── views/              # 页面
│   └── Reader.vue      # 主阅读器页面
├── router/             # 路由配置
└── App.vue             # 根组件
```

## 安装和运行

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run serve
```

### 生产构建
```bash
npm run build
```

## 使用说明

### 1. 文件上传
- 点击"选择 XML 文件"按钮上传本地 XML 文件
- 支持标准 XML 格式

### 2. 示例文件
- 从预设的示例文件中选择（1-xml 和 2-xml 文件夹）
- 点击文件名即可加载

### 3. 阅读控制
- **页面尺寸**: 下拉菜单选择 A4、A5、Letter、Legal
- **翻页**: 使用工具栏按钮或键盘快捷键
- **全屏**: 点击全屏按钮或按 Ctrl+F
- **夜间模式**: 点击夜间模式按钮切换

### 4. 键盘快捷键
- `←` 或 `PageUp`: 上一页
- `→` 或 `PageDown` 或 `空格`: 下一页
- `Home`: 跳转到首页
- `End`: 跳转到末页
- `Ctrl+F`: 切换全屏

## 技术实现

### XML 解析
- 使用原生 DOMParser 解析 XML
- 支持嵌套结构和属性解析
- 自动转换为 HTML 格式

### 分页算法
- 基于内容高度的智能分页
- 防止图片被截断
- 支持段落分割
- 动态重新排版

### 性能优化
- 虚拟渲染减少 DOM 操作
- 按需加载页面内容
- 内存管理优化

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 开发说明

### 添加新的页面尺寸
在 `src/utils/pageLayout.js` 中的 `pageSizes` 对象中添加新的尺寸配置。

### 自定义样式
修改 `src/utils/pageLayout.js` 中的 `getPageStyles()` 方法来自定义页面样式。

### 扩展 XML 解析
在 `src/utils/xmlParser.js` 中的 `toHTML()` 方法中添加新的标签处理逻辑。

## 许可证

MIT License