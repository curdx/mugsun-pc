<!-- 菜单图标选择器：常用 ri 图标网格 + 名称搜索 + 预览 -->
<!-- 值为 Iconify 图标名（如 ri:user-line），与路由 meta.icon、侧边栏渲染同体系 -->
<template>
  <ElPopover
    v-model:visible="visible"
    trigger="click"
    width="372"
    popper-class="icon-selector-popper"
  >
    <template #reference>
      <ElInput
        :model-value="modelValue"
        readonly
        placeholder="请选择图标"
        clearable
        @clear="handleClear"
      >
        <template #prefix>
          <ArtSvgIcon v-if="modelValue" :icon="modelValue" />
        </template>
      </ElInput>
    </template>
    <ElInput v-model="keyword" placeholder="搜索图标名称" clearable class="icon-search" />
    <div class="icon-grid">
      <div
        v-for="icon in filteredIcons"
        :key="icon"
        class="icon-cell"
        :class="{ 'is-active': icon === modelValue }"
        :data-icon="icon"
        :title="icon"
        @click="handleSelect(icon)"
      >
        <ArtSvgIcon :icon="icon" />
      </div>
      <div v-if="!filteredIcons.length" class="icon-empty">无匹配图标</div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    modelValue?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const visible = ref(false)
  const keyword = ref('')

  // 常用图标集：项目路由在用的 ri 图标 + 后台管理高频图标（Iconify 按名渲染，不引新依赖）
  const ICONS: string[] = [
    'ri:dashboard-line',
    'ri:home-line',
    'ri:home-2-line',
    'ri:apps-2-line',
    'ri:menu-line',
    'ri:user-line',
    'ri:user-3-line',
    'ri:user-add-line',
    'ri:user-settings-line',
    'ri:team-line',
    'ri:group-line',
    'ri:contacts-book-line',
    'ri:organization-chart',
    'ri:building-line',
    'ri:community-line',
    'ri:shield-keyhole-line',
    'ri:lock-line',
    'ri:key-2-line',
    'ri:settings-3-line',
    'ri:mail-settings-line',
    'ri:tools-line',
    'ri:terminal-box-line',
    'ri:code-box-line',
    'ri:git-branch-line',
    'ri:database-2-line',
    'ri:node-tree',
    'ri:table-line',
    'ri:file-list-3-line',
    'ri:file-edit-line',
    'ri:folder-2-line',
    'ri:book-2-line',
    'ri:book-marked-line',
    'ri:question-line',
    'ri:mail-line',
    'ri:mail-open-line',
    'ri:message-2-line',
    'ri:notification-2-line',
    'ri:feedback-line',
    'ri:send-plane-line',
    'ri:cloud-line',
    'ri:inbox-archive-line',
    'ri:task-line',
    'ri:timer-line',
    'ri:history-line',
    'ri:calendar-line',
    'ri:bar-chart-2-line',
    'ri:line-chart-line',
    'ri:computer-line',
    'ri:device-line',
    'ri:map-pin-line',
    'ri:global-line',
    'ri:link',
    'ri:external-link-line',
    'ri:price-tag-3-line',
    'ri:star-line',
    'ri:flag-line',
    'ri:eye-line',
    'ri:search-line',
    'ri:add-line',
    'ri:edit-line',
    'ri:delete-bin-line',
    'ri:save-line',
    'ri:download-line',
    'ri:upload-line',
    'ri:printer-line',
    'ri:image-line',
    'ri:shopping-cart-line',
    'ri:bank-card-line',
    'ri:wallet-line',
    'ri:error-warning-line'
  ]

  const filteredIcons = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return ICONS
    return ICONS.filter((icon) => icon.toLowerCase().includes(kw))
  })

  const handleSelect = (icon: string): void => {
    emit('update:modelValue', icon)
    visible.value = false
  }

  const handleClear = (): void => {
    emit('update:modelValue', '')
  }
</script>

<!-- popper 挂载在 body，scoped 够不到，统一以 popper-class 限定作用域防污染 -->
<style>
  .icon-selector-popper .icon-search {
    margin-bottom: 8px;
  }

  .icon-selector-popper .icon-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    max-height: 240px;
    overflow-y: auto;
  }

  .icon-selector-popper .icon-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 6px;
  }

  .icon-selector-popper .icon-cell:hover {
    border-color: var(--el-color-primary);
  }

  .icon-selector-popper .icon-cell.is-active {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  .icon-selector-popper .icon-empty {
    grid-column: 1 / -1;
    padding: 16px 0;
    color: var(--el-text-color-secondary);
    text-align: center;
  }
</style>
