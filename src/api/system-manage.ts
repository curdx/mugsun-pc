import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

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

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus'
  })
}
