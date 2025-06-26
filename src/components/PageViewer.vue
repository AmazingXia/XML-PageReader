<template>
  <div class="page-viewer">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="file-info">
          <span class="file-name">{{ currentFolderName }}</span>
          <button @click="$emit('resetReader')" class="reset-btn">返回文件夹选择</button>
        </div>

        <select v-model="currentPageSize" @change="onPageSizeChange" class="page-size-select">
          <option value="A4">A4</option>
          <option value="A5">A5</option>
          <option value="Letter">Letter</option>
          <option value="Legal">Legal</option>
        </select>

        <select v-model="pagesPerView" @change="onPagesPerViewChange" class="pages-per-view-select">
          <option value="1">1页</option>
          <option value="2">2页</option>
        </select>

        <button @click="toggleFullscreen" class="toolbar-btn">
          <span v-if="!isFullscreen">全屏</span>
          <span v-else>退出全屏</span>
        </button>

        <button @click="toggleNightMode" class="toolbar-btn">
          <span v-if="!isNightMode">夜间模式</span>
          <span v-else>日间模式</span>
        </button>
      </div>

      <div class="toolbar-right">
        <button @click="goToFirstPage" :disabled="isFirstPageOfAll()" class="toolbar-btn">
          首页
        </button>
        <button @click="prevPage" :disabled="isFirstPageOfAll()" class="toolbar-btn">
          上一页
        </button>
        <button @click="nextPage" :disabled="isLastPageOfChapter() && !hasNextChapter()" class="toolbar-btn">
          下一页
        </button>
        <div class="page-info">
          第{{ currentPage }}页 / 共{{ totalBookPages }}页
        </div>
      </div>
    </div>

    <!-- 阅读器外层容器 -->
    <div class="reader-outer">
      <div
        ref="reader"
        class="reader-container"
        :class="{
          'fullscreen': isFullscreen,
          'night-mode': isNightMode,
          'spreads': pageCount > 1
        }"
        :style="readerContainerStyle"
        @keydown="handleKeydown"
        tabindex="0"
      >
        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <p>正在加载页面...</p>
        </div>

        <!-- 章节内容 -->
        <div v-else-if="currentChapterContent" class="chapter-content" v-html="currentChapterContent" :style="chapterContentStyle"></div>

        <!-- 无内容状态 -->
        <div v-else class="no-content">
          <p>暂无内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { PageManager } from '@/utils/pageManager'

export default {
  name: 'PageViewer',
  props: {
    content: {
      type: [String, Object],
      default: ''
    }
  },
  data() {
    return {
      currentFolderName: '',
      pageManager: new PageManager(),
      currentChapterContent: '',
      currentPageSize: 'A4',
      pagesPerView: 2,
      isFullscreen: false,
      isNightMode: false,
      loading: false,
      columnGap: 70,
      currentScrollLeft: 0,
      currentPage: 1,
      totalSpreads: 0,
      totalBookPages: 0
    }
  },
  computed: {
    columnWidth() {
      const pageSize = this.pageManager.pageSizes[this.currentPageSize];
      const columnWidth = this.pageManager.mmToPx(pageSize.width - this.pageManager.margin.right - this.pageManager.margin.left);
      return columnWidth
    },
    padX() {
      const padX = this.pageManager.mmToPx(this.pageManager.margin.right) + this.pageManager.mmToPx(this.pageManager.margin.left);
      return padX
    },
    pageCount() {
      return Number(this.pagesPerView) || 1;
    },
    pageWidth() {
      // pageWidth: 450, // columnWidth + columnGap
      const pageCount = Number(this.pagesPerView) || 1;
      const totalWidth = this.columnWidth * pageCount + this.columnGap * (pageCount - 1) + this.padX;
      return totalWidth
    },
    readerContainerStyle() {
      const pageSize = this.pageManager.pageSizes[this.currentPageSize];
      const pageHeight = this.pageManager.mmToPx(pageSize.height);
      // const padding = `${this.pageManager.mmToPx(this.pageManager.margin.top) + 'px'} ${this.pageManager.mmToPx(this.pageManager.margin.right) + 'px'} !important`;
      // console.log(`padding`, padding);

      return {
        width: this.pageWidth + 'px',
        height: pageHeight + 'px',
        margin: '20px auto !important',
        padding: '20px 37px !important',
        // padding: padding,

        // columnFill: 'auto',
        // columnGap:  this.columnGap + 'px',
        // columnWidth:  this.columnWidth + 'px',
        // columnFill: this.pageCount > 1 ? 'auto' : null,
        // columnGap: this.pageCount > 1 ?  this.columnGap: null,
        // columnWidth: this.pageCount > 1 ?  this.columnWidth + 'px': null,
      }

      // .reader-container {
      //     width: 900px;
      //     height: 600px;
      //     overflow: hidden;
      //     margin: 0px !important;
      //     padding: 20px 37px !important;
      //     box-sizing: border-box;
      //     max-width: inherit;
      //     column-fill: auto;
      //     column-gap: 74px;
      //     column-width: 376px;
      //     white-space: normal;
      //     scroll-behavior: auto;
      //   }
    },

    colWidth() {
      return (this.pageWidth - this.columnGap - this.padX) / 2
    },
    chapterContentStyle() {
      return {
        columnFill: 'auto',
        columnGap: this.columnGap + 'px',
        columnWidth: this.columnWidth + 'px',
      }
    }
  },
  watch: {
    content: {
      handler() {
        this.initializeReader()
      },
      immediate: true
    }
  },
  mounted() {
    this.updatePageStyles()
    this.focusContainer()
    this.$nextTick(() => {
      this.updatePageStyles()
    })
  },
  beforeDestroy() {
    const stylesToRemove = [
      'dynamic-page-styles',
      'night-mode-styles',
      'css-pagination-styles'
    ]
    stylesToRemove.forEach(id => {
      const style = document.getElementById(id)
      if (style) {
        style.remove()
      }
    })
  },
  methods: {
    /**
     * 初始化阅读器
     */
    async initializeReader() {
      if (!this.content) {
        return
      }
      this.currentFolderName = this.content.folderName || '';

      try {
        this.loading = true
        await this.pageManager.initializeFolderContent(this.content)
        this.pageManager.setPageSize(this.currentPageSize)
        this.pageManager.setPagesPerView(this.pagesPerView)
        await this.loadCurrentChapter()
      } catch (error) {
        console.error('初始化阅读器失败:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 加载当前章节内容
     */
    async loadCurrentChapter() {
      this.loading = true
      try {
        const fileInfo = this.pageManager.xmlFiles[this.pageManager.currentChapterIndex]
        if (!fileInfo) {
          this.currentChapterContent = ''
          this.loading = false
          return
        }

        const content = await this.pageManager.loadXMLFile(fileInfo)

        if (!content) {
          this.currentChapterContent = ''
          this.loading = false
          return
        }

        // 获取HTML内容
        const { XMLParser } = require('@/utils/xmlParser')
        this.currentChapterContent = XMLParser.toHTML(content, fileInfo.folderPath, this.pageManager.fileMap);
        this.updatePageStyles();

        // 关键：先设置loading为false，等待DOM更新，再进行计算
        this.loading = false;
        await this.$nextTick();

        await this.calculateTotalPages();

        // 仅在双页模式下补空白页，保证总页数为偶数
        if (this.pagesPerView == 2 && this.totalBookPages % 2 !== 0) {
          this.currentChapterContent += '<div class="empty-page"></div>';
          await this.$nextTick();
          await this.calculateTotalPages();
        }
      } catch (error) {
        console.error('加载章节失败:', error)
        this.loading = false
      }
    },

    /**
     * 等待.chapter-content渲染到DOM
     */
    waitForContentDom() {
      return new Promise((resolve) => {
        const tryFind = () => {
          const reader = this.$refs.reader;
          if (reader) {
            const content = reader.querySelector('.chapter-content');
            if (content) {
              resolve(content);
              return;
            }
          }
          setTimeout(tryFind, 16);
        };
        tryFind();
      });
    },

    /**
     * 计算总页数
     */
    async calculateTotalPages() {
      const content = await this.waitForContentDom();
      const totalWidth = content.scrollWidth;

      // The number of scrollable spreads for navigation
      this.totalSpreads = Math.ceil(totalWidth / this.pageWidth);

      // The actual number of book pages (columns) for display and layout logic
      if (this.columnWidth > 0) {
        this.totalBookPages = Math.round((totalWidth + this.columnGap) / (this.columnWidth + this.columnGap));
      } else {
        this.totalBookPages = 0;
      }

      console.log(`当前章节总页数: ${this.totalBookPages}, 总Spread数: ${this.totalSpreads}, 内容宽度: ${totalWidth}, 页面宽度: ${this.pageWidth}`);
    },

    /**
     * 跳转到指定页
     */
    goToPage(pageNumber) {
      const reader = this.$refs.reader
      if (!reader) return
      const page = Math.max(1, Math.min(pageNumber, this.totalSpreads))
      const targetScrollLeft = (page - 1) * this.pageWidth
      reader.scrollLeft = targetScrollLeft
      this.currentScrollLeft = targetScrollLeft
      this.currentPage = page
    },

    /**
     * 更新页面样式
     */
    updatePageStyles() {
      const pageStyles = this.pageManager.getPageStyles()

      // 注入页面样式
      this.injectPageStyles(pageStyles)

      // 添加夜间模式样式
      if (this.isNightMode) {
        this.injectNightModeStyles()
      }

      // 添加 CSS 分页样式
      this.injectCSSPaginationStyles()
    },

    /**
     * 注入页面样式
     */
    injectPageStyles(pageStyles) {
      // 移除之前的页面样式
      const existingStyle = document.getElementById('dynamic-page-styles')
      if (existingStyle) {
        existingStyle.remove()
      }

      // 创建新的样式元素
      const styleElement = document.createElement('style')
      styleElement.id = 'dynamic-page-styles'
      styleElement.textContent = pageStyles
      document.head.appendChild(styleElement)
    },

    /**
     * 注入夜间模式样式
     */
    injectNightModeStyles() {
      // 移除之前的夜间模式样式
      const existingStyle = document.getElementById('night-mode-styles')
      if (existingStyle) {
        existingStyle.remove()
      }

      const nightModeStyles = `
        .page-container.night-mode {
          background: #23272f;
        }
        .page-container.night-mode .page {
          background: #2d2d2d;
          color: #e0e0e0;
          box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
        }
        .page-container.night-mode .page .page-content {
          color: #e0e0e0;
        }
        .page-container.night-mode .page .article-title {
          color: #f0f0f0;
        }
        .page-container.night-mode .page .heading {
          color: #f0f0f0;
        }
        .page-container.night-mode .page .figure-title {
          color: #ccc;
        }
      `

      // 创建新的样式元素
      const styleElement = document.createElement('style')
      styleElement.id = 'night-mode-styles'
      styleElement.textContent = nightModeStyles
      document.head.appendChild(styleElement)
    },

    /**
     * 注入 CSS 分页样式
     */
    injectCSSPaginationStyles() {
      // 移除之前的 CSS 分页样式
      const existingStyle = document.getElementById('css-pagination-styles')
      if (existingStyle) {
        existingStyle.remove()
      }

      const cssPaginationStyles = `
        .chapter-content {
          height: 100%;
          font-size: 16px;
          line-height: 1.6;
          font-family: 'Stix', serif;
          font-variant-numeric: oldstyle-nums;
        }

        .chapter-content p {
          padding: 0;
          margin: 0;
          text-align: justify;
        }

        .chapter-content h1,
        .chapter-content h2,
        .chapter-content h3,
        .chapter-content h4,
        .chapter-content h5,
        .chapter-content h6 {
          break-after: avoid;
          page-break-after: avoid;
        }

        .chapter-content .article-figure,
        .chapter-content .article-image {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .chapter-content .article-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 12px;
          text-align: center;
        }

        .chapter-content .figure-title {
          font-size: 14px;
          color: #666;
          margin-top: 8px;
        }

        .chapter-content .heading {
          margin: 20px 0 12px 0;
          color: #2c3e50;
          break-after: avoid;
          page-break-after: avoid;
        }
      `

      // 创建新的样式元素
      const styleElement = document.createElement('style')
      styleElement.id = 'css-pagination-styles'
      styleElement.textContent = cssPaginationStyles
      document.head.appendChild(styleElement)
    },

    /**
     * 页面尺寸变化
     */
    async onPageSizeChange() {
      this.pageManager.setPageSize(this.currentPageSize)
      this.updatePageStyles()
      await this.loadCurrentChapter()
    },

    /**
     * 每页显示页数变化
     */
    async onPagesPerViewChange() {
      this.pageManager.setPagesPerView(this.pagesPerView)
      await this.loadCurrentChapter()
    },

    /**
     * 上一页
     */
    async prevPage() {
      const reader = this.$refs.reader
      if (!reader) return
      if (this.currentPage > 1) {
        // 当前章节内翻页
        this.goToPage(this.currentPage - 1)
      } else if (this.pageManager.currentChapterIndex > 0) {
        // 切换到上一章节的最后一页
        this.pageManager.currentChapterIndex--
        await this.loadCurrentChapter();
        // 直接赋值为上一章节最后一页
        this.currentPage = this.totalSpreads
        this.goToPage(this.currentPage)
      }
    },

    /**
     * 下一页
     */
    async nextPage() {
      const reader = this.$refs.reader
      if (!reader) return
      if (this.currentPage < this.totalSpreads) {
        // 当前章节内翻页
        this.goToPage(this.currentPage + 1)
      } else if (this.pageManager.currentChapterIndex < this.pageManager.xmlFiles.length - 1) {
        // 切换到下一章节的第一页
        this.pageManager.currentChapterIndex++
        await this.loadCurrentChapter()
        // 滚动到开始位置
        this.$nextTick(() => {
          this.goToPage(1)
        })
      }
    },

    /**
     * 跳转到首页
     */
    async goToFirstPage() {
      if (this.pageManager.currentChapterIndex > 0) {
        // 回到第一章节
        this.pageManager.currentChapterIndex = 0
        await this.loadCurrentChapter()
        this.$nextTick(() => {
          this.goToPage(1)
        })
      } else {
        // 当前章节的第一页
        this.goToPage(1)
      }
    },

    /**
     * 切换全屏
     */
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
      if (this.isFullscreen) {
        this.requestFullscreen()
      } else {
        this.exitFullscreen()
      }
    },

    /**
     * 请求全屏
     */
    requestFullscreen() {
      const element = this.$el
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
    },

    /**
     * 退出全屏
     */
    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    },

    /**
     * 切换夜间模式
     */
    toggleNightMode() {
      this.isNightMode = !this.isNightMode

      if (this.isNightMode) {
        this.injectNightModeStyles()
      } else {
        // 移除夜间模式样式
        const nightModeStyle = document.getElementById('night-mode-styles')
        if (nightModeStyle) {
          nightModeStyle.remove()
        }
      }
    },

    /**
     * 键盘事件处理
     */
    handleKeydown(event) {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          this.prevPage()
          break
        case 'ArrowRight':
          event.preventDefault()
          this.nextPage()
          break
        case 'Home':
          event.preventDefault()
          this.goToFirstPage()
          break
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.toggleFullscreen()
          }
          break
      }
    },

    /**
     * 聚焦容器
     */
    focusContainer() {
      const container = this.$el.querySelector('.reader-container')
      if (container) {
        container.focus()
      }
    },

    isLastPageOfChapter() {
      return this.currentPage >= this.totalSpreads
    },

    hasNextChapter() {
      return this.pageManager.currentChapterIndex < this.pageManager.xmlFiles.length - 1
    },

    isFirstPageOfAll() {
      return this.currentPage === 1 && this.pageManager.currentChapterIndex === 0
    }
  }
}
</script>

<style scoped>
.page-viewer {
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  flex: 1;
  overflow: hidden;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.file-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.reset-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #5a6fd8;
}

/* 确保toolbar样式优先级最高 */
.page-viewer .toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
  position: relative;
}

.page-viewer .toolbar-left,
.page-viewer .toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.page-viewer .toolbar-center {
  flex: 1;
  text-align: center;
}

.page-viewer .toolbar-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #ccc;
}

.page-viewer .toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-viewer .page-size-select,
.page-viewer .pages-per-view-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.page-viewer .page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.toolbar-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #ccc;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-size-select,
.pages-per-view-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.reader-outer {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f5f5f5;
  flex: 1;
  overflow: auto;
}

.reader-container {
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  white-space: normal;
}

.reader-container.fullscreen {
  /* position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 9999;
  background: #f5f5f5; */
}

.spreads {
  position: relative;
}


.spreads:after {
    position: absolute;
    width: 1px;
    border-right: 1px #000 solid;
    height: 90%;
    z-index: 100;
    left: 50%;
    margin-left: -1px;
    top: 5%;
    opacity: .15;
    box-shadow: -2px 0 15px rgba(0, 0, 0, 1);
    content: "";
}

.chapter-content p {
  padding: 0;
  margin: 0;
  text-align: justify;
}

.chapter-content h1 {
  font-size: 1.5em;
  line-height: 1.33em;
  text-align: center;
  padding-bottom: 0em;
  text-transform: uppercase;
  font-weight: normal;
  letter-spacing: 4px;
  break-after: avoid;
  page-break-after: avoid;
}

.chapter-content header {
  padding: 3em 0 2em 0;
}

.chapter-content .article-figure {
  margin: 20px 0;
  text-align: center;
  break-inside: avoid;
  page-break-inside: avoid;
}

.chapter-content .figure-title {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.chapter-content .article-image {
  max-width: 100%;
  max-height: 90%;
  height: auto;
  width: auto;
  display: block;
  margin: 0 auto;
  object-fit: contain;
  break-inside: avoid;
  page-break-inside: avoid;
}

.chapter-content .heading {
  margin: 20px 0 12px 0;
  color: #2c3e50;
  break-after: avoid;
  page-break-after: avoid;
}

.empty-page {
  min-height: 1px;
  min-width: 1px;
  break-inside: avoid;
  page-break-inside: avoid;
  background: transparent;
}

.no-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
  font-size: 16px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
  font-size: 16px;
}

.loading p {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading p::before {
  content: '';
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 夜间模式样式 */
.reader-container.night-mode {
  background: #23272f;
}

.reader-container.night-mode .chapter-content {
  color: #e0e0e0;
}

.reader-container.night-mode .chapter-content .article-title {
  color: #f0f0f0;
}

.reader-container.night-mode .chapter-content .heading {
  color: #f0f0f0;
}

.reader-container.night-mode .chapter-content .figure-title {
  color: #ccc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-container {
    width: 100%;
    height: 400px;
    padding: 10px 20px !important;
  }

  .toolbar {
    flex-direction: column;
    gap: 10px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}
</style>