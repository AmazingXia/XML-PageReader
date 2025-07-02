/**
 * 分页管理器
 * 支持动态计算页面大小、多页渲染、前后分页等功能
 */
export class PageManager {
  constructor() {
    this.pageSizes = {
      A4: { width: 210, height: 297, unit: 'mm' },
      A5: { width: 148, height: 210, unit: 'mm' },
      Letter: { width: 216, height: 279, unit: 'mm' },
      Legal: { width: 216, height: 356, unit: 'mm' }
    }
    this.currentPageSize = 'A4'
    this.margin = { top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' }
    this.xmlFiles = []
    this.currentChapterIndex = 0
    this.fileMap = {}
    this.dpi = this.getDPI()
  }

  /**
   * 获取DPI
   */
  getDPI() {
    const div = document.createElement('div')
    div.style.width = '1in'
    div.style.position = 'absolute'
    div.style.top = '-100%'
    document.body.appendChild(div)
    const dpi = div.offsetWidth
    document.body.removeChild(div)
    return dpi
  }

  /**
   * 设置页面尺寸
   */
  setPageSize(pageSize) {
    if (this.pageSizes[pageSize]) {
      this.currentPageSize = pageSize
      return true
    }
    return false
  }

  /**
   * 设置每页显示页数
   */
  setPagesPerView(count) {
    this.pagesPerView = count
  }

  /**
   * 将毫米转换为像素
   */
  mmToPx(mm) {
    return (mm * this.dpi) / 25.4
  }

  /**
   * 获取当前页面尺寸
   */
  getCurrentPageSize() {
    return this.pageSizes[this.currentPageSize]
  }

  /**
   * 计算页面内容区域
   */
  getContentArea() {
    const pageSize = this.getCurrentPageSize()
    const width = this.mmToPx(pageSize.width - this.margin.left - this.margin.right)
    const height = this.mmToPx(pageSize.height - this.margin.top - this.margin.bottom)
    return { width, height }
  }

  /**
   * 初始化文件夹内容
   */
  async initializeFolderContent(folderContent) {
    if (folderContent.type === 'folder') {
      await this.processFolderContent(folderContent)
    }
  }

  /**
   * 处理文件夹内容
   */
  async processFolderContent(folderContent) {
    const { fileMap, folderRoots } = folderContent
    this.xmlFiles = []
    this.fileMap = fileMap
    const chapterFolders = folderRoots.filter(folder => {
      const resultXmlPath = `${folder}/result.xml`
      return fileMap[resultXmlPath] && folder !== '1-xml'
    })
    const sortedFolders = chapterFolders.sort((a, b) => {
      const aIndex = parseInt(a.split('/')[1])
      const bIndex = parseInt(b.split('/')[1])
      return aIndex - bIndex
    })
    for (let i = 0; i < sortedFolders.length; i++) {
      const folder = sortedFolders[i]
      const folderIndex = parseInt(folder.split('/')[1])
      this.xmlFiles.push({
        index: folderIndex,
        path: `${folder}/result.xml`,
        prefix: `${folder}/`,
        loaded: false,
        content: null,
        folderPath: folder
      })
    }
  }

  /**
   * 加载XML文件内容（支持文件夹模式）
   */
  async loadXMLFile(fileInfo) {
    if (fileInfo.loaded) {
      return fileInfo.content
    }
    try {
      let xmlContent = ''
      if (this.fileMap && this.fileMap[fileInfo.path]) {
        const file = this.fileMap[fileInfo.path]
        xmlContent = await file.text()
      } else {
        console.error(`文件不存在于 fileMap 中: ${fileInfo.path}`)
        console.log('可用的文件:', Object.keys(this.fileMap || {}))
        throw new Error(`文件不存在: ${fileInfo.path}`)
      }
      const { XMLParser } = await import('./xmlParser')
      const parsedData = XMLParser.parse(xmlContent)
      fileInfo.content = parsedData
      fileInfo.loaded = true
      return parsedData
    } catch (error) {
      console.error(`加载XML文件失败: ${fileInfo.path}`, error)
      return null
    }
  }
}