<!-- 缓存管理：按前缀分组查看 Redis 键、查看值/TTL、清除 -->
<template>
  <div class="cache-page art-full-height">
    <ElRow :gutter="12">
      <!-- 左：缓存分组 -->
      <ElCol :xs="24" :lg="8">
        <ElCard class="art-table-card" shadow="never">
          <div class="panel-toolbar">
            <span class="panel-title">缓存分组</span>
            <ElButton size="small" @click="loadGroups">刷新</ElButton>
          </div>
          <ElTable
            v-loading="groupLoading"
            :data="groups"
            border
            highlight-current-row
            @current-change="onGroupSelect"
          >
            <ElTableColumn prop="name" label="缓存名" min-width="160" />
            <ElTableColumn prop="count" label="键数" width="80" />
          </ElTable>
        </ElCard>
      </ElCol>

      <!-- 右：键列表 -->
      <ElCol :xs="24" :lg="16">
        <ElCard class="art-table-card" shadow="never">
          <div class="panel-toolbar">
            <span class="panel-title">
              {{
                selectedGroup
                  ? `${selectedGroup.name} · 键（${keys.length}）`
                  : '键列表（请选择左侧缓存）'
              }}
            </span>
            <ElButton size="small" type="danger" :disabled="!keys.length" @click="clearGroup">
              清空该组
            </ElButton>
          </div>
          <ElTable v-loading="keyLoading" :data="keys" border>
            <ElTableColumn type="index" label="#" width="50" />
            <ElTableColumn label="键" min-width="260">
              <template #default="{ row }">{{ row }}</template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="150">
              <template #default="{ row }">
                <ElButton link type="primary" size="small" @click="viewKey(row)">查看</ElButton>
                <ElButton link type="danger" size="small" @click="removeKey(row)">清除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElDialog v-model="viewVisible" title="缓存详情" width="560px">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="键">{{ detail.key }}</ElDescriptionsItem>
        <ElDescriptionsItem label="类型">{{ detail.type }}</ElDescriptionsItem>
        <ElDescriptionsItem label="TTL(秒)">{{ detail.ttl }}</ElDescriptionsItem>
        <ElDescriptionsItem label="值">
          <pre class="cache-value">{{ detail.value }}</pre>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchCacheGroups, fetchCacheKeys, fetchCacheValue, fetchRemoveCache } from '@/api/cache'

  defineOptions({ name: 'Cache' })

  const groups = ref<any[]>([])
  const groupLoading = ref(false)
  const selectedGroup = ref<any>(null)
  const keys = ref<string[]>([])
  const keyLoading = ref(false)
  const viewVisible = ref(false)
  const detail = reactive<any>({ key: '', type: '', ttl: '', value: '' })

  const loadGroups = async () => {
    groupLoading.value = true
    try {
      groups.value = (await fetchCacheGroups()) || []
    } finally {
      groupLoading.value = false
    }
  }

  const onGroupSelect = (row: any) => {
    if (!row) return
    selectedGroup.value = row
    loadKeys()
  }

  const loadKeys = async () => {
    if (!selectedGroup.value) return
    keyLoading.value = true
    try {
      keys.value = (await fetchCacheKeys(selectedGroup.value.name)) || []
    } finally {
      keyLoading.value = false
    }
  }

  const viewKey = async (key: string) => {
    const info = await fetchCacheValue(key)
    Object.assign(detail, info || {})
    viewVisible.value = true
  }

  const removeKey = (key: string) => {
    ElMessageBox.confirm(`确定清除缓存键「${key}」吗？`, '清除缓存', { type: 'warning' }).then(
      async () => {
        await fetchRemoveCache([key])
        ElMessage.success('已清除')
        loadKeys()
        loadGroups()
      }
    )
  }

  const clearGroup = () => {
    ElMessageBox.confirm(
      `确定清空「${selectedGroup.value.name}」下的全部 ${keys.value.length} 个键吗？`,
      '清空缓存',
      {
        type: 'warning'
      }
    ).then(async () => {
      await fetchRemoveCache([...keys.value])
      ElMessage.success('已清空')
      loadKeys()
      loadGroups()
    })
  }

  onMounted(loadGroups)
</script>

<style lang="scss" scoped>
  .cache-page {
    .panel-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .panel-title {
        font-weight: 500;
      }
    }

    .cache-value {
      max-width: 100%;
      max-height: 200px;
      margin: 0;
      overflow: auto;
      font-size: 12px;
      word-break: break-all;
      white-space: pre-wrap;
    }
  }
</style>
