<template>
  <div class="reader">
    <!-- 文件上传区域 -->
    <div v-if="!currentContent" class="upload-area">
      <div class="upload-container">
        <h2>XML 文件夹阅读器</h2>
        <p>请选择 XML 文件夹进行预览</p>

        <div class="upload-buttons">
          <input
            ref="folderInput"
            type="file"
            webkitdirectory
            directory
            multiple
            @change="handleFolderUpload"
            style="display: none"
          />
          <button @click="$refs.folderInput.click()" class="upload-btn">
            选择 XML 文件夹
          </button>
        </div>
      </div>
    </div>

    <!-- 阅读器界面 -->
    <div v-else class="reader-interface">
      <!-- 顶部信息栏 -->
      <div class="info-bar">
        <div class="file-info">
          <span class="file-name">{{ currentFolderName }}</span>
          <button @click="resetReader" class="reset-btn">返回文件夹选择</button>
        </div>
      </div>
      <!-- 页面查看器 -->
      <div class="page-viewer-wrapper">
        <PageViewer
          :content="currentContent"
          :xml-base-path="currentXmlBasePath"
          :xml-file-count="currentXmlFileCount"
          :start-file-index="currentStartFileIndex"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PageViewer from '@/components/PageViewer.vue'

export default {
  name: 'XmlReader',
  components: {
    PageViewer
  },
  data() {
    return {
      currentContent: '',
      currentFolderName: '',
      currentXmlBasePath: '',
      currentXmlFileCount: 0,
      currentStartFileIndex: 2,
      fileMap: {} // 存储文件夹中的所有文件
    }
  },
  methods: {
    /**
     * 处理文件夹上传
     */
    async handleFolderUpload(event) {
      const files = Array.from(event.target.files)
      if (files.length === 0) return

      try {
        // 创建文件映射
        this.fileMap = {}
        files.forEach(f => this.fileMap[f.webkitRelativePath] = f)

        // 获取文件夹根目录名称
        const folderName = files[0].webkitRelativePath.split('/')[0]
        this.currentFolderName = folderName

        // 初始化阅读器
        await this.initializeFolderReader(folderName, files)

        // 清空文件输入
        this.$refs.folderInput && (this.$refs.folderInput.value = '')
      } catch (error) {
        console.error('文件夹处理失败:', error)
        alert('文件夹处理失败，请检查文件夹格式')
      }
    },

    /**
     * 初始化文件夹阅读器
     */
    async initializeFolderReader(folderName, files) {
      try {
        // 处理上传的文件夹
        await this.processUploadedFolder(folderName, files)
      } catch (error) {
        console.error('初始化文件夹阅读器失败:', error)
        throw error
      }
    },

    /**
     * 处理上传的文件夹
     */
    async processUploadedFolder(folderName, files) {
      const folderRoots = new Set()

      // 兼容只上传子文件夹或多级文件夹
      files.forEach(file => {
        const parts = file.webkitRelativePath.split("/")
        if (parts.length >= 3) {
          folderRoots.add(`${parts[0]}/${parts[1]}`)
        } else if (parts.length === 2) {
          folderRoots.add(`${parts[0]}`)
        }
      })

      // 设置文件数量
      this.currentXmlFileCount = folderRoots.size
      this.currentXmlBasePath = folderName
      this.currentStartFileIndex = 2

      // 创建内容对象
      this.currentContent = {
        type: 'folder',
        folderName: folderName,
        fileMap: this.fileMap,
        folderRoots: Array.from(folderRoots)
      }

      console.log(`currentContent`, this.currentContent)
    },

    /**
     * 重置阅读器
     */
    resetReader() {
      this.currentContent = ''
      this.currentFolderName = ''
      this.currentXmlBasePath = ''
      this.currentXmlFileCount = 0
      this.currentStartFileIndex = 2
      this.fileMap = {}
    }
  }
}
</script>

<style scoped>
.reader {

}

.upload-area {
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  min-width: 100vw;
}

.upload-container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 600px;
  width: 90%;
  position: relative;
  z-index: 10;
  margin: auto;
}

.upload-container h2, .upload-container p {
  color: #222;
}

.upload-container h2 {
  margin-bottom: 10px;
  font-size: 28px;
}

.upload-container p {
  margin-bottom: 30px;
  font-size: 16px;
}

.upload-buttons {
  margin-bottom: 40px;
}

.upload-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.reader-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.page-viewer-wrapper {
  flex: 1;
  overflow: hidden;
}
</style>