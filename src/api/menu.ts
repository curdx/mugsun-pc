import request from '@/utils/http'

/** 菜单树查询条件（菜单管理页搜索栏） */
export interface MenuTreeQuery {
  /** 菜单名称（前后模糊） */
  menuName?: string
  /** 是否隐藏（0 显示 / 1 隐藏） */
  isHide?: number
}

/**
 * 菜单树（管理端，支持条件过滤）。
 * 与 system-manage.ts 的无参 fetchMenuTree 并存：带过滤能力的归本文件（该文件归其他任务，不改）。
 */
export function fetchMenuTree(params?: MenuTreeQuery) {
  return request.get<any[]>({ url: '/api/system/menu/tree', params })
}
