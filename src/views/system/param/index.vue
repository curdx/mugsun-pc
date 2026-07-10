<!-- 参数管理页面（useCrud 组合式收敛：列表+弹窗+删除+保存一体，见 hooks/core/useCrud） -->
<template>
  <div class="param-page art-full-height">
    <ElCard class="art-table-card">
      <div class="param-toolbar">
        <ElButton @click="showDialog('add')" v-ripple>新增参数</ElButton>
      </div>

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        border
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />

      <ParamDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :param-data="currentRow"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { useCrud } from '@/hooks/core/useCrud'
  import { fetchParamList, fetchSaveParam, fetchRemoveParam } from '@/api/system-manage'
  import ParamDialog from './modules/param-dialog.vue'
  import { ElButton } from 'element-plus'
  import type { ColumnOption } from '@/types/component'

  defineOptions({ name: 'SysParam' })

  const columnsFactory = (): ColumnOption[] => [
    { type: 'index', width: 60, label: '序号' },
    { prop: 'paramName', label: '参数名称', minWidth: 160 },
    { prop: 'paramKey', label: '参数键', minWidth: 180 },
    { prop: 'paramValue', label: '参数值', minWidth: 160 },
    { prop: 'remark', label: '备注', minWidth: 160 },
    {
      prop: 'operation',
      label: '操作',
      width: 160,
      fixed: 'right',
      formatter: (row: any) =>
        h('div', [
          h(
            ElButton,
            { link: true, type: 'primary', size: 'small', onClick: () => showDialog('edit', row) },
            () => '编辑'
          ),
          h(
            ElButton,
            { link: true, type: 'danger', size: 'small', onClick: () => handleDelete(row) },
            () => '删除'
          )
        ])
    }
  ]

  // 列表+弹窗+删除+保存 全由 useCrud 收敛（删后页码自动回退复用 useTable.refreshRemove）
  const {
    columns,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    dialogVisible,
    dialogType,
    currentRow,
    showDialog,
    handleDelete,
    handleSubmit
  } = useCrud({
    listApi: fetchParamList,
    saveApi: fetchSaveParam,
    removeApi: fetchRemoveParam,
    columnsFactory,
    label: '参数',
    rowName: (row) => row.paramName
  })
</script>

<style scoped>
  .param-toolbar {
    margin-bottom: 12px;
  }
</style>
