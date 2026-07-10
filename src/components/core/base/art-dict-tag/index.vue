<!-- 字典标签：按字典码 + 值渲染带颜色的 el-tag（字典运行时驱动，替代硬编码 options） -->
<template>
  <ElTag
    v-if="item"
    :color="item.color || undefined"
    :type="item.color ? undefined : 'info'"
    :effect="item.color ? 'dark' : 'light'"
    size="small"
    disable-transitions
  >
    {{ item.dictValue }}
  </ElTag>
  <span v-else>{{ fallbackText }}</span>
</template>

<script setup lang="ts">
  import { computed, watchEffect } from 'vue'
  import { ElTag } from 'element-plus'
  import { useDictStore } from '@/store/modules/dict'

  defineOptions({ name: 'ArtDictTag' })

  const props = defineProps<{
    /** 字典码 */
    code: string
    /** 业务字段值 */
    value?: string | number | null
  }>()

  const store = useDictStore()
  // 字典码变化即确保加载；并发去重由 store 统一兜底（多组件同码仅一次 HTTP）
  watchEffect(() => {
    if (props.code) store.ensure([props.code])
  })

  const item = computed(() => store.getItem(props.code, props.value))
  const fallbackText = computed(() =>
    props.value === null || props.value === undefined ? '' : String(props.value)
  )
</script>
