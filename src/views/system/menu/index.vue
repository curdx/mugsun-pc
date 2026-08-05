<!-- 菜单管理页面（树形 CRUD） -->
<template>
  <div class="menu-page art-full-height">
    <!-- 查询栏：菜单名称模糊 + 是否隐藏（sys_menu 无 status 字段，状态过滤对应隐藏位） -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleResetSearch"
    />
    <ElCard class="art-table-card">
      <div class="menu-toolbar">
        <ElButton v-perm="'sys:menu:save'" @click="showDialog('add')" v-ripple>新增菜单</ElButton>
      </div>

      <ElTable :data="treeData" row-key="id" default-expand-all border>
        <ElTableColumn prop="menuName" label="菜单名称" min-width="200" />
        <ElTableColumn label="图标" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.icon" class="menu-icon" :data-icon="row.icon">
              <ArtSvgIcon :icon="row.icon" class="text-lg" />
            </span>
            <span v-else>—</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="类型" width="90">
          <template #default="{ row }">{{ TYPE_LABELS[row.menuType] ?? row.menuType }}</template>
        </ElTableColumn>
        <ElTableColumn prop="path" label="路由地址" min-width="160" />
        <ElTableColumn prop="permission" label="权限标识" min-width="160" />
        <ElTableColumn prop="sort" label="排序" width="80" />
        <ElTableColumn label="隐藏" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.isHide === 1 ? 'danger' : 'success'">
              {{ row.isHide === 1 ? '隐藏' : '显示' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="缓存" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.isKeepAlive === 1 ? 'success' : 'info'">
              {{ row.isKeepAlive === 1 ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="外链" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.isExternal === 1 ? 'warning' : 'info'">
              {{ row.isExternal === 1 ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="240">
          <template #default="{ row }">
            <ElButton v-perm="'sys:menu:save'" link type="primary" @click="showDialog('add', row)"
              >新增下级</ElButton
            >
            <ElButton v-perm="'sys:menu:save'" link type="primary" @click="showDialog('edit', row)"
              >编辑</ElButton
            >
            <ElButton v-perm="'sys:menu:remove'" link type="danger" @click="deleteRow(row)"
              >删除</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>

      <MenuDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :menu-data="currentData"
        :menu-tree="treeData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchMenuTree } from '@/api/menu'
  import { fetchSaveMenu, fetchRemoveMenu } from '@/api/system-manage'
  import MenuDialog from './modules/menu-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Menus' })

  const TYPE_LABELS: Record<string, string> = { M: '目录', C: '菜单', F: '按钮' }

  // ===== 查询栏 =====
  const searchForm = ref({
    menuName: '',
    isHide: undefined as number | undefined
  })
  const searchItems = computed(() => [
    {
      key: 'menuName',
      label: '菜单名称',
      type: 'input',
      props: { placeholder: '请输入菜单名称', clearable: true }
    },
    {
      key: 'isHide',
      label: '是否隐藏',
      type: 'select',
      props: {
        placeholder: '请选择',
        clearable: true,
        options: [
          { label: '显示', value: 0 },
          { label: '隐藏', value: 1 }
        ]
      }
    }
  ])

  const treeData = ref<any[]>([])
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

  const loadData = async (): Promise<void> => {
    // 仅携带已填条件（空值不下发，后端按非空拼条件）
    const params: Record<string, any> = {}
    if (searchForm.value.menuName) params.menuName = searchForm.value.menuName
    if (searchForm.value.isHide !== undefined && searchForm.value.isHide !== null) {
      params.isHide = searchForm.value.isHide
    }
    treeData.value = (await fetchMenuTree(params)) || []
  }

  onMounted(loadData)

  const handleSearch = (): void => {
    loadData()
  }

  const handleResetSearch = (): void => {
    searchForm.value = { menuName: '', isHide: undefined }
    loadData()
  }

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = type === 'add' ? { parentId: row?.id ?? 0 } : { ...row }
    dialogVisible.value = true
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除菜单"${row.menuName}"吗？`, '删除菜单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveMenu(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveMenu(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    loadData()
  }
</script>

<style scoped>
  .menu-toolbar {
    margin-bottom: 12px;
  }
</style>
