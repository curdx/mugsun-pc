import request from '@/utils/http'
import type { DictItem } from '@/utils/constants/dict'
import type { DictVO, DictBizVO, DictForm, DictBizForm, DictTreeQuery } from './type'

/** 系统字典树（可带 dictValue/code 查询条件，后端过滤并回填亲属节点） */
export function fetchDictTree(params?: DictTreeQuery) {
  return request.get<DictVO[]>({ url: '/api/system/dict/tree', params })
}

/** 批量按字典码查询字典项（字典运行时并发去重；返回前端运行时形 DictItem） */
export function fetchDictBatch(codes: string[]) {
  return request.post<Record<string, DictItem[]>>({ url: '/api/system/dict/batch', data: codes })
}

/** 保存系统字典（新增/编辑同端点） */
export function saveDict(data: DictForm) {
  return request.post<void>({ url: '/api/system/dict/submit', data })
}

/** 删除系统字典（DictTreeView 传单 id，容错包裹为数组） */
export function removeDict(ids: Array<number | string> | number | string) {
  return request.post<void>({
    url: '/api/system/dict/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

/** 业务字典树（可带 dictValue/code 查询条件，后端过滤并回填亲属节点） */
export function fetchDictBizTree(params?: DictTreeQuery) {
  return request.get<DictBizVO[]>({ url: '/api/system/dict-biz/tree', params })
}

/** 保存业务字典（新增/编辑同端点） */
export function saveDictBiz(data: DictBizForm) {
  return request.post<void>({ url: '/api/system/dict-biz/submit', data })
}

/** 删除业务字典（DictTreeView 传单 id，容错包裹为数组） */
export function removeDictBiz(ids: Array<number | string> | number | string) {
  return request.post<void>({
    url: '/api/system/dict-biz/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
