import request from '@/utils/http'
import type { RolePage, RolePageQuery, RoleForm, SelectOption } from './type'

/** 角色分页（强类型：返回 openapi 生成的 PageSysRole） */
export function fetchRolePage(params: RolePageQuery) {
  return request.get<RolePage>({ url: '/api/system/role/page', params })
}

/** 保存角色（新增/编辑同端点） */
export function saveRole(data: RoleForm) {
  return request.post<void>({ url: '/api/system/role/submit', data })
}

/** 删除角色（批量 id 数组） */
export function removeRole(ids: Array<number | string>) {
  return request.post<void>({ url: '/api/system/role/remove', data: ids })
}

/** 角色已授权菜单 id 集合（授权树回显） */
export function fetchRoleMenuIds(roleId: number | string) {
  return request.get<Array<number | string>>({
    url: '/api/system/role/menu-ids',
    params: { roleId }
  })
}

/** 角色自定义部门 id 集合（data_scope=5 回显） */
export function fetchRoleDeptIds(roleId: number | string) {
  return request.get<Array<number | string>>({
    url: '/api/system/role/dept-ids',
    params: { roleId }
  })
}

/** 角色授权菜单（body 信封 {roleId, menuIds}） */
export function grantRole(roleId: number | string, menuIds: Array<number | string>) {
  return request.post<void>({ url: '/api/system/role/grant', data: { roleId, menuIds } })
}

/** 角色下拉选项 */
export function fetchRoleSelect() {
  return request.get<SelectOption[]>({ url: '/api/system/role/select' })
}

/** 角色码下拉（value=角色码），流程审批人选择用 */
export function fetchRoleCodeSelect() {
  return request.get<SelectOption[]>({ url: '/api/system/role/code-select' })
}
