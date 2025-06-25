/**
 * 分页排版工具类
 */
export class PageLayout {
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
    this.lineHeight = 1.5
    this.fontSize = 14
  }

  /**
   * 设置页面尺寸
   * @param {string} pageSize - 页面尺寸名称
   */
  setPageSize(pageSize) {
    if (this.pageSizes[pageSize]) {
      this.currentPageSize = pageSize
      return true
    }
    return false
  }

  /**
   * 获取当前页面尺寸
   * @returns {Object} 页面尺寸对象
   */
  getCurrentPageSize() {
    return this.pageSizes[this.currentPageSize]
  }

  /**
   * 将毫米转换为像素
   * @param {number} mm - 毫米值
   * @returns {number} 像素值
   */
  mmToPx(mm) {
    // 假设 96 DPI，1 英寸 = 25.4 毫米
    return (mm * 96) / 25.4
  }

  /**
   * 计算页面内容区域
   * @returns {Object} 内容区域尺寸
   */
  getContentArea() {
    const pageSize = this.getCurrentPageSize()
    const width = this.mmToPx(pageSize.width - this.margin.left - this.margin.right)
    const height = this.mmToPx(pageSize.height - this.margin.top - this.margin.bottom)

    return { width, height }
  }

  /**
   * 分页算法
   * @param {string} htmlContent - HTML 内容
   * @returns {Array} 分页后的页面数组
   */
  paginate(htmlContent) {
    const pages = []
    const contentArea = this.getContentArea()

    // 创建临时容器来测量内容
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${contentArea.width}px;
      font-size: ${this.fontSize}px;
      line-height: ${this.lineHeight};
      overflow: hidden;
    `
    tempContainer.innerHTML = htmlContent
    document.body.appendChild(tempContainer)

    // 获取所有可分割的元素
    const elements = Array.from(tempContainer.children)
    let currentPage = []
    let currentHeight = 0

    elements.forEach(element => {
      const elementHeight = element.offsetHeight

      // 检查图片是否会被截断
      if (element.tagName === 'IMG') {
        if (currentHeight + elementHeight > contentArea.height) {
          // 图片会被截断，开始新页
          if (currentPage.length > 0) {
            pages.push(this.createPage(currentPage))
            currentPage = []
            currentHeight = 0
          }
        }
      }

      // 检查是否需要分页
      if (currentHeight + elementHeight > contentArea.height) {
        // 尝试分割文本元素
        if (element.tagName === 'P' && element.textContent.length > 50) {
          const splitResult = this.splitParagraph(element, contentArea.height - currentHeight)
          if (splitResult.first) {
            currentPage.push(splitResult.first)
            pages.push(this.createPage(currentPage))
            currentPage = [splitResult.remaining]
            currentHeight = splitResult.remaining.offsetHeight
          } else {
            pages.push(this.createPage(currentPage))
            currentPage = [element]
            currentHeight = elementHeight
          }
        } else {
          pages.push(this.createPage(currentPage))
          currentPage = [element]
          currentHeight = elementHeight
        }
      } else {
        currentPage.push(element)
        currentHeight += elementHeight
      }
    })

    // 添加最后一页
    if (currentPage.length > 0) {
      pages.push(this.createPage(currentPage))
    }

    document.body.removeChild(tempContainer)
    return pages
  }

  /**
   * 分割段落
   * @param {Element} paragraph - 段落元素
   * @param {number} availableHeight - 可用高度
   * @returns {Object} 分割结果
   */
  splitParagraph(paragraph, availableHeight) {
    const words = paragraph.textContent.split(' ')
    const tempP = paragraph.cloneNode(true)

    for (let i = words.length - 1; i >= 0; i--) {
      tempP.textContent = words.slice(0, i + 1).join(' ')
      if (tempP.offsetHeight <= availableHeight) {
        const first = paragraph.cloneNode(true)
        first.textContent = words.slice(0, i + 1).join(' ')

        const remaining = paragraph.cloneNode(true)
        remaining.textContent = words.slice(i + 1).join(' ')

        return { first, remaining }
      }
    }

    return { first: null, remaining: paragraph }
  }

  /**
   * 创建页面
   * @param {Array} elements - 页面元素数组
   * @returns {Object} 页面对象
   */
  createPage(elements) {
    const pageDiv = document.createElement('div')
    pageDiv.className = 'page'
    pageDiv.style.cssText = `
      width: ${this.mmToPx(this.getCurrentPageSize().width)}px;
      height: ${this.mmToPx(this.getCurrentPageSize().height)}px;
      padding: ${this.mmToPx(this.margin.top)}px ${this.mmToPx(this.margin.right)}px ${this.mmToPx(this.margin.bottom)}px ${this.mmToPx(this.margin.left)}px;
      box-sizing: border-box;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin: 20px auto;
      overflow: hidden;
    `

    elements.forEach(element => {
      pageDiv.appendChild(element.cloneNode(true))
    })

    return {
      element: pageDiv,
      content: pageDiv.innerHTML
    }
  }

  /**
   * 获取页面样式
   * @returns {string} CSS 样式字符串
   */
  getPageStyles() {
    const pageSize = this.getCurrentPageSize()
    const width = this.mmToPx(pageSize.width)
    const height = this.mmToPx(pageSize.height)

    return `
      .page {
        width: ${width}px;
        height: ${height}px;
        padding: ${this.mmToPx(this.margin.top)}px ${this.mmToPx(this.margin.right)}px ${this.mmToPx(this.margin.bottom)}px ${this.mmToPx(this.margin.left)}px;
        box-sizing: border-box;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin: 20px auto;
        overflow: hidden;
        font-size: ${this.fontSize}px;
        line-height: ${this.lineHeight};
      }

      .page-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #f5f5f5;
        min-height: 100vh;
      }

      .article-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
        text-align: center;
      }

      .paragraph {
        margin-bottom: 12px;
        text-align: justify;
      }

      .article-image {
        max-width: 100%;
        height: auto;
        margin: 10px 0;
      }

      .heading {
        margin: 20px 0 10px 0;
        font-weight: bold;
      }
    `
  }
}