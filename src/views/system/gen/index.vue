<!-- 在线代码生成页面（对接后端 /system/gen） -->
<template>
  <div class="gen-page art-full-height">
    <ElCard class="art-table-card">
      <ElDescriptions title="数据源" :column="4" border size="small" class="gen-ds">
        <ElDescriptionsItem label="名称">{{ datasource.name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="驱动">{{ datasource.driver }}</ElDescriptionsItem>
        <ElDescriptionsItem label="账号">{{ datasource.username }}</ElDescriptionsItem>
        <ElDescriptionsItem label="连接" :span="1">{{ datasource.url }}</ElDescriptionsItem>
      </ElDescriptions>

      <div class="gen-form">
        <span class="gen-label">数据表</span>
        <ElSelect
          v-model="form.tableName"
          filterable
          placeholder="选择表"
          style="width: 240px"
          @change="onTableChange"
        >
          <ElOption v-for="t in tables" :key="t.name" :label="tableLabel(t)" :value="t.name" />
        </ElSelect>
        <span class="gen-label">基础包</span>
        <ElInput v-model="form.basePackage" style="width: 220px" placeholder="com.mugsun.demo" />
        <span class="gen-label">表前缀</span>
        <ElInput v-model="form.tablePrefix" style="width: 120px" placeholder="如 sys_" />
        <ElButton type="primary" :loading="loading" :disabled="!form.tableName" @click="generate">
          生成预览
        </ElButton>
      </div>

      <ElTable v-if="columns.length" :data="columns" border size="small" class="gen-cols">
        <ElTableColumn type="index" label="#" width="50" />
        <ElTableColumn prop="name" label="列名" min-width="140" />
        <ElTableColumn prop="property" label="属性" min-width="140" />
        <ElTableColumn prop="type" label="类型" min-width="120" />
        <ElTableColumn prop="comment" label="注释" min-width="140" show-overflow-tooltip />
      </ElTable>

      <ElTabs v-if="hasCode" v-model="activeTab" class="gen-tabs">
        <ElTabPane v-for="tab in codeTabs" :key="tab.key" :label="tab.label" :name="tab.key">
          <pre class="gen-code">{{ code[tab.key] }}</pre>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import {
    fetchGenDatasource,
    fetchGenTables,
    fetchGenColumns,
    fetchGenPreview
  } from '@/api/system-manage'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'Gen' })

  const datasource = ref<Record<string, any>>({})
  const tables = ref<any[]>([])
  const columns = ref<any[]>([])
  const code = ref<Record<string, string>>({})
  const loading = ref(false)
  const activeTab = ref('entity')

  const form = reactive<Record<string, any>>({
    tableName: '',
    basePackage: 'com.mugsun.demo',
    tablePrefix: ''
  })

  const codeTabs = [
    { key: 'entity', label: 'Entity' },
    { key: 'mapper', label: 'Mapper' },
    { key: 'service', label: 'Service' },
    { key: 'serviceImpl', label: 'ServiceImpl' },
    { key: 'controller', label: 'Controller' },
    { key: 'vue', label: '前端页' }
  ]

  const hasCode = computed(() => Object.keys(code.value).length > 0)

  const tableLabel = (t: any): string => (t.comment ? `${t.name}（${t.comment}）` : t.name)

  const onTableChange = async (name: string): Promise<void> => {
    code.value = {}
    const resp = await fetchGenColumns(name)
    columns.value = resp?.columns ?? []
  }

  const generate = async (): Promise<void> => {
    loading.value = true
    try {
      code.value = (await fetchGenPreview({ ...form })) || {}
      activeTab.value = 'entity'
      ElMessage.success('生成成功')
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    datasource.value = (await fetchGenDatasource()) || {}
    tables.value = (await fetchGenTables()) || []
  })
</script>

<style scoped>
  .gen-ds {
    margin-bottom: 16px;
  }

  .gen-form {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 16px;
  }

  .gen-label {
    font-size: 13px;
    color: var(--art-text-gray-600);
  }

  .gen-cols {
    margin-bottom: 16px;
  }

  .gen-code {
    max-height: 460px;
    padding: 12px;
    margin: 0;
    overflow: auto;
    font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre;
    background: var(--art-main-bg-color);
    border-radius: 6px;
  }
</style>
