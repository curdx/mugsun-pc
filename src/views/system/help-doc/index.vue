<!-- 帮助文档管理：目录树 + 文档(富文本) + 页面绑定 -->
<template>
  <div class="help-doc-page art-full-height">
    <ElRow :gutter="12">
      <!-- 左：目录树 -->
      <ElCol :span="8">
        <ElCard class="art-table-card" shadow="never">
          <div class="panel-toolbar">
            <span class="panel-title">帮助目录</span>
            <ElButton size="small" @click="showCatalogDialog('add')">新增目录</ElButton>
          </div>
          <ElTable
            :data="catalogTree"
            row-key="id"
            default-expand-all
            border
            highlight-current-row
            @current-change="onCatalogSelect"
          >
            <ElTableColumn prop="name" label="目录名称" min-width="150" />
            <ElTableColumn prop="sort" label="排序" width="70" />
            <ElTableColumn label="操作" width="170">
              <template #default="{ row }">
                <ElButton
                  link
                  type="primary"
                  size="small"
                  @click.stop="showCatalogDialog('add', row)"
                >
                  下级
                </ElButton>
                <ElButton
                  link
                  type="primary"
                  size="small"
                  @click.stop="showCatalogDialog('edit', row)"
                >
                  编辑
                </ElButton>
                <ElButton link type="danger" size="small" @click.stop="removeCatalog(row)">
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElCol>

      <!-- 右：文档 -->
      <ElCol :span="16">
        <ElCard class="art-table-card" shadow="never">
          <div class="panel-toolbar">
            <span class="panel-title">
              {{ selectedCatalog ? `${selectedCatalog.name} · 文档` : '文档（请先选择左侧目录）' }}
            </span>
            <ElButton
              size="small"
              type="primary"
              :disabled="!selectedCatalog"
              @click="showDocDialog('add')"
            >
              新增文档
            </ElButton>
          </div>
          <ElTable v-loading="docLoading" :data="docList" border>
            <ElTableColumn prop="title" label="标题" min-width="200" />
            <ElTableColumn prop="viewCount" label="浏览量" width="90" />
            <ElTableColumn prop="sort" label="排序" width="70" />
            <ElTableColumn label="操作" width="210">
              <template #default="{ row }">
                <ElButton link type="primary" size="small" @click="showDocDialog('edit', row)"
                  >编辑</ElButton
                >
                <ElButton link type="primary" size="small" @click="showBindingDialog(row)"
                  >绑定页面</ElButton
                >
                <ElButton link type="danger" size="small" @click="removeDoc(row)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 目录弹窗 -->
    <ElDialog
      v-model="catalogDialog"
      :title="catalogForm.id ? '编辑目录' : '新增目录'"
      width="460px"
    >
      <ElForm :model="catalogForm" label-width="90px">
        <ElFormItem label="目录名称" required>
          <ElInput v-model="catalogForm.name" placeholder="请输入目录名称" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="catalogForm.sort" :min="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="catalogDialog = false">取消</ElButton>
        <ElButton type="primary" @click="submitCatalog">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 文档弹窗 -->
    <ElDialog
      v-model="docDialog"
      :title="docForm.id ? '编辑文档' : '新增文档'"
      width="780px"
      top="6vh"
    >
      <ElForm :model="docForm" label-width="70px">
        <ElFormItem label="标题" required>
          <ElInput v-model="docForm.title" placeholder="请输入文档标题" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="docForm.sort" :min="0" />
        </ElFormItem>
        <ElFormItem label="内容">
          <ArtWangEditor v-model="docForm.content" height="320px" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="docDialog = false">取消</ElButton>
        <ElButton type="primary" @click="submitDoc">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 绑定弹窗 -->
    <ElDialog v-model="bindingDialog" title="绑定页面" width="560px">
      <div class="binding-add">
        <ElInput
          v-model="newRoutePath"
          placeholder="页面路由，如 /system/user"
          style="width: 74%"
        />
        <ElButton type="primary" @click="addBinding">添加绑定</ElButton>
      </div>
      <ElTable :data="bindingList" border style="margin-top: 12px">
        <ElTableColumn prop="routePath" label="页面路由" />
        <ElTableColumn label="操作" width="90">
          <template #default="{ row }">
            <ElButton link type="danger" size="small" @click="removeBinding(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import {
    fetchHelpCatalogTree,
    fetchSaveHelpCatalog,
    fetchRemoveHelpCatalog,
    fetchHelpDocPage,
    fetchHelpDocDetail,
    fetchSaveHelpDoc,
    fetchRemoveHelpDoc,
    fetchHelpBindingList,
    fetchSaveHelpBinding,
    fetchRemoveHelpBinding
  } from '@/api/help-doc'

  defineOptions({ name: 'HelpDoc' })

  // ---------------- 目录 ----------------
  const catalogTree = ref<any[]>([])
  const selectedCatalog = ref<any>(null)

  const loadCatalogTree = async () => {
    catalogTree.value = (await fetchHelpCatalogTree()) || []
  }

  const onCatalogSelect = (row: any) => {
    if (!row) return
    selectedCatalog.value = row
    loadDocs()
  }

  const catalogDialog = ref(false)
  const catalogForm = reactive<any>({ id: undefined, parentId: 0, name: '', sort: 0 })

  const showCatalogDialog = (type: 'add' | 'edit', row?: any) => {
    if (type === 'add') {
      Object.assign(catalogForm, { id: undefined, parentId: row?.id ?? 0, name: '', sort: 0 })
    } else {
      Object.assign(catalogForm, {
        id: row.id,
        parentId: row.parentId,
        name: row.name,
        sort: row.sort
      })
    }
    catalogDialog.value = true
  }

  const submitCatalog = async () => {
    if (!catalogForm.name?.trim()) return ElMessage.warning('请输入目录名称')
    await fetchSaveHelpCatalog({ ...catalogForm })
    ElMessage.success('保存成功')
    catalogDialog.value = false
    loadCatalogTree()
  }

  const removeCatalog = (row: any) => {
    ElMessageBox.confirm(`确定删除目录「${row.name}」吗？`, '删除', { type: 'warning' }).then(
      async () => {
        await fetchRemoveHelpCatalog(row.id)
        ElMessage.success('删除成功')
        if (selectedCatalog.value?.id === row.id) {
          selectedCatalog.value = null
          docList.value = []
        }
        loadCatalogTree()
      }
    )
  }

  // ---------------- 文档 ----------------
  const docList = ref<any[]>([])
  const docLoading = ref(false)

  const loadDocs = async () => {
    if (!selectedCatalog.value) return
    docLoading.value = true
    try {
      const page = await fetchHelpDocPage({
        catalogId: selectedCatalog.value.id,
        pageNum: 1,
        pageSize: 100
      })
      docList.value = page?.records || []
    } finally {
      docLoading.value = false
    }
  }

  const docDialog = ref(false)
  const docForm = reactive<any>({
    id: undefined,
    catalogId: undefined,
    title: '',
    content: '',
    sort: 0
  })

  const showDocDialog = async (type: 'add' | 'edit', row?: any) => {
    if (type === 'add') {
      Object.assign(docForm, {
        id: undefined,
        catalogId: selectedCatalog.value.id,
        title: '',
        content: '',
        sort: 0
      })
    } else {
      // 列表不含 content，编辑需拉详情
      const detail = await fetchHelpDocDetail(row.id)
      Object.assign(docForm, {
        id: detail.id,
        catalogId: detail.catalogId,
        title: detail.title,
        content: detail.content || '',
        sort: detail.sort
      })
    }
    docDialog.value = true
  }

  const submitDoc = async () => {
    if (!docForm.title?.trim()) return ElMessage.warning('请输入文档标题')
    await fetchSaveHelpDoc({ ...docForm })
    ElMessage.success('保存成功')
    docDialog.value = false
    loadDocs()
  }

  const removeDoc = (row: any) => {
    ElMessageBox.confirm(`确定删除文档「${row.title}」吗？`, '删除', { type: 'warning' }).then(
      async () => {
        await fetchRemoveHelpDoc([row.id])
        ElMessage.success('删除成功')
        loadDocs()
      }
    )
  }

  // ---------------- 页面绑定 ----------------
  const bindingDialog = ref(false)
  const bindingDocId = ref<any>(null)
  const bindingList = ref<any[]>([])
  const newRoutePath = ref('')

  const loadBindings = async () => {
    bindingList.value = (await fetchHelpBindingList(bindingDocId.value)) || []
  }

  const showBindingDialog = async (row: any) => {
    bindingDocId.value = row.id
    newRoutePath.value = ''
    await loadBindings()
    bindingDialog.value = true
  }

  const addBinding = async () => {
    const path = newRoutePath.value.trim()
    if (!path) return ElMessage.warning('请输入页面路由')
    await fetchSaveHelpBinding({ docId: bindingDocId.value, routePath: path, sort: 0 })
    ElMessage.success('绑定成功')
    newRoutePath.value = ''
    loadBindings()
  }

  const removeBinding = async (row: any) => {
    await fetchRemoveHelpBinding(row.id)
    ElMessage.success('已解除绑定')
    loadBindings()
  }

  onMounted(loadCatalogTree)
</script>

<style lang="scss" scoped>
  .help-doc-page {
    .panel-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .panel-title {
        font-weight: 500;
      }
    }

    .binding-add {
      display: flex;
      gap: 10px;
    }
  }
</style>
