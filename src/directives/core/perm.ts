/**
 * v-perm 权限码指令
 *
 * 基于 `/auth/info` 下发的按钮权限码控制元素显隐，与 utils/permission 的 hasPerm 同源同语义
 * （支持 `*` / `*:*:*` 通配）。数组值表示"任一即可"（OR）。
 *
 * 与旧 v-auth/v-roles 的 removeChild 不同，本指令用 display 切换、权限变化可恢复。
 *
 * @example
 * <el-button v-perm="'sys:user:add'">新增</el-button>
 * <el-button v-perm="['sys:user:edit', 'sys:user:remove']">编辑或删除</el-button>
 *
 * @module directives/perm
 * @author Mugsun
 */

import { hasPerm } from '@/utils/permission'
import { App, Directive, DirectiveBinding } from 'vue'

export type PermDirective = Directive<HTMLElement, string | string[]>

interface PermEl extends HTMLElement {
  __permPrevDisplay?: string
  __permHidden?: boolean
}

function apply(el: PermEl, binding: DirectiveBinding<string | string[]>): void {
  const codes = Array.isArray(binding.value) ? binding.value : [binding.value]
  const ok = codes.filter(Boolean).some((c) => hasPerm(String(c)))
  if (ok) {
    // 恢复显示
    if (el.__permHidden) {
      el.style.display = el.__permPrevDisplay ?? ''
      el.__permHidden = false
    }
  } else {
    if (!el.__permHidden) {
      el.__permPrevDisplay = el.style.display
      el.__permHidden = true
    }
    el.style.display = 'none'
  }
}

const permDirective: PermDirective = {
  mounted: apply,
  updated: apply
}

export function setupPermDirective(app: App): void {
  app.directive('perm', permDirective)
}
