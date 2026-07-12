<!-- 动态建表 / AI 辅助建模：元数据 → 物理表 DDL，自然语言候选 → 人工确认 → 建表 -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card">
      <ElTabs v-model="activeTab">
        <ElTabPane label="AI 辅助建模" name="ai">
          <ElInput
            v-model="nl"
            type="textarea"
            :rows="3"
            placeholder="用一句话描述（英文表名/字段名 + 中文含义 + 类型）。例：product_comment 商品评论；content 评论内容 文本，score 评分 整数，author 作者 文本，comment_time 评论时间 日期"
          />
          <div class="modeling-actions">
            <ElButton type="primary" :loading="drafting" @click="genDraft">生成候选</ElButton>
            <span class="modeling-tip">候选仅供人工确认修改，确认后才建表——绝不自动落库</span>
          </div>

          <div v-if="candidate" class="candidate-box">
            <ElForm inline>
              <ElFormItem label="表名">
                <ElInput v-model="candidate.table.tableName" style="width: 200px" />
              </ElFormItem>
              <ElFormItem label="表说明">
                <ElInput v-model="candidate.table.tableComment" style="width: 220px" />
              </ElFormItem>
            </ElForm>
            <ElTable :data="candidate.columns" border size="small">
              <ElTableColumn type="index" label="#" width="46" />
              <ElTableColumn label="列名" min-width="150">
                <template #default="{ row }">
                  <ElInput v-model="row.columnName" size="small" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="说明" min-width="150">
                <template #default="{ row }">
                  <ElInput v-model="row.columnComment" size="small" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="类型" width="160">
                <template #default="{ row }">
                  <ElSelect v-model="row.javaType" size="small">
                    <ElOption v-for="t in javaTypes" :key="t" :label="t" :value="t" />
                  </ElSelect>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="70">
                <template #default="{ $index }">
                  <ElButton
                    link
                    type="danger"
                    size="small"
                    @click="candidate.columns.splice($index, 1)"
                    >删</ElButton
                  >
                </template>
              </ElTableColumn>
            </ElTable>
            <div class="modeling-actions">
              <ElButton @click="addCol">加字段</ElButton>
              <ElButton type="success" @click="confirmBuild(true)">确认并建表</ElButton>
              <ElButton @click="confirmBuild(false)">仅保存配置</ElButton>
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="动态表管理" name="manage">
          <ElButton @click="loadTables">刷新</ElButton>
          <ElTable :data="tables" border v-loading="loading" style="margin-top: 10px">
            <ElTableColumn type="index" label="#" width="50" />
            <ElTableColumn prop="tableName" label="表名" min-width="170" />
            <ElTableColumn prop="functionName" label="功能" min-width="140" />
            <ElTableColumn label="操作" width="400" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" size="small" @click="openColumns(row)"
                  >字段配置</ElButton
                >
                <ElButton link type="info" size="small" @click="preview(row)">预览DDL</ElButton>
                <ElButton link type="success" size="small" @click="doCreate(row)">建表</ElButton>
                <ElButton link type="warning" size="small" @click="doSync(row, false)"
                  >增量同步</ElButton
                >
                <ElButton link type="danger" size="small" @click="doSync(row, true)"
                  >强制重建</ElButton
                >
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>
      </ElTabs>

      <ElDialog v-model="ddlVisible" title="DDL 预览（不执行）" width="660px" align-center>
        <pre class="ddl-pre">{{ ddlText }}</pre>
      </ElDialog>

      <ElDialog
        v-model="colVisible"
        :title="`字段配置 - ${editing?.table?.tableName || ''}`"
        width="760px"
        align-center
      >
        <div class="modeling-tip"
          >改列名即走 RENAME（保数据），加字段即走 ADD；保存后点“同步到物理表”生效。</div
        >
        <ElTable :data="editing?.columns || []" border size="small" style="margin-top: 10px">
          <ElTableColumn type="index" label="#" width="46" />
          <ElTableColumn label="列名" min-width="160">
            <template #default="{ row }">
              <ElInput v-model="row.columnName" size="small" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="说明" min-width="150">
            <template #default="{ row }">
              <ElInput v-model="row.columnComment" size="small" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="类型" width="150">
            <template #default="{ row }">
              <ElSelect v-model="row.javaType" size="small">
                <ElOption v-for="t in javaTypes" :key="t" :label="t" :value="t" />
              </ElSelect>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="70">
            <template #default="{ $index }">
              <ElButton link type="danger" size="small" @click="editing.columns.splice($index, 1)"
                >删</ElButton
              >
            </template>
          </ElTableColumn>
        </ElTable>
        <template #footer>
          <ElButton @click="addEditCol">加字段</ElButton>
          <ElButton type="primary" @click="saveColumns(false)">保存配置</ElButton>
          <ElButton type="warning" @click="saveColumns(true)">保存并同步到物理表</ElButton>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchGenList,
    fetchGenMeta,
    fetchSaveGenMeta,
    fetchDdlPreview,
    fetchDdlCreate,
    fetchDdlSync,
    fetchAiDraft,
    fetchAiConfirm
  } from '@/api/system-manage'

  defineOptions({ name: 'GenModeling' })

  const javaTypes = [
    'String',
    'Integer',
    'Long',
    'BigDecimal',
    'Double',
    'LocalDateTime',
    'LocalDate'
  ]
  const activeTab = ref('ai')
  const nl = ref('')
  const drafting = ref(false)
  const candidate = ref<any>(null)
  const tables = ref<any[]>([])
  const loading = ref(false)
  const ddlVisible = ref(false)
  const ddlText = ref('')
  const colVisible = ref(false)
  const editing = ref<any>(null)

  const genDraft = async (): Promise<void> => {
    drafting.value = true
    try {
      candidate.value = await fetchAiDraft(nl.value)
    } finally {
      drafting.value = false
    }
  }

  const addCol = (): void => {
    candidate.value.columns.push({
      columnName: '',
      columnComment: '',
      javaType: 'String',
      htmlType: 'input',
      isPk: 0,
      isInsert: 1,
      isEdit: 1,
      isList: 1,
      isQuery: 0,
      queryType: 'LIKE'
    })
  }

  const confirmBuild = async (build: boolean): Promise<void> => {
    await fetchAiConfirm({ table: candidate.value.table, columns: candidate.value.columns, build })
    ElMessage.success(build ? '已确认并建表' : '已保存配置')
    candidate.value = null
    nl.value = ''
    activeTab.value = 'manage'
    loadTables()
  }

  const loadTables = async (): Promise<void> => {
    loading.value = true
    try {
      tables.value = (await fetchGenList()) || []
    } finally {
      loading.value = false
    }
  }

  const preview = async (row: any): Promise<void> => {
    const stmts = (await fetchDdlPreview(row.id, false)) || []
    ddlText.value = stmts.length ? stmts.join(';\n\n') + ';' : '（无结构变更）'
    ddlVisible.value = true
  }

  const doCreate = async (row: any): Promise<void> => {
    await ElMessageBox.confirm(`确认按配置建物理表 ${row.tableName}？`, '建表', { type: 'warning' })
    await fetchDdlCreate(row.id)
    ElMessage.success('建表成功')
  }

  const doSync = async (row: any, force: boolean): Promise<void> => {
    await ElMessageBox.confirm(
      force
        ? `强制重建将 DROP 并重建 ${row.tableName}，数据全部丢失！`
        : `增量同步 ${row.tableName}（新增走 ADD、改名走 RENAME，保数据）？`,
      force ? '强制重建' : '增量同步',
      { type: force ? 'error' : 'warning' }
    )
    await fetchDdlSync(row.id, force)
    ElMessage.success(force ? '重建成功' : '同步成功')
  }

  // 打开字段配置：拉元数据并快照原列名，用于改名追踪
  const openColumns = async (row: any): Promise<void> => {
    const meta: any = await fetchGenMeta(row.id)
    ;(meta.columns || []).forEach((c: any) => (c._origName = c.columnName))
    editing.value = meta
    colVisible.value = true
  }

  const addEditCol = (): void => {
    editing.value.columns.push({
      columnName: '',
      columnComment: '',
      javaType: 'String',
      htmlType: 'input',
      isPk: 0,
      isInsert: 1,
      isEdit: 1,
      isList: 1,
      isQuery: 0,
      queryType: 'LIKE'
    })
  }

  const saveColumns = async (sync: boolean): Promise<void> => {
    const table = editing.value.table
    const columns = editing.value.columns.map((c: any) => {
      const { _origName, ...rest } = c
      // 已有列改了名 → 记录旧名，同步时走 RENAME
      if (rest.id && _origName && _origName !== rest.columnName) {
        rest.columnNameOld = _origName
      }
      return rest
    })
    await fetchSaveGenMeta({ table, columns })
    if (sync) {
      await fetchDdlSync(table.id, false)
      ElMessage.success('已保存并同步到物理表')
    } else {
      ElMessage.success('配置已保存')
    }
    colVisible.value = false
  }

  onMounted(loadTables)
</script>

<style scoped>
  .modeling-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 12px;
  }

  .modeling-tip {
    font-size: 12px;
    color: var(--art-text-gray-500);
  }

  .candidate-box {
    margin-top: 16px;
  }

  .ddl-pre {
    max-height: 420px;
    padding: 12px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
    word-break: break-all;
    white-space: pre-wrap;
    background: var(--art-gray-100);
    border-radius: 6px;
  }
</style>
