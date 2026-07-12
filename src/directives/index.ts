import type { App } from 'vue'
import { setupAuthDirective, type AuthDirective } from './core/auth'
import { setupHighlightDirective, type HighlightDirective } from './business/highlight'
import { setupRippleDirective, type RippleDirective } from './business/ripple'
import { setupSafeHtmlDirective, type SafeHtmlDirective } from './business/safeHtml'
import { setupRolesDirective, type RolesDirective } from './core/roles'
import { setupPermDirective, type PermDirective } from './core/perm'

export function setupGlobDirectives(app: App) {
  setupAuthDirective(app) // 权限指令
  setupRolesDirective(app) // 角色权限指令
  setupPermDirective(app) // 权限码指令（v-perm，与 hasPerm 同源）
  setupHighlightDirective(app) // 高亮指令
  setupRippleDirective(app) // 水波纹指令
  setupSafeHtmlDirective(app) // 富文本安全渲染指令（v-safe-html，DOMPurify 净化）
}

export type {
  AuthDirective,
  HighlightDirective,
  RippleDirective,
  RolesDirective,
  PermDirective,
  SafeHtmlDirective
}
