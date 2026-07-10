/**
 * 权限校验（函数式，补指令够不到的场景：表格操作列 show、computed、JS 分支）
 *
 * 与 v-perm 指令共用 matchPermission，保证指令与函数同源同语义。
 * 权限码取自 `/auth/info` 下发、存于用户信息的 buttons；角色取 roles。
 *
 * @module utils/permission
 * @author Mugsun
 */

import { useUserStore } from '@/store/modules/user'

/**
 * 权限码通配匹配：
 * - owned 含 `*` 或 `*:*:*` → 放行全部（超管）
 * - 精确命中
 * - 段级通配：owned `sys:user:*` 匹配 required `sys:user:add`
 */
export function matchPermission(owned: string[] | undefined, required: string): boolean {
  if (!required) return true
  if (!owned || owned.length === 0) return false
  if (owned.includes('*') || owned.includes('*:*:*')) return true
  if (owned.includes(required)) return true
  const req = required.split(':')
  return owned.some((code) => {
    const seg = code.split(':')
    return seg.length === req.length && seg.every((s, i) => s === '*' || s === req[i])
  })
}

/** 当前用户已授权按钮权限码 */
function ownedPerms(): string[] {
  return useUserStore().getUserInfo.buttons ?? []
}

/** 当前用户角色码 */
function ownedRoles(): string[] {
  return useUserStore().getUserInfo.roles ?? []
}

/** 是否拥有某权限码（通配感知） */
export function hasPerm(code: string): boolean {
  return matchPermission(ownedPerms(), code)
}

/** 拥有任一权限码即通过 */
export function hasPermOr(...codes: string[]): boolean {
  return codes.some((c) => hasPerm(c))
}

/** 拥有全部权限码才通过（无参 fail-closed，避免误放行） */
export function hasPermAnd(...codes: string[]): boolean {
  return codes.length > 0 && codes.every((c) => hasPerm(c))
}

/** 是否拥有某角色码 */
export function hasRole(role: string): boolean {
  return ownedRoles().includes(role)
}

/** 拥有任一角色即通过 */
export function hasRoleOr(...roles: string[]): boolean {
  const owned = ownedRoles()
  return roles.some((r) => owned.includes(r))
}
