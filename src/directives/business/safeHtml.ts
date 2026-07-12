/**
 * v-safe-html 富文本安全渲染指令
 *
 * 统一入口：所有富文本渲染经 DOMPurify 净化后再写入 innerHTML，防存储型 XSS
 * （替代各页面局部散写 DOMPurify.sanitize 的重复逻辑）。
 *
 * ## 使用示例
 * ```vue
 * <div v-safe-html="notice.content"></div>
 * ```
 */
import DOMPurify from 'dompurify'
import type { App, Directive } from 'vue'

const render = (el: HTMLElement, value: unknown): void => {
  el.innerHTML = DOMPurify.sanitize(value == null ? '' : String(value))
}

const safeHtmlDirective: Directive<HTMLElement, unknown> = {
  mounted(el, binding) {
    render(el, binding.value)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      render(el, binding.value)
    }
  }
}

export function setupSafeHtmlDirective(app: App): void {
  app.directive('safe-html', safeHtmlDirective)
}

export type SafeHtmlDirective = typeof safeHtmlDirective
