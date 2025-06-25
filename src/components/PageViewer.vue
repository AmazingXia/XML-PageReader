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
        <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
      </div>

      <div class="toolbar-right">
        <button @click="goToPage(0)" :disabled="currentPage === 0" class="toolbar-btn">
          首页
        </button>
        <button @click="prevPage" :disabled="currentPage === 0" class="toolbar-btn">
          上一页
        </button>
        <button @click="nextPage" :disabled="currentPage === totalPages - 1" class="toolbar-btn">
          下一页
        </button>
        <button @click="goToPage(totalPages - 1)" :disabled="currentPage === totalPages - 1" class="toolbar-btn">
          末页
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
      <div
        v-if="pages.length > 0"
        class="page-content"
        v-html="pages[currentPage].content"
      ></div>
      <div v-else class="no-content">
        <p>暂无内容</p>
      </div>
    </div>
  </div>
</template>

<script>
import { PageLayout } from '@/utils/pageLayout'

export default {
  name: 'PageViewer',
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      pageLayout: new PageLayout(),
      pages: [],
      currentPage: 0,
      currentPageSize: 'A4',
      isFullscreen: false,
      isNightMode: false,
      pageStyles: ''
    }
  },
  computed: {
    totalPages() {
      return this.pages.length
    }
  },
  watch: {
    content: {
      handler(newContent) {
        this.renderContent(newContent)
      },
      immediate: true
    }
  },
  mounted() {
    this.updatePageStyles()
    this.focusContainer()
  },
  methods: {
    /**
     * 渲染内容
     */
    renderContent(content) {
      if (!content) {
        this.pages = []
        return
      }

      try {
        this.pages = this.pageLayout.paginate(content)
        this.currentPage = 0
        this.updatePageStyles()
      } catch (error) {
        console.error('渲染内容失败:', error)
        this.pages = []
      }
    },

    /**
     * 更新页面样式
     */
    updatePageStyles() {
      this.pageStyles = this.pageLayout.getPageStyles()

      // 动态注入样式
      this.injectStyles()

      // 添加夜间模式样式
      if (this.isNightMode) {
        const nightModeStyles = `
          .page-container.night-mode {
            background: #1a1a1a !important;
          }
          .page-container.night-mode .page {
            background: #2d2d2d !important;
            color: #e0e0e0 !important;
            box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1) !important;
          }
        `
        this.injectStyles(nightModeStyles)
      }
    },

    /**
     * 动态注入样式
     */
    injectStyles(additionalStyles = '') {
      // 移除之前的样式
      const existingStyle = document.getElementById('dynamic-page-styles')
      if (existingStyle) {
        existingStyle.remove()
      }

      // 创建新的样式元素
      const styleElement = document.createElement('style')
      styleElement.id = 'dynamic-page-styles'
      styleElement.textContent = this.pageStyles + additionalStyles
      document.head.appendChild(styleElement)
    },

    /**
     * 页面尺寸变化
     */
    onPageSizeChange() {
      this.pageLayout.setPageSize(this.currentPageSize)
      this.renderContent(this.content)
    },

    /**
     * 上一页
     */
    prevPage() {
      if (this.currentPage > 0) {
        this.currentPage--
        this.focusContainer()
      }
    },

    /**
     * 下一页
     */
    nextPage() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++
        this.focusContainer()
      }
    },

    /**
     * 跳转到指定页面
     */
    goToPage(pageIndex) {
      if (pageIndex >= 0 && pageIndex < this.totalPages) {
        this.currentPage = pageIndex
        this.focusContainer()
      }
    },

    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
      this.$nextTick(() => {
        if (this.isFullscreen) {
          this.requestFullscreen()
        } else {
          this.exitFullscreen()
        }
      })
    },

    /**
     * 请求全屏
     */
    requestFullscreen() {
      const container = this.$el.querySelector('.page-container')
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen()
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen()
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
      this.updatePageStyles()
    },

    /**
     * 处理键盘事件
     */
    handleKeydown(event) {
      switch (event.key) {
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault()
          this.prevPage()
          break
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          event.preventDefault()
          this.nextPage()
          break
        case 'Home':
          event.preventDefault()
          this.goToPage(0)
          break
        case 'End':
          event.preventDefault()
          this.goToPage(this.totalPages - 1)
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
      this.$nextTick(() => {
        const container = this.$el.querySelector('.page-container')
        if (container) {
          container.focus()
        }
      })
    }
  }
}
</script>

<style scoped>
.page-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.page-size-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.toolbar-btn {
  padding: 5px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: bold;
  color: #333;
}

.page-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  overflow-y: auto;
  outline: none;
}

.page-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.page-content {
  width: 100%;
  max-width: 800px;
}

.no-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-size: 18px;
}

/* 夜间模式样式 */
.page-container.night-mode {
  background: #1a1a1a;
}

.page-container.night-mode .toolbar {
  background: #2d2d2d;
  border-bottom-color: #444;
  color: #e0e0e0;
}

.page-container.night-mode .toolbar-btn,
.page-container.night-mode .page-size-select {
  background: #3d3d3d;
  border-color: #555;
  color: #e0e0e0;
}

.page-container.night-mode .toolbar-btn:hover:not(:disabled) {
  background: #4d4d4d;
}

.page-container.night-mode .page-info {
  color: #e0e0e0;
}
</style>