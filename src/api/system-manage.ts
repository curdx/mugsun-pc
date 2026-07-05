import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import { useUserStore } from '@/store/modules/user'

// 获取用户列表（对接后端 /system/user/page）
export function fetchGetUserList(params: Record<string, any>) {
  return request.get<any>({
    url: '/api/system/user/page',
    params
  })
}

// 保存用户（新增/编辑，对接后端 /system/user/submit）
export function fetchSaveUser(data: Record<string, any>) {
  return request.post<void>({
    url: '/api/system/user/submit',
    data
  })
}

// 删除用户（批量，主键数组走 JSON 请求体）
export function fetchRemoveUser(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/user/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 导出用户（认证 GET 二进制，原生 fetch 触发下载）
export async function exportUser(): Promise<void> {
  const { accessToken } = useUserStore()
  const res = await fetch('/api/system/user/export', {
    headers: accessToken ? { Authorization: accessToken } : undefined
  })
  if (!res.ok) throw new Error('导出失败')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '用户数据.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

// 导入用户（multipart 上传）
export function importUser(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<void>({
    url: '/api/system/user/import',
    data: form
  })
}

// ===== 部门 =====
export function fetchDeptTree() {
  return request.get<any[]>({ url: '/api/system/dept/tree' })
}
export function fetchDeptSelect() {
  return request.get<Array<{ label: string; value: string }>>({ url: '/api/system/dept/select' })
}
export function fetchSaveDept(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/dept/submit', data })
}
export function fetchRemoveDept(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/dept/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 岗位 =====
export function fetchGetPostList(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/post/page', params })
}
export function fetchSavePost(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/post/submit', data })
}
export function fetchRemovePost(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/post/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取角色列表
// ===== 角色 =====
export function fetchGetRoleList(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/role/page', params })
}
export function fetchSaveRole(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/role/submit', data })
}
export function fetchRemoveRole(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/role/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
// 角色已授权菜单 id 集合（授权树回显）
export function fetchRoleMenuIds(roleId: number | string) {
  return request.get<Array<number | string>>({
    url: '/api/system/role/menu-ids',
    params: { roleId }
  })
}
// 角色授权菜单（body 信封 {roleId, menuIds}）
export function fetchGrantRole(roleId: number | string, menuIds: Array<number | string>) {
  return request.post<void>({
    url: '/api/system/role/grant',
    data: { roleId, menuIds }
  })
}
// 菜单树
export function fetchMenuTree() {
  return request.get<any[]>({ url: '/api/system/menu/tree' })
}
export function fetchSaveMenu(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/menu/submit', data })
}
export function fetchRemoveMenu(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/menu/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 参数 =====
export function fetchParamList() {
  return request.get<any[]>({ url: '/api/system/param/list' })
}
export function fetchSaveParam(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/param/submit', data })
}
export function fetchRemoveParam(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/param/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 系统字典（树） =====
export function fetchDictTree() {
  return request.get<any[]>({ url: '/api/system/dict/tree' })
}
export function fetchSaveDict(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/dict/submit', data })
}
export function fetchRemoveDict(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/dict/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 业务字典（树） =====
export function fetchDictBizTree() {
  return request.get<any[]>({ url: '/api/system/dict-biz/tree' })
}
export function fetchSaveDictBiz(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/dict-biz/submit', data })
}
export function fetchRemoveDictBiz(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/dict-biz/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus'
  })
}
