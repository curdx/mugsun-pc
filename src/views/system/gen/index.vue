<!-- 在线代码生成（元数据驱动·对齐平台规约全栈产物） -->
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
          v-model="importForm.tableName"
          filterable
          placeholder="选择库表"
          style="width: 220px"
        >
          <ElOption v-for="t in tables" :key="t.name" :label="tableLabel(t)" :value="t.name" />
        </ElSelect>
        <span class="gen-label">模块</span>
        <ElInput v-model="importForm.moduleName" style="width: 110px" placeholder="如 system" />
        <span class="gen-label">基础包</span>
        <ElInput
          v-model="importForm.basePackage"
          style="width: 180px"
          placeholder="com.mugsun.boot"
        />
        <span class="gen-label">前缀</span>
        <ElInput v-model="importForm.tablePrefix" style="width: 90px" placeholder="如 sys_" />
        <span class="gen-label">作者</span>
        <ElInput v-model="importForm.author" style="width: 100px" placeholder="mugsun" />
        <ElButton
          type="primary"
          :loading="importing"
          :disabled="!importForm.tableName"
          @click="onImport"
        >
          导入
        </ElButton>
      </div>

      <ElTable :data="genList" border size="small" class="gen-list">
        <ElTableColumn type="index" label="#" width="50" />
        <ElTableColumn prop="tableName" label="表名" min-width="150" />
        <ElTableColumn prop="entityName" label="实体" min-width="120" />
        <ElTableColumn prop="moduleName" label="模块" min-width="90" />
        <ElTableColumn prop="functionName" label="功能" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="openConfig(row)">配置</ElButton>
            <ElButton link type="primary" size="small" @click="openPreview(row)">预览</ElButton>
            <ElButton link type="warning" size="small" @click="doSync(row)">同步</ElButton>
            <ElButton link type="success" size="small" @click="doDownload(row)">下载</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 字段级配置 -->
    <ElDialog v-model="configVisible" title="字段配置" width="920px" align-center>
      <ElTable :data="configColumns" border size="small" max-height="460">
        <ElTableColumn prop="javaField" label="字段" min-width="120" />
        <ElTableColumn prop="javaType" label="类型" min-width="90" />
        <ElTableColumn label="注释" min-width="130">
          <template #default="{ row }">
            <ElInput v-model="row.columnComment" size="small" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="控件" width="130">
          <template #default="{ row }">
            <ElSelect v-model="row.htmlType" size="small">
              <ElOption v-for="h in htmlTypes" :key="h" :label="h" :value="h" />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="字典" width="120">
          <template #default="{ row }">
            <ElInput v-model="row.dictType" size="small" placeholder="字典码" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="列表" width="60" align="center">
          <template #default="{ row }">
            <ElSwitch v-model="row.isList" :active-value="1" :inactive-value="0" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="表单" width="60" align="center">
          <template #default="{ row }">
            <ElSwitch v-model="row.isEdit" :active-value="1" :inactive-value="0" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="查询" width="60" align="center">
          <template #default="{ row }">
            <ElSwitch v-model="row.isQuery" :active-value="1" :inactive-value="0" />
          </template>
        </ElTableColumn>
      </ElTable>
      <template #footer>
        <ElButton @click="configVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveConfig">保存配置</ElButton>
      </template>
    </ElDialog>

    <!-- 代码预览 -->
    <ElDialog v-model="previewVisible" title="代码预览" width="1000px" align-center>
      <ElTabs v-model="activeTab">
        <ElTabPane v-for="tab in codeTabs" :key="tab.key" :label="tab.label" :name="tab.key">
          <pre class="gen-code">{{ code[tab.key] }}</pre>
        </ElTabPane>
      </ElTabs>
      <template #footer>
        <ElButton @click="previewVisible = false">关闭</ElButton>
        <ElButton type="success" @click="doDownload(previewRow)">下载 zip</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import {
    fetchGenDatasource,
    fetchGenTables,
    fetchGenImport,
    fetchGenList,
    fetchGenMeta,
    fetchSaveGenMeta,
    fetchGenSync,
    fetchGenPreviewMeta,
    downloadGenZip
  } from '@/api/system-manage'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'Gen' })

  const datasource = ref<Record<string, any>>({})
  const tables = ref<any[]>([])
  const genList = ref<any[]>([])
  const importing = ref(false)

  const importForm = reactive({
    tableName: '',
    moduleName: 'system',
    basePackage: 'com.mugsun.boot',
    tablePrefix: '',
    author: 'mugsun'
  })

  const htmlTypes = ['input', 'textarea', 'select', 'number', 'datetime', 'switch']
  const codeTabs = [
    { key: 'entity', label: 'Entity' },
    { key: 'mapper', label: 'Mapper' },
    { key: 'controller', label: 'Controller' },
    { key: 'vue', label: '列表页' },
    { key: 'api', label: 'api.ts' },
    { key: 'type', label: 'type.ts' },
    { key: 'menu', label: '菜单SQL' }
  ]

  // 字段配置
  const configVisible = ref(false)
  const configTable = ref<any>(null)
  const configColumns = ref<any[]>([])
  // 预览
  const previewVisible = ref(false)
  const previewRow = ref<any>(null)
  const code = ref<Record<string, string>>({})
  const activeTab = ref('entity')

  const tableLabel = (t: any): string => (t.comment ? `${t.name}（${t.comment}）` : t.name)

  const loadList = async (): Promise<void> => {
    genList.value = (await fetchGenList()) || []
  }

  const onImport = async (): Promise<void> => {
    importing.value = true
    try {
      await fetchGenImport({ ...importForm })
      ElMessage.success('导入成功')
      await loadList()
    } finally {
      importing.value = false
    }
  }

  const openConfig = async (row: any): Promise<void> => {
    const meta = await fetchGenMeta(row.id)
    configTable.value = meta?.table ?? null
    configColumns.value = meta?.columns ?? []
    configVisible.value = true
  }

  const saveConfig = async (): Promise<void> => {
    await fetchSaveGenMeta({ table: configTable.value, columns: configColumns.value })
    ElMessage.success('配置已保存')
    configVisible.value = false
  }

  const doSync = async (row: any): Promise<void> => {
    await fetchGenSync(row.id)
    ElMessage.success('同步成功')
  }

  const openPreview = async (row: any): Promise<void> => {
    previewRow.value = row
    code.value = (await fetchGenPreviewMeta(row.id)) || {}
    activeTab.value = 'entity'
    previewVisible.value = true
  }

  const doDownload = async (row: any): Promise<void> => {
    if (row) await downloadGenZip(row.id)
  }

  onMounted(async () => {
    datasource.value = (await fetchGenDatasource()) || {}
    tables.value = (await fetchGenTables()) || []
    await loadList()
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

  .gen-list {
    margin-bottom: 8px;
  }

  .gen-code {
    max-height: 480px;
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
