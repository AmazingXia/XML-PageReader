/**
 * XML 解析工具类
 */
export class XMLParser {
  /**
   * 解析 XML 字符串
   * @param {string} xmlString - XML 字符串
   * @param {string} prefix - 图片前缀
   * @returns {Object} 解析后的对象
   */
  static parse(xmlString, prefix) {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    // 检查解析错误
    const parseError = xmlDoc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      throw new Error('XML 解析失败')
    }

    this.prefix = prefix || ''
    return this.parseNode(xmlDoc.documentElement)
  }

  /**
   * 解析 XML 节点
   * @param {Element} node - XML 节点
   * @returns {Object} 解析后的对象
   */
  static parseNode(node) {
    const result = {
      tagName: node.tagName,
      attributes: {},
      content: '',
      children: []
    }

    // 解析属性
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i]
      result.attributes[attr.name] = attr.value
    }

    // 解析子节点
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i]

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.trim()
        if (text) {
          result.content += text
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        result.children.push(this.parseNode(child))
      }
    }

    return result
  }

  /**
   * 将解析后的对象转换为 HTML
   * @param {Object} parsedData - 解析后的数据
   * @returns {string} HTML 字符串
   */
  static toHTML(parsedData) {
    if (!parsedData) return ''

    let html = ''

    // 处理标题
    if (parsedData.tagName === 'title') {
      html += `<h1 class="article-title">${parsedData.content}</h1>`
    }

    // 处理正文
    if (parsedData.tagName === 'body') {
      html += '<div class="article-body">'
      parsedData.children.forEach(child => {
        html += this.toHTML(child)
      })
      html += '</div>'
    }

    // 处理 figure
    if (parsedData.tagName === 'figure') {
      const figureId = parsedData.attributes.id || ''
      html += `<figure id="figure-${figureId}" class="article-figure">`

      // 先处理image
      const imageChild = parsedData.children.find(child => child.tagName === 'image')
      if (imageChild) {
        html += this.toHTML(imageChild)
      }

      // 再处理title（作为figcaption）
      const titleChild = parsedData.children.find(child => child.tagName === 'title')
      if (titleChild) {
        html += `<figcaption class="figure-title">${titleChild.content}</figcaption>`
      }

      html += '</figure>'
    }

    // 处理 image
    if (parsedData.tagName === 'image') {
      const src = parsedData.attributes.href || ''
      const placement = parsedData.attributes.placement || ''
      const alt = parsedData.children.find(c => c.tagName === 'alt')?.content || ''

      // 根据placement属性决定样式类
      const placementClass = placement === 'break' ? 'image-break' : 'image-inline'

      html += `<img src="${this.prefix}/${src}" alt="${alt}" class="article-image ${placementClass}" />`
    }

    // 处理 p
    if (parsedData.tagName === 'p') {
      const pId = parsedData.attributes.id || ''
      html += `<p id="p-${pId}" class="paragraph">${parsedData.content}</p>`
    }

    // 处理 h1/h2/h3
    if (["h1", "h2", "h3"].includes(parsedData.tagName)) {
      html += `<${parsedData.tagName} class="heading">${parsedData.content}</${parsedData.tagName}>`
    }

    // 递归处理其它子节点
    if (!['body', 'figure', 'image', 'p', 'h1', 'h2', 'h3', 'title'].includes(parsedData.tagName)) {
      parsedData.children.forEach(child => {
        html += this.toHTML(child)
      })
    }

    return html
  }

  /**
   * 从文件读取 XML
   * @param {File} file - XML 文件
   * @returns {Promise<Object>} 解析后的对象
   */
  static async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const result = this.parse(e.target.result)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file, 'utf-8')
    })
  }
}