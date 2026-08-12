import { onMounted, ref } from 'vue'
import { fetchUserSelect } from '@/api/message'

export interface UserSelectOption {
  label: string
  value: number | string
}

/** 远程搜索防抖间隔（毫秒） */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 用户选择器远程搜索（成千账号场景不下全量）：
 * - 挂载即拉默认列表（后端封顶 50 条启用用户）；
 * - `searchUsers` 供 ElSelect `remote-method`，关键字防抖后查询用户名/昵称；
 * - 已选中项始终保留在选项中（避免远程结果刷新后选中标签退化为原始 id）；
 * - `ensureUsers` 按 id 精确补拉（编辑回显场景）。
 */
export function useUserSelectSearch() {
  const userOptions = ref<UserSelectOption[]>([])
  const userSearching = ref(false)
  /** 所有加载过的选项缓存（value → option） */
  const cache = new Map<number | string, UserSelectOption>()
  /** 当前已选中的 value（多选传数组、单选传单值，由页面 change 时同步） */
  const selectedValues = ref<Array<number | string>>([])
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  /** 选项 = 已选中项 ∪ 本次搜索结果（去重） */
  const rebuild = (results: UserSelectOption[]): void => {
    const merged = new Map<number | string, UserSelectOption>()
    selectedValues.value.forEach((v) => {
      const hit = cache.get(v)
      if (hit) merged.set(v, hit)
    })
    results.forEach((o) => merged.set(o.value, o))
    userOptions.value = [...merged.values()]
  }

  const load = async (keyword?: string): Promise<void> => {
    userSearching.value = true
    try {
      const list = (await fetchUserSelect(keyword ? { keyword } : undefined)) || []
      list.forEach((o) => cache.set(o.value, o))
      rebuild(list)
    } finally {
      userSearching.value = false
    }
  }

  /** ElSelect remote-method：关键字防抖搜索（空串回默认列表） */
  const searchUsers = (keyword: string): void => {
    if (debounceTimer) clearTimeout(debounceTimer)
    const kw = keyword.trim()
    debounceTimer = setTimeout(() => void load(kw || undefined), SEARCH_DEBOUNCE_MS)
  }

  /** 页面在 ElSelect change 时同步当前选中值，保证已选项不因搜索刷新而丢标签 */
  const syncSelected = (value: number | string | Array<number | string> | undefined): void => {
    selectedValues.value = value == null ? [] : Array.isArray(value) ? [...value] : [value]
    rebuild(userOptions.value)
  }

  /** 编辑回显：按 id 精确补拉缺失选项 */
  const ensureUsers = async (ids: Array<number | string>): Promise<void> => {
    const missing = ids.filter((id) => !cache.has(id))
    if (!missing.length) return
    const list = (await fetchUserSelect({ ids: missing.join(',') })) || []
    list.forEach((o) => cache.set(o.value, o))
    rebuild(userOptions.value)
  }

  onMounted(() => void load())

  return { userOptions, userSearching, searchUsers, syncSelected, ensureUsers }
}
