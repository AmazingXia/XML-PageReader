<template>
  <div class="reader">
    <!-- 文件上传区域 -->
    <div v-if="!currentContent" class="upload-area">
      <div class="upload-container">
        <h2>XML 多页阅读器</h2>
        <p>请选择 XML 文件或从示例文件中选择</p>

        <div class="upload-buttons">
          <input
            ref="fileInput"
            type="file"
            accept=".xml"
            @change="handleFileUpload"
            style="display: none"
          />
          <button @click="$refs.fileInput.click()" class="upload-btn">
            选择 XML 文件
          </button>
        </div>

        <!-- 示例文件列表 -->
        <div class="sample-files">
          <h3>示例文件</h3>
          <div class="file-list">
            <div class="file-group">
              <h4>文件夹 1-xml</h4>
              <div class="file-items">
                <button
                  v-for="file in sampleFiles1"
                  :key="file.path"
                  @click="loadSampleFile(file)"
                  class="file-item"
                >
                  {{ file.name }}
                </button>
              </div>
            </div>

            <div class="file-group">
              <h4>文件夹 2-xml</h4>
              <div class="file-items">
                <button
                  v-for="file in sampleFiles2"
                  :key="file.path"
                  @click="loadSampleFile(file)"
                  class="file-item"
                >
                  {{ file.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 阅读器界面 -->
    <div v-else class="reader-interface">
      <!-- 顶部信息栏 -->
      <div class="info-bar">
        <div class="file-info">
          <span class="file-name">{{ currentFileName }}</span>
          <button @click="resetReader" class="reset-btn">返回文件选择</button>
        </div>
      </div>

      <!-- 页面查看器 -->
      <PageViewer :content="currentContent" />
    </div>
  </div>
</template>

<script>
import PageViewer from '@/components/PageViewer.vue'
import { XMLParser } from '@/utils/xmlParser'

export default {
  name: 'XmlReader',
  components: {
    PageViewer
  },
  data() {
    return {
      currentContent: '',
      currentFileName: '',
      sampleFiles1: [],
      sampleFiles2: []
    }
  },
  async mounted() {
    await this.loadSampleFiles()
  },
  methods: {
    /**
     * 加载示例文件列表
     */
    async loadSampleFiles() {
      try {
        // 这里应该从服务器获取文件列表
        // 由于是静态文件，我们手动构建文件列表
        this.sampleFiles1 = this.generateFileList('1-xml', 12)
        this.sampleFiles2 = this.generateFileList('2-xml', 55)
      } catch (error) {
        console.error('加载示例文件失败:', error)
      }
    },

    /**
     * 生成文件列表
     */
    generateFileList(folder, maxFiles) {
      const files = []
      for (let i = 2; i <= maxFiles; i++) {
        files.push({
          name: `文件 ${i}`,
          path: `${folder}/${i}/result.xml`
        })
      }

      console.log(`files`, files);
    },

    /**
     * 处理文件上传
     */
    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      try {
        const parsedData = await XMLParser.parseFile(file)
        const htmlContent = XMLParser.toHTML(parsedData)

        this.currentContent = htmlContent
        this.currentFileName = file.name

        // 清空文件输入
        this.$refs.fileInput.value = ''
      } catch (error) {
        console.error('文件解析失败:', error)
        alert('文件解析失败，请检查文件格式')
      }
    },

    /**
     * 加载示例文件
     */
    async loadSampleFile(file) {
      try {
        const response = await fetch(file.path)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const xmlContent = await response.text()
        const parsedData = XMLParser.parse(xmlContent)
        const htmlContent = XMLParser.toHTML(parsedData)

        this.currentContent = htmlContent
        this.currentFileName = file.name
      } catch (error) {
        console.error('加载示例文件失败:', error)
        alert('加载示例文件失败，请检查文件路径')
      }
    },

    /**
     * 重置阅读器
     */
    resetReader() {
      this.currentContent = ''
      this.currentFileName = ''
    }
  }
}
</script>

<style scoped>
.reader {
  height: 100vh;
  overflow: hidden;
}

.upload-area {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.upload-container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 600px;
  width: 90%;
}

.upload-container h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
}

.upload-container p {
  color: #666;
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

.sample-files {
  text-align: left;
}

.sample-files h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  font-size: 20px;
}

.file-group {
  margin-bottom: 25px;
}

.file-group h4 {
  color: #555;
  margin-bottom: 10px;
  font-size: 16px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 5px;
}

.file-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.file-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  text-align: center;
}

.file-item:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.reader-interface {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.info-bar {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 10px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.reset-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #c82333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-container {
    padding: 20px;
    margin: 20px;
  }

  .upload-container h2 {
    font-size: 24px;
  }

  .file-items {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .file-item {
    font-size: 12px;
    padding: 6px 8px;
  }
}
</style>