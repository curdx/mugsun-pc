import { computed, type ComputedRef } from 'vue'
import { useDictStore } from '@/store/modules/dict'
import type { DictItem } from '@/utils/constants/dict'

/**
 * 字典运行时组合式：变长字典码，触发按需加载（并发去重由 store 兜底），
 * 返回按码取字典项的响应式 computed 映射。
 *
 * @example
 * const { user_status } = useDict(DICT_CODE.USER_STATUS)
 * // user_status.value -> DictItem[]
 */
export function useDict<T extends string>(...codes: T[]): Record<T, ComputedRef<DictItem[]>> {
  const store = useDictStore()
  store.ensure(codes)
  const result = {} as Record<T, ComputedRef<DictItem[]>>
  codes.forEach((code) => {
    result[code] = computed(() => store.getItems(code))
  })
  return result
}
