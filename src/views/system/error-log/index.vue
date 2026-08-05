<!-- 错误日志：全局未捕获异常流水，栈顶四元组定位 + 认领处理闭环（已处理/已忽略） -->
<template>
  <div class="error-log-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElRadioGroup v-model="statusFilter" size="small" @change="onStatusFilterChange">
            <ElRadioButton :value="undefined">全部</ElRadioButton>
            <ElRadioButton :value="0">未处理</ElRadioButton>
            <ElRadioButton :value="1">已处理</ElRadioButton>
            <ElRadioButton :value="2">已忽略</ElRadioButton>
          </ElRadioGroup>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <ElDialog v-model="detailVisible" title="错误日志详情" width="720px" align-center>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="链路号">{{ current.traceId }}</ElDescriptionsItem>
          <ElDescriptionsItem label="异常类">{{ current.exceptionClass }}</ElDescriptionsItem>
          <ElDescriptionsItem label="消息">{{ current.message }}</ElDescriptionsItem>
          <ElDescriptionsItem label="请求">
            {{ current.requestMethod }} {{ current.requestUri }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作人">{{ current.operator || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="定位">
            {{ current.locationClass }}.{{ current.locationMethod }}({{ current.locationFile }}:{{
              current.locationLine
            }})
          </ElDescriptionsItem>
          <ElDescriptionsItem label="堆栈">
            <div class="error-log-stack">{{ current.stacktrace }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="current.handleUser" label="处理">
            {{ current.handleUser }}（{{ current.handleTime }}）：{{ current.handleNote || '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElDialog>

      <ElDialog v-model="handleVisible" title="认领处理" width="480px" align-center>
        <ElForm label-width="80px">
          <ElFormItem label="处理状态">
            <ElRadioGroup v-model="handleForm.status">
              <ElRadio :value="1">已处理</ElRadio>
              <ElRadio :value="2">已忽略</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="处理备注">
            <ElInput
              v-model="handleForm.note"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="修复说明 / 忽略原因"
            />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="handleVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="handleLoading" @click="submitHandle">确定</ElButton>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, reactive, ref } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtDictTag from '@/components/core/base/art-dict-tag/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchErrorLogPage, fetchHandleErrorLog, fetchRemoveErrorLog } from '@/api/system-manage'
  import { hasPerm } from '@/utils/permission'
  import { DICT_CODE } from '@/utils/constants'
  import { ElMessage, ElMessageBox, ElRadio, ElRadioButton, ElRadioGroup } from 'element-plus'

  defineOptions({ name: 'ErrorLog' })

  const detailVisible = ref(false)
  const current = ref<Record<string, any>>({})
  const statusFilter = ref<number | undefined>(undefined)

  const handleVisible = ref(false)
  const handleLoading = ref(false)
  const handleForm = reactive({ id: '' as string | number, status: 1, note: '' })

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    refreshUpdate,
    refreshRemove
  } = useTable({
    core: {
      apiFn: fetchErrorLogPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'exceptionClass',
          label: '异常',
          minWidth: 180,
          showOverflowTooltip: true,
          formatter: (row: any) => shortClass(row.exceptionClass)
        },
        { prop: 'requestUri', label: '请求地址', minWidth: 180, showOverflowTooltip: true },
        { prop: 'message', label: '消息', minWidth: 200, showOverflowTooltip: true },
        { prop: 'operator', label: '操作人', width: 100 },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          // 字典运行时驱动：改用 ArtDictTag，不再手写 STATUS_META
          formatter: (row: any) =>
            h(ArtDictTag, { code: DICT_CODE.ERROR_LOG_STATUS, value: row.status })
        },
        { prop: 'createTime', label: '时间', minWidth: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 190,
          fixed: 'right',
          formatter: (row: any) =>
            h('div', [
              h(ArtButtonTable, { type: 'view', onClick: () => showDetail(row) }),
              hasPerm('sys:error-log:handle') && row.status === 0
                ? h(ArtButtonTable, { type: 'edit', onClick: () => showHandle(row) })
                : null,
              hasPerm('sys:error-log:remove')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => removeRow(row) })
                : null
            ])
        }
      ]
    },
    transform: {
      responseAdapter: (resp: any) => ({
        records: resp?.records ?? [],
        total: resp?.totalRow ?? 0,
        current: resp?.pageNumber ?? 1,
        size: resp?.pageSize ?? 20
      })
    }
  })

  const shortClass = (cls: string): string => (cls ? cls.substring(cls.lastIndexOf('.') + 1) : '-')

  const onStatusFilterChange = (): void => {
    const params = searchParams as Record<string, unknown>
    if (statusFilter.value === undefined) {
      delete params.status
    } else {
      params.status = statusFilter.value
    }
    refreshData()
  }

  const showDetail = (row: Record<string, any>): void => {
    current.value = row
    detailVisible.value = true
  }

  const showHandle = (row: Record<string, any>): void => {
    handleForm.id = row.id
    handleForm.status = 1
    handleForm.note = ''
    handleVisible.value = true
  }

  const submitHandle = async (): Promise<void> => {
    handleLoading.value = true
    try {
      await fetchHandleErrorLog({
        id: handleForm.id,
        status: handleForm.status,
        note: handleForm.note
      })
      ElMessage.success('已处理')
      handleVisible.value = false
      refreshUpdate()
    } finally {
      handleLoading.value = false
    }
  }

  const removeRow = (row: Record<string, any>): void => {
    ElMessageBox.confirm('确定删除该错误日志吗？', '删除确认', { type: 'warning' }).then(
      async () => {
        await fetchRemoveErrorLog(row.id)
        ElMessage.success('已删除')
        refreshRemove()
      }
    )
  }
</script>

<style scoped>
  .error-log-stack {
    max-height: 240px;
    overflow: auto;
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>
