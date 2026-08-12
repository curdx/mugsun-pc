<!-- 部门管理页面（树形 CRUD） -->
<template>
  <div class="dept-page art-full-height">
    <!-- 查询栏：按名称过滤（命中节点及其祖先保留），重置回全树 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleResetSearch"
    />
    <ElCard class="art-table-card">
      <div class="dept-toolbar">
        <ElButton v-perm="'sys:dept:save'" @click="showDialog('add')" v-ripple>新增部门</ElButton>
      </div>

      <!-- 树表为自由增长内容：art-table-card 卡片体是 height:100%+overflow:hidden 裁剪，
           内部须自备滚动，否则矮视口下深层节点被切断且不可达（同 track/user 修法） -->
      <div v-loading="loading" class="dept-table-wrap">
        <ElTable :data="treeData" row-key="id" default-expand-all border>
          <ElTableColumn prop="deptName" label="部门名称" min-width="220" />
          <ElTableColumn prop="sort" label="排序" width="100" />
          <ElTableColumn prop="createTime" label="创建时间" min-width="180">
            <template #default="{ row }">{{ formatTableTime(row.createTime) }}</template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="240">
            <template #default="{ row }">
              <ElButton v-perm="'sys:dept:save'" link type="primary" @click="showDialog('add', row)"
                >新增下级</ElButton
              >
              <ElButton
                v-perm="'sys:dept:save'"
                link
                type="primary"
                @click="showDialog('edit', row)"
                >编辑</ElButton
              >
              <ElButton v-perm="'sys:dept:remove'" link type="danger" @click="deleteRow(row)"
                >删除</ElButton
              >
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <DeptDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :dept-data="currentData"
        :dept-options="deptOptions"
        :saving="dialogSaving"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import {
    fetchDeptTree,
    fetchDeptSelect,
    fetchSaveDept,
    fetchRemoveDept
  } from '@/api/system-manage'
  import DeptDialog from './modules/dept-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'
  import { formatTableTime } from '@/utils/date'

  defineOptions({ name: 'Dept' })

  // ===== 查询栏 =====
  const searchForm = ref({
    deptName: ''
  })
  const searchItems = computed(() => [
    {
      key: 'deptName',
      label: '部门名称',
      type: 'input',
      props: { placeholder: '请输入部门名称', clearable: true }
    }
  ])

  const treeData = ref<any[]>([])
  const deptOptions = ref<Array<{ label: string; value: string }>>([])
  const loading = ref(false)
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})
  const dialogSaving = ref(false)

  // 查询条件以 searchForm 为唯一事实源（v-model 已同步），CRUD 刷新后过滤仍生效
  const currentParams = (): Record<string, any> | undefined =>
    searchForm.value.deptName ? { deptName: searchForm.value.deptName } : undefined

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      treeData.value = (await fetchDeptTree(currentParams())) || []
      deptOptions.value = (await fetchDeptSelect()) || []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  // ===== 查询栏联动 =====
  const handleSearch = async (): Promise<void> => {
    // 后端过滤命中节点及其祖先后重新建树
    await loadData()
  }

  const handleResetSearch = async (): Promise<void> => {
    searchForm.value = {
      deptName: ''
    }
    await loadData()
  }

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = type === 'add' ? { parentId: row?.id ?? 0 } : { ...row }
    dialogVisible.value = true
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm('确定要删除该部门吗？', '删除部门', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveDept(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    dialogSaving.value = true
    try {
      await fetchSaveDept(form)
      dialogVisible.value = false
      ElMessage.success('保存成功')
      loadData()
    } finally {
      dialogSaving.value = false
    }
  }
</script>

<style scoped>
  /* 卡片体改为纵向 flex，树表滚动区占满剩余高度（滚动区见模板注释） */
  .dept-page :deep(.art-table-card > .el-card__body) {
    display: flex;
    flex-direction: column;
  }

  .dept-toolbar {
    flex-shrink: 0;
    margin-bottom: 12px;
  }

  .dept-table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
</style>
