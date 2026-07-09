import request from '@/utils/http'

/** 全局搜索·后端联想项 */
export interface SearchSuggestItem {
  type: string
  typeName: string
  title: string
  subtitle: string | null
  path: string
}

/** 全局搜索·业务数据联想（用户/部门/角色/通知，每类前 N 条） */
export function fetchSearchSuggest(keyword: string) {
  return request.get<SearchSuggestItem[]>({
    url: '/api/system/search/suggest',
    params: { keyword }
  })
}
