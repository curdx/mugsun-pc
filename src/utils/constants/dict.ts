/**
 * 字典码常量集中定义 + 字典项类型
 *
 * 业务页统一从此引用字典码，杜绝魔法字符串散落各页。
 *
 * @module utils/constants/dict
 * @author Mugsun
 */

/** 字典项（后端 sys_dict 精简投影，前端仅消费键/值/颜色） */
export interface DictItem {
  /** 字典键（与业务字段值比对） */
  dictKey: string
  /** 字典标签（展示文本） */
  dictValue: string
  /** 标签颜色（十六进制，空则走默认样式） */
  color?: string | null
  /** 排序 */
  sort?: number
}

/** 系统字典码常量 */
export const DICT_CODE = {
  /** 用户状态：1 正常 / 0 停用 */
  USER_STATUS: 'user_status',
  /** 登录结果：1 成功 / 0 失败 */
  LOGIN_RESULT: 'login_result'
} as const

/** 字典码字面量类型 */
export type DictCode = (typeof DICT_CODE)[keyof typeof DICT_CODE]
