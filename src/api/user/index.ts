import request from '@/utils/http'
import type { UserPage, UserPageQuery, UserForm, UserVO } from './type'

/** 用户分页（强类型：返回 openapi 生成的 PageSysUser） */
export function fetchUserPage(params: UserPageQuery) {
  return request.get<UserPage>({ url: '/api/system/user/page', params })
}

/** 用户详情 */
export function fetchUserDetail(id: number | string) {
  return request.get<UserVO>({ url: '/api/system/user/detail', params: { id } })
}

/** 保存用户（新增/编辑同端点） */
export function saveUser(data: UserForm) {
  return request.post<void>({ url: '/api/system/user/submit', data })
}

/** 删除用户（批量 id 数组） */
export function removeUser(ids: Array<number | string>) {
  return request.post<void>({ url: '/api/system/user/remove', data: ids })
}

/** 启用/停用用户 */
export function updateUserStatus(id: number | string, status: number) {
  return request.post<void>({ url: '/api/system/user/status', data: { id, status } })
}

/** 重置密码为默认（批量 id 数组） */
export function resetUserPassword(ids: Array<number | string>) {
  return request.post<void>({ url: '/api/system/user/reset-password', data: ids })
}

/** 用户已授权角色 id（回显） */
export function fetchUserRoleIds(userId: number | string) {
  return request.get<Array<number | string>>({
    url: '/api/system/user/role-ids',
    params: { userId }
  })
}

/** 用户授权角色（body 信封 {userId, roleIds}） */
export function grantUser(userId: number | string, roleIds: Array<number | string>) {
  return request.post<void>({ url: '/api/system/user/grant', data: { userId, roleIds } })
}

/** 导出用户（授权流式下载） */
export function exportUser() {
  return request.download({ url: '/api/system/user/export', filename: '用户数据.xlsx' })
}

/** 导入用户（multipart 上传） */
export function importUser(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<void>({ url: '/api/system/user/import', data: form })
}
