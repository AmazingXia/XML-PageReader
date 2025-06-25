<template>
  <div class="page-viewer">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
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

      <div class="toolbar-center">
        <span class="page-info">{{ currentPageIndex + 1 }}-{{ currentPageIndex + renderedPages.length }} / 总页数</span>
      </div>

      <div class="toolbar-right">
        <button @click="goToFirstPage" :disabled="currentPageIndex === 0" class="toolbar-btn">
          首页
        </button>
        <button @click="prevPage" :disabled="isFirstPageOfAll()" class="toolbar-btn">
          上一页
        </button>
        <button @click="nextPage" :disabled="isLastPageOfChapter() && !hasNextChapter()" class="toolbar-btn">
          下一页
        </button>
      </div>
    </div>

    <!-- 页面容器 -->
    <div
      class="page-container"
      :class="{
        'fullscreen': isFullscreen,
        'night-mode': isNightMode
      }"
      @keydown="handleKeydown"
      tabindex="0"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <p>正在加载页面...</p>
      </div>

      <!-- 页面内容 -->
      <div v-else-if="renderedPages.length > 0" class="pages-wrapper">
        <div
          v-for="page in renderedPages"
          :key="page.globalPageIndex"
          class="page"
          v-html="page.content"
        ></div>
        <div v-if="pagesPerView === 2 && renderedPages.length === 1" class="page empty-page"></div>
      </div>

      <!-- 无内容状态 -->
      <div v-else class="no-content">
        <p>暂无内容</p>
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
      pageManager: new PageManager(),
      renderedPages: [],
      currentPageIndex: 0,
      currentPageSize: 'A4',
      pagesPerView: 2,
      isFullscreen: false,
      isNightMode: false,
      hasMorePages: true,
      loading: false,
      totalPages: 0
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
      'night-mode-styles'
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
      try {
        this.loading = true
        await this.pageManager.initializeFolderContent(this.content)
        this.pageManager.setPageSize(this.currentPageSize)
        this.pageManager.setPagesPerView(this.pagesPerView)
        this.currentPageIndex = 0
        await this.renderCurrentPages()
      } catch (error) {
        console.error('初始化阅读器失败:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 渲染当前页面
     */
    async renderCurrentPages() {
      try {
        this.loading = true
        const { pages, totalPages } = await this.pageManager.renderPages(this.currentPageIndex, this.pagesPerView);

        console.log(`pages, totalPages`, pages, totalPages);
        this.renderedPages = pages
        this.totalPages = totalPages
        this.hasMorePages = (this.currentPageIndex + this.pagesPerView) < this.totalPages

        // 确保样式被正确应用
        this.$nextTick(() => {
          this.updatePageStyles()
        })
      } catch (error) {
        console.error('渲染页面失败:', error)
      } finally {
        this.loading = false
      }
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
      `

      // 创建新的样式元素
      const styleElement = document.createElement('style')
      styleElement.id = 'night-mode-styles'
      styleElement.textContent = nightModeStyles
      document.head.appendChild(styleElement)
    },

    /**
     * 动态注入样式（保留兼容性）
     */
    injectStyles(additionalStyles = '') {
      // 这个方法现在只用于兼容性，实际使用新的分离方法
      this.injectPageStyles(additionalStyles)
    },

    /**
     * 页面尺寸变化
     */
    async onPageSizeChange() {
      this.pageManager.setPageSize(this.currentPageSize)
      await this.renderCurrentPages()
    },

    /**
     * 每页显示页数变化
     */
    async onPagesPerViewChange() {
      this.pageManager.setPagesPerView(this.pagesPerView)
      await this.renderCurrentPages()
    },

    /**
     * 上一页
     */
    async prevPage() {
      const prevPageIndex = this.currentPageIndex - this.pagesPerView;
      if (prevPageIndex >= 0) {
        this.currentPageIndex = prevPageIndex;
        await this.renderCurrentPages();
        this.focusContainer();
      } else if (this.pageManager.currentChapterIndex > 0) {
        this.pageManager.currentChapterIndex--;
        const fileInfo = this.pageManager.xmlFiles[this.pageManager.currentChapterIndex];
        const content = fileInfo.content;
        const { pages: allPages } = this.pageManager.paginateContent(content, 0, Infinity);
        const lastPageIndex = Math.max(0, allPages.length - this.pagesPerView);
        this.currentPageIndex = lastPageIndex;
        await this.renderCurrentPages();
        this.focusContainer();
      }
    },

    /**
     * 下一页
     */
    async nextPage() {
      const fileInfo = this.pageManager.xmlFiles[this.pageManager.currentChapterIndex];
      if (!fileInfo) return;
      const content = fileInfo.content;
      if (!content) return;
      const { pages: allPages } = this.pageManager.paginateContent(content, 0, Infinity);
      const nextPageIndex = this.currentPageIndex + this.pagesPerView;
      if (nextPageIndex < allPages.length) {
        this.currentPageIndex = nextPageIndex;
        await this.renderCurrentPages();
        this.focusContainer();
      } else if (this.pageManager.currentChapterIndex < this.pageManager.xmlFiles.length - 1) {
        this.pageManager.currentChapterIndex++;
        this.currentPageIndex = 0;
        await this.renderCurrentPages();
        this.focusContainer();
      }
    },

    /**
     * 跳转到首页
     */
    async goToFirstPage() {
      this.currentPageIndex = 0
      await this.renderCurrentPages()
      this.focusContainer()
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
      const container = this.$el.querySelector('.page-container')
      if (container) {
        container.focus()
      }
    },

    isLastPageOfChapter() {
      const fileInfo = this.pageManager.xmlFiles[this.pageManager.currentChapterIndex];
      if (!fileInfo) return true;
      const content = fileInfo.content;
      if (!content) return true;
      const { pages: allPages } = this.pageManager.paginateContent(content, 0, Infinity);
      return this.currentPageIndex + this.pagesPerView >= allPages.length;
    },
    hasNextChapter() {
      return this.pageManager.currentChapterIndex < this.pageManager.xmlFiles.length - 1;
    },
    isFirstPageOfAll() {
      return this.currentPageIndex === 0 && this.pageManager.currentChapterIndex === 0;
    }
  }
}
</script>

<style scoped>
.page-viewer {
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  height: 100%;
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

.page-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex: 1;
  padding: 20px;
  overflow: auto;
  background: #f5f5f5;
}

.page-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #f5f5f5;
}

.pages-wrapper {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
}

.page {
  flex-shrink: 0;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
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
.page-container.night-mode {
  background: #23272f;
}

.page-container.night-mode .page {
  background: #2d2d2d;
  color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pages-wrapper {
    flex-direction: column;
    align-items: center;
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