<!-- 参数管理页面（useCrud 组合式收敛：列表+弹窗+删除+保存一体，见 hooks/core/useCrud） -->
<template>
  <div class="param-page art-full-height">
    <!-- 查询栏：条件实时生效、重置回默认 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleResetSearch"
    />
    <ElCard class="art-table-card">
      <div class="param-toolbar">
        <ElButton v-perm="'sys:param:save'" @click="showDialog('add')" v-ripple>新增参数</ElButton>
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
  import { h, ref } from 'vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useCrud } from '@/hooks/core/useCrud'
  import { fetchParamList, fetchSaveParam, fetchRemoveParam } from '@/api/system-manage'
  import ParamDialog from './modules/param-dialog.vue'
  import { ElButton } from 'element-plus'
  import { hasPerm } from '@/utils/permission'
  import type { ColumnOption } from '@/types/component'

  defineOptions({ name: 'SysParam' })

  // ===== 查询栏 =====
  const searchForm = ref({
    paramName: '',
    paramKey: ''
  })
  const searchItems = computed(() => [
    {
      key: 'paramName',
      label: '参数名称',
      type: 'input',
      props: { placeholder: '请输入参数名称', clearable: true }
    },
    {
      key: 'paramKey',
      label: '参数键',
      type: 'input',
      props: { placeholder: '请输入参数键', clearable: true }
    }
  ])

  const columnsFactory = (): ColumnOption[] => [
    { type: 'index', width: 60, label: '序号' },
    { prop: 'paramName', label: '参数名称', minWidth: 160 },
    { prop: 'paramKey', label: '参数键', minWidth: 180 },
    { prop: 'paramValue', label: '参数值', minWidth: 160, showOverflowTooltip: true },
    { prop: 'remark', label: '备注', minWidth: 160, showOverflowTooltip: true },
    {
      prop: 'operation',
      label: '操作',
      width: 160,
      fixed: 'right',
      // 操作列由 h() 渲染（指令够不到），用 hasPerm() 函数按真实权限码门控
      formatter: (row: any) =>
        h('div', [
          hasPerm('sys:param:save')
            ? h(
                ElButton,
                {
                  link: true,
                  type: 'primary',
                  size: 'small',
                  onClick: () => showDialog('edit', row)
                },
                () => '编辑'
              )
            : null,
          hasPerm('sys:param:remove')
            ? h(
                ElButton,
                { link: true, type: 'danger', size: 'small', onClick: () => handleDelete(row) },
                () => '删除'
              )
            : null
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
    handleSubmit,
    fetchData,
    replaceSearchParams,
    resetSearchParams
  } = useCrud({
    listApi: fetchParamList,
    saveApi: fetchSaveParam,
    removeApi: fetchRemoveParam,
    columnsFactory,
    label: '参数',
    rowName: (row) => row.paramName
  })

  // ===== 查询栏联动 =====
  const handleSearch = async (params: Record<string, any>): Promise<void> => {
    // 替换全部查询参数（防旧条件残留），回到第一页
    replaceSearchParams({ ...params, pageNum: 1, pageSize: 20 })
    await fetchData()
  }

  const handleResetSearch = async (): Promise<void> => {
    searchForm.value = {
      paramName: '',
      paramKey: ''
    }
    resetSearchParams()
    await fetchData()
  }
</script>

<style scoped>
  .param-toolbar {
    margin-bottom: 12px;
  }
</style>
