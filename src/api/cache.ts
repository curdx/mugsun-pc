import request from '@/utils/http'

/** 缓存分组（按前缀聚合） */
export function fetchCacheGroups() {
  return request.get<Array<{ name: string; count: number }>>({ url: '/api/system/cache/groups' })
}

/** 某分组下的键 */
export function fetchCacheKeys(group: string) {
  return request.get<string[]>({ url: '/api/system/cache/keys', params: { group } })
}

/** 键的值/类型/TTL */
export function fetchCacheValue(key: string) {
  return request.get<any>({ url: '/api/system/cache/value', params: { key } })
}

/** 清除键 */
export function fetchRemoveCache(keys: string[]) {
  return request.post<void>({ url: '/api/system/cache/remove', data: keys })
}
