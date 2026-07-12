<!-- 在线（低代码）运行时表单：元数据驱动渲染，改配置即时生效、不生成代码 -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card">
      <div class="online-toolbar">
        <span class="online-label">表单</span>
        <ElSelect
          v-model="tableId"
          filterable
          placeholder="选择在线表单"
          style="width: 220px"
          @change="onSelect"
        >
          <ElOption
            v-for="f in forms"
            :key="f.id"
            :label="f.functionName || f.tableName"
            :value="f.id"
          />
        </ElSelect>
        <template v-for="col in queryColumns" :key="col.columnName">
          <span class="online-label">{{ col.columnComment || col.javaField }}</span>
          <ElInput
            v-model="query[col.columnName]"
            :placeholder="col.columnComment || col.javaField"
            style="width: 150px"
            clearable
          />
        </template>
        <ElButton v-if="tableId" type="primary" @click="reload">查询</ElButton>
        <ElButton v-if="tableId" @click="openAdd">新增</ElButton>
      </div>

      <ElTable :data="rows" border v-loading="loading" style="margin-top: 12px">
        <ElTableColumn type="index" label="#" width="50" />
        <ElTableColumn
          v-for="col in listColumns"
          :key="col.columnName"
          :prop="col.columnName"
          :label="col.columnComment || col.javaField"
          min-width="140"
        />
        <ElTableColumn v-if="tableId" label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="openEdit(row)">编辑</ElButton>
            <ElButton link type="danger" size="small" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-if="pagination.total > pagination.size" class="online-pager">
        <ElPagination
          background
          layout="prev, pager, next, total"
          :total="pagination.total"
          :page-size="pagination.size"
          :current-page="pagination.current"
          @current-change="onPage"
        />
      </div>

      <ElDialog
        v-model="dialogVisible"
        :title="form.id ? '编辑' : '新增'"
        width="560px"
        align-center
      >
        <ElForm :model="form" label-width="110px">
          <ElFormItem
            v-for="col in formColumns"
            :key="col.columnName"
            :label="col.columnComment || col.javaField"
          >
            <ElInput
              v-if="col.htmlType === 'textarea'"
              v-model="form[col.columnName]"
              type="textarea"
              :rows="3"
            />
            <ElInputNumber
              v-else-if="col.htmlType === 'number'"
              v-model="form[col.columnName]"
              :controls="false"
              style="width: 100%"
            />
            <ElDatePicker
              v-else-if="col.htmlType === 'datetime'"
              v-model="form[col.columnName]"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
            <ElSwitch
              v-else-if="col.htmlType === 'switch'"
              v-model="form[col.columnName]"
              :active-value="1"
              :inactive-value="0"
            />
            <ElSelect
              v-else-if="col.htmlType === 'select'"
              v-model="form[col.columnName]"
              style="width: 100%"
            />
            <ElInput v-else v-model="form[col.columnName]" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="submit">提交</ElButton>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchOnlineForms,
    fetchOnlineMeta,
    fetchOnlineData,
    fetchOnlineDetail,
    fetchOnlineSave,
    fetchOnlineRemove
  } from '@/api/system-manage'

  defineOptions({ name: 'OnlineForm' })

  const forms = ref<any[]>([])
  const tableId = ref<any>(null)
  const columns = ref<any[]>([])
  const rows = ref<any[]>([])
  const loading = ref(false)
  const query = reactive<Record<string, any>>({})
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  const dialogVisible = ref(false)
  const form = ref<Record<string, any>>({})

  const isOne = (v: any): boolean => v === 1
  const queryColumns = computed(() => columns.value.filter((c) => isOne(c.isQuery)))
  const listColumns = computed(() => columns.value.filter((c) => isOne(c.isList)))
  const formColumns = computed(() => columns.value.filter((c) => isOne(c.isEdit)))

  // 切换表单：重取元数据（改配置即时生效、零发布）
  const onSelect = async (): Promise<void> => {
    const meta = await fetchOnlineMeta(tableId.value)
    columns.value = meta?.columns || []
    Object.keys(query).forEach((k) => delete query[k])
    pagination.current = 1
    await load()
  }

  const load = async (): Promise<void> => {
    if (!tableId.value) return
    loading.value = true
    try {
      const res: any = await fetchOnlineData(tableId.value, {
        pageNum: pagination.current,
        pageSize: pagination.size,
        ...query
      })
      rows.value = res?.records || []
      pagination.total = res?.totalRow || 0
    } finally {
      loading.value = false
    }
  }

  const reload = (): void => {
    pagination.current = 1
    load()
  }
  const onPage = (p: number): void => {
    pagination.current = p
    load()
  }

  const openAdd = (): void => {
    form.value = {}
    dialogVisible.value = true
  }

  const openEdit = async (row: any): Promise<void> => {
    const d: any = await fetchOnlineDetail(tableId.value, row.id)
    form.value = { ...d }
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    await fetchOnlineSave(tableId.value, form.value)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    await load()
  }

  const remove = async (row: any): Promise<void> => {
    await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
    await fetchOnlineRemove(tableId.value, [row.id])
    ElMessage.success('删除成功')
    await load()
  }

  onMounted(async () => {
    forms.value = (await fetchOnlineForms()) || []
  })
</script>

<style scoped>
  .online-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .online-label {
    font-size: 13px;
    color: var(--art-text-gray-600);
  }

  .online-pager {
    margin-top: 12px;
    text-align: right;
  }
</style>
