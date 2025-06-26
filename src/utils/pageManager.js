/**
 * 分页管理器
 * 支持动态计算页面大小、多页渲染、前后分页等功能
 */
export class PageManager {
  constructor() {
    // 页面尺寸配置
    this.pageSizes = {
      A4: { width: 210, height: 297, unit: 'mm' },
      A5: { width: 148, height: 210, unit: 'mm' },
      Letter: { width: 216, height: 279, unit: 'mm' },
      Legal: { width: 216, height: 356, unit: 'mm' }
    }

    this.currentPageSize = 'A4'
    this.margin = { top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' }
    this.lineHeight = 1.6
    this.fontSize = 16
    this.dpi = this.getDPI()

    // 分页配置
    this.pagesPerView = 2 // 默认显示2页
    this.currentPageIndex = 0
    this.totalPages = 0

    // 内容管理
    this.xmlFiles = [] // 存储所有XML文件信息
    this.renderedPages = [] // 当前渲染的页面
    this.currentChapterIndex = 0; // 当前章节（文件夹）索引
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
      // 处理上传的文件夹
      await this.processFolderContent(folderContent)
    }
  }

  /**
   * 处理文件夹内容
   */
  async processFolderContent(folderContent) {
    const { fileMap, folderRoots } = folderContent

    this.xmlFiles = []
    this.fileMap = fileMap // 存储文件映射供后续使用

    // 按顺序处理每个子目录
    const sortedFolders = folderRoots.sort((a, b) => {
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
        // 从文件映射中读取（上传的文件夹）
        const file = this.fileMap[fileInfo.path]
        xmlContent = await file.text()
      } else {
        // 从服务器读取
        const response = await fetch(fileInfo.path)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        xmlContent = await response.text()
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

  /**
   * 分页算法 - 使用CSS自动分页
   */
  async paginateContent(content, startElementIndex = 0, maxPages = Infinity) {
    const { XMLParser } = require('./xmlParser')
    const fileInfo = this.xmlFiles[this.currentChapterIndex];
    const htmlContent = XMLParser.toHTML(content, fileInfo.folderPath, this.fileMap)

    // 创建临时容器用于CSS分页
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${this.mmToPx(this.getCurrentPageSize().width)}px;
      height: ${this.mmToPx(this.getCurrentPageSize().height)}px;
      overflow-y: hidden;
      margin: 0px !important;
      padding: ${this.mmToPx(this.margin.top)}px ${this.mmToPx(this.margin.right)}px ${this.mmToPx(this.margin.bottom)}px ${this.mmToPx(this.margin.left)}px !important;
      box-sizing: border-box;
      max-width: inherit;
      column-fill: auto;
      column-gap: 74px;
      column-width: ${this.mmToPx(this.getCurrentPageSize().width - this.margin.left - this.margin.right)}px;
      font-size: ${this.fontSize}px;
      line-height: ${this.lineHeight};
      font-family: 'Stix', serif;
      font-variant-numeric: oldstyle-nums;
    `

    // 设置内容样式
    tempContainer.innerHTML = `
      <style>
        body {
          font-size: 1em;
          line-height: 1.33em;
          font-family: 'Stix', serif;
          font-variant-numeric: oldstyle-nums;
        }

        header {
          padding: 3em 0 2em 0;
        }

        h1 {
          font-size: 1.5em;
          line-height: 1.33em;
          text-align: center;
          padding-bottom: 0em;
          text-transform: uppercase;
          font-weight: normal;
          letter-spacing: 4px;
        }

        p {
          padding: 0;
          margin: 0;
          text-align: justify;
        }

        .article-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #2c3e50;
          text-align: center;
        }

        .paragraph {
          text-align: justify;
          text-indent: 2em;
        }

        .article-figure {
          margin: 20px 0;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .figure-title {
          font-size: 14px;
          color: #666;
          margin-top: 8px;
          font-style: italic;
        }

        .article-image {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .image-break {
          display: block;
          margin: 20px auto;
        }

        .image-inline {
          display: inline-block;
          margin: 0 8px;
        }

        .heading {
          margin: 20px 0 12px 0;
          color: #2c3e50;
          break-after: avoid;
          page-break-after: avoid;
        }
      </style>
      <div class="content-wrapper">
        ${htmlContent}
      </div>
    `

    document.body.appendChild(tempContainer)

    // 等待浏览器渲染完成并计算页数
    return new Promise((resolve) => {
      // 使用 requestAnimationFrame 确保渲染完成
      requestAnimationFrame(() => {
        const contentWrapper = tempContainer.querySelector('.content-wrapper')
        const totalHeight = contentWrapper.scrollHeight
        const containerHeight = tempContainer.clientHeight
        const totalPages = Math.ceil(totalHeight / containerHeight)

        // 创建页面数据
        const pages = []
        const actualPages = Math.min(totalPages, maxPages)

        for (let i = 0; i < actualPages; i++) {
          pages.push({
            content: this.createPageContent(htmlContent),
            elements: 1, // 每页作为一个整体
            pageIndex: i,
            totalPages: totalPages
          })
        }

        document.body.removeChild(tempContainer)
        resolve({
          pages,
          nextElementIndex: startElementIndex + actualPages,
          totalPages: totalPages
        })
      })
    })
  }

  /**
   * 创建页面内容
   */
  createPageContent(htmlContent) {
    const pageDiv = document.createElement('div')
    pageDiv.className = 'page'
    pageDiv.style.cssText = `
      width: ${this.mmToPx(this.getCurrentPageSize().width)}px;
      height: ${this.mmToPx(this.getCurrentPageSize().height)}px;
      padding: ${this.mmToPx(this.margin.top)}px ${this.mmToPx(this.margin.right)}px ${this.mmToPx(this.margin.bottom)}px ${this.mmToPx(this.margin.left)}px;
      box-sizing: border-box;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin: 10px;
      overflow: hidden;
      font-size: ${this.fontSize}px;
      line-height: ${this.lineHeight};
      font-family: 'Stix', serif;
      font-variant-numeric: oldstyle-nums;
    `

    // 添加内容，使用CSS分页
    pageDiv.innerHTML = `
      <style>
        .page-content {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .page-content p {
          padding: 0;
          margin: 0;
          text-align: justify;
        }

        .page-content .article-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #2c3e50;
          text-align: center;
        }

        .page-content .paragraph {
          text-align: justify;
          text-indent: 2em;
        }

        .page-content .article-figure {
          margin: 20px 0;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .page-content .figure-title {
          font-size: 14px;
          color: #666;
          margin-top: 8px;
          font-style: italic;
        }

        .page-content .article-image {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .page-content .heading {
          margin: 20px 0 12px 0;
          color: #2c3e50;
          break-after: avoid;
          page-break-after: avoid;
        }
      </style>
      <div class="page-content">
        ${htmlContent}
      </div>
    `

    return pageDiv.outerHTML
  }

  /**
   * 渲染当前章节的页面
   */
  async renderPages(pageIndex = 0, count = this.pagesPerView) {
    const pages = [];
    const fileInfo = this.xmlFiles[this.currentChapterIndex];
    if (!fileInfo) return { pages, totalPages: 0 };
    const content = await this.loadXMLFile(fileInfo);
    if (!content) return { pages, totalPages: 0 };
    // 分页整个章节内容
    const { pages: allPages } = await this.paginateContent(content, 0, Infinity);
    // 取出当前页码起始的count页
    for (let i = 0; i < count; i++) {
      const idx = pageIndex + i;
      if (allPages[idx]) {
        pages.push({
          ...allPages[idx],
          fileIndex: this.currentChapterIndex,
          globalPageIndex: idx
        });
      }
    }
    this.renderedPages = pages;
    this.currentPageIndex = pageIndex;
    return { pages, totalPages: allPages.length };
  }

  /**
   * 下一页
   */
  async nextPage() {
    const fileInfo = this.xmlFiles[this.currentChapterIndex];
    if (!fileInfo) return [];
    const content = await this.loadXMLFile(fileInfo);
    if (!content) return [];
    const { pages: allPages } = await this.paginateContent(content, 0, Infinity);
    let nextPageIndex = this.currentPageIndex + this.pagesPerView;
    if (nextPageIndex < allPages.length) {
      // 当前章节还有未渲染的页面
      this.currentPageIndex = nextPageIndex;
      return await this.renderPages(this.currentPageIndex, this.pagesPerView);
    } else if (this.currentChapterIndex < this.xmlFiles.length - 1) {
      // 当前章节已到末尾，切换到下一个章节第一页
      this.currentChapterIndex++;
      this.currentPageIndex = 0;
      return await this.renderPages(0, this.pagesPerView);
    } else {
      // 已是最后章节最后一页
      return await this.renderPages(this.currentPageIndex, this.pagesPerView);
    }
  }

  /**
   * 上一页
   */
  async prevPage() {
    let prevPageIndex = this.currentPageIndex - this.pagesPerView;
    if (prevPageIndex < 0) {
      // 当前章节第一页，自动切换到上一个章节
      if (this.currentChapterIndex > 0) {
        this.currentChapterIndex--;
        const fileInfo = this.xmlFiles[this.currentChapterIndex];
        const content = await this.loadXMLFile(fileInfo);
        const { pages: allPages } = await this.paginateContent(content, 0, Infinity);
        const lastPageIndex = Math.max(0, allPages.length - this.pagesPerView);
        this.currentPageIndex = lastPageIndex;
        return await this.renderPages(lastPageIndex, this.pagesPerView);
      } else {
        // 已是第一章节第一页
        this.currentPageIndex = 0;
        return await this.renderPages(0, this.pagesPerView);
      }
    } else {
      return await this.renderPages(prevPageIndex, this.pagesPerView);
    }
  }

  /**
   * 跳转到章节第一页
   */
  async goToFirstPage() {
    this.currentPageIndex = 0;
    return await this.renderPages(0, this.pagesPerView);
  }

  /**
   * 获取页面样式
   */
  getPageStyles() {
    const pageSize = this.getCurrentPageSize()
    const pageWidth = this.mmToPx(pageSize.width)
    const pageHeight = this.mmToPx(pageSize.height)

    return `
      .page-container {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        flex: 1;
        padding: 20px;
        overflow: auto;
        gap: 20px;
      }

      .page {
        width: ${pageWidth}px;
        height: ${pageHeight}px;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
        font-size: ${this.fontSize}px;
        line-height: ${this.lineHeight};
        font-family: 'Stix', serif;
        font-variant-numeric: oldstyle-nums;
      }

      .page-content {
        width: 100%;
        height: 100%;
        padding: ${this.mmToPx(this.margin.top)}px ${this.mmToPx(this.margin.right)}px ${this.mmToPx(this.margin.bottom)}px ${this.mmToPx(this.margin.left)}px;
        box-sizing: border-box;
        font-size: ${this.fontSize}px;
        line-height: ${this.lineHeight};
        color: #333;
        overflow: hidden;
      }

      .page-content p {
        padding: 0;
        margin: 0;
        text-align: justify;
      }

      .page-content header {
        padding: 3em 0 2em 0;
      }

      .page-content h1 {
        font-size: 1.5em;
        line-height: 1.33em;
        text-align: center;
        padding-bottom: 0em;
        text-transform: uppercase;
        font-weight: normal;
        letter-spacing: 4px;
      }

      .article-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #2c3e50;
        text-align: center;
      }

      .paragraph {
        text-align: justify;
        text-indent: 2em;
      }

      .article-figure {
        margin: 20px 0;
        text-align: center;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .figure-title {
        font-size: 14px;
        color: #666;
        margin-top: 8px;
        font-style: italic;
      }

      .article-image {
        max-width: 100%;
        height: auto;
        object-fit: contain;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .image-break {
        display: block;
        margin: 20px auto;
      }

      .image-inline {
        display: inline-block;
        margin: 0 8px;
      }

      .heading {
        margin: 20px 0 12px 0;
        color: #2c3e50;
        break-after: avoid;
        page-break-after: avoid;
      }

      .night-mode .page {
        background: #2d2d2d;
        color: #e0e0e0;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
      }

      .night-mode .page-content {
        color: #e0e0e0;
      }

      .night-mode .article-title {
        color: #f0f0f0;
      }

      .night-mode .heading {
        color: #f0f0f0;
      }

      .night-mode .figure-title {
        color: #ccc;
      }
    `
  }
}