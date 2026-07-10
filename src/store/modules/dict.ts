import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { fetchDictBatch } from '@/api/system-manage'
import type { DictItem } from '@/utils/constants/dict'

/**
 * 字典运行时缓存：全局按字典码缓存字典项 + 并发去重（同码同时被多组件请求只发一次 HTTP）。
 *
 * - `dictData`：reactive 缓存，供 useDict/标签组件 computed 响应式取值
 * - `inflight`：在途请求登记，同 tick 内同码只发一次批量请求
 * - `ensure`：确保给定字典码已加载（缓存命中即跳过，未命中批量拉取）
 * - `evict/reload`：字典维护变更后失效/重载缓存，实现改值即时生效
 */
export const useDictStore = defineStore('dictStore', () => {
  /** 字典码 -> 字典项列表 */
  const dictData = reactive<Record<string, DictItem[]>>({})
  /** 字典码 -> 在途请求（不进持久化，纯内存去重） */
  const inflight = new Map<string, Promise<void>>()

  /** 确保字典码已加载：过滤未缓存且未在途的码，一次批量拉取 */
  function ensure(codes: string[]): void {
    const missing = codes.filter((c) => c && !(c in dictData) && !inflight.has(c))
    if (missing.length === 0) return
    const promise = fetchDictBatch(missing)
      .then((map) => {
        // 仅当仍是本次请求的 owner 时写回，避免被 reload 触发的新请求结果覆盖（防陈旧覆盖）
        missing.forEach((c) => {
          if (inflight.get(c) === promise) dictData[c] = map?.[c] ?? []
        })
      })
      .catch(() => {
        // 失败不写占位缓存：保留 key 缺席，允许后续 ensure（重挂载/切换）重取，避免负缓存
      })
      .finally(() => {
        // 仅清理仍属于自己的在途登记，避免误删他人的令牌（防 reload 竞态）
        missing.forEach((c) => {
          if (inflight.get(c) === promise) inflight.delete(c)
        })
      })
    // 同步登记在途，杜绝同 tick 内重复请求
    missing.forEach((c) => inflight.set(c, promise))
  }

  /** 取字典项列表（未加载返回空数组） */
  function getItems(code: string): DictItem[] {
    return dictData[code] ?? []
  }

  /** 按值匹配字典项（dictKey 与业务值按字符串比对） */
  function getItem(code: string, value: unknown): DictItem | undefined {
    const v = value == null ? '' : String(value)
    return getItems(code).find((it) => String(it.dictKey) === v)
  }

  /** 按值取字典标签（未命中原样返回值） */
  function getLabel(code: string, value: unknown): string {
    return getItem(code, value)?.dictValue ?? (value == null ? '' : String(value))
  }

  /** 失效指定字典码缓存 */
  function evict(code: string): void {
    delete dictData[code]
    inflight.delete(code)
  }

  /** 重载指定字典码（失效后立即重新拉取，供已挂载组件即时刷新） */
  function reload(code: string): void {
    evict(code)
    ensure([code])
  }

  return { dictData, ensure, getItems, getItem, getLabel, evict, reload }
})
