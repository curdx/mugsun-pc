<!-- 字典树 CRUD 通用视图（系统字典 / 业务字典共用，通过 api 注入） -->
<template>
  <div class="dict-page art-full-height">
    <!-- 查询栏：条件实时生效、重置回默认 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleResetSearch"
    />
    <ElCard class="art-table-card">
      <div class="dict-toolbar">
        <ElButton v-perm="permPrefix + ':save'" @click="showDialog('add')" v-ripple
          >新增字典</ElButton
        >
      </div>

      <ElTable v-loading="loading" :data="treeData" row-key="id" default-expand-all border>
        <ElTableColumn prop="dictValue" label="字典名称" min-width="200" />
        <ElTableColumn prop="code" label="字典编码" min-width="140" />
        <ElTableColumn prop="dictKey" label="字典键值" min-width="120" />
        <ElTableColumn prop="sort" label="排序" width="80" />
        <ElTableColumn label="标签" width="120">
          <template #default="{ row }">
            <ElTag v-if="row.color" :color="row.color" effect="dark" disable-transitions>
              {{ row.dictValue }}
            </ElTag>
            <span v-else>—</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="操作" width="240">
          <template #default="{ row }">
            <ElButton
              v-perm="permPrefix + ':save'"
              link
              type="primary"
              @click="showDialog('add', row)"
              >新增下级</ElButton
            >
            <ElButton
              v-perm="permPrefix + ':save'"
              link
              type="primary"
              @click="showDialog('edit', row)"
              >编辑</ElButton
            >
            <ElButton v-perm="permPrefix + ':remove'" link type="danger" @click="deleteRow(row)"
              >删除</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>

      <ElDialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增字典' : '编辑字典'"
        width="500px"
        align-center
      >
        <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
          <ElFormItem label="上级字典" prop="parentId">
            <ElSelect v-model="formData.parentId" style="width: 100%">
              <ElOption label="顶级（字典类型）" :value="0" />
              <ElOption
                v-for="opt in topOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="字典编码" prop="code">
            <ElInput v-model="formData.code" placeholder="如 sex" />
          </ElFormItem>
          <ElFormItem label="字典名称" prop="dictValue">
            <ElInput v-model="formData.dictValue" placeholder="如 男" />
          </ElFormItem>
          <ElFormItem label="字典键值" prop="dictKey">
            <ElInput v-model="formData.dictKey" placeholder="如 1" />
          </ElFormItem>
          <ElFormItem label="排序" prop="sort">
            <ElInputNumber v-model="formData.sort" :min="0" />
          </ElFormItem>
          <ElFormItem label="标签颜色" prop="color">
            <ElColorPicker
              v-model="formData.color"
              :predefine="['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']"
            />
          </ElFormItem>
          <ElFormItem label="备注" prop="remark">
            <ElInput v-model="formData.remark" placeholder="请输入备注" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <div class="dialog-footer">
            <ElButton @click="dialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          </div>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useDictStore } from '@/store/modules/dict'

  interface Props {
    treeApi: (params?: Record<string, any>) => Promise<any[]>
    saveApi: (data: Record<string, any>) => Promise<any>
    removeApi: (id: any) => Promise<any>
    /** 权限码前缀（sys:dict / sys:dict-biz），按钮门控拼接 :save/:remove */
    permPrefix?: string
  }

  const props = withDefaults(defineProps<Props>(), { permPrefix: 'sys:dict' })

  const dictStore = useDictStore()

  // ===== 查询栏 =====
  const searchForm = ref({
    dictValue: '',
    code: ''
  })
  const searchItems = [
    {
      key: 'dictValue',
      label: '字典名称',
      type: 'input',
      props: { placeholder: '请输入字典名称', clearable: true }
    },
    {
      key: 'code',
      label: '字典编码',
      type: 'input',
      props: { placeholder: '请输入字典编码', clearable: true }
    }
  ]
  // 当前生效的查询条件（保存/删除后重载保持过滤态，与用户页 refreshData 口径一致）
  const searchParams = ref<Record<string, any>>({})

  const treeData = ref<any[]>([])
  const loading = ref(false)
  const topOptions = ref<Array<{ label: string; value: any }>>([])
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance>()

  const defaultForm = () => ({
    id: undefined,
    parentId: 0,
    code: '',
    dictValue: '',
    dictKey: '',
    sort: 0,
    remark: '',
    color: ''
  })

  const formData = reactive<Record<string, any>>(defaultForm())

  const rules: FormRules = {
    dictValue: [{ required: true, message: '请输入字典名称', trigger: 'blur' }]
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      treeData.value = (await props.treeApi(searchParams.value)) || []
    } finally {
      loading.value = false
    }
  }

  // 上级候选恒取全量顶级类型（不受查询过滤影响）
  const loadTopOptions = async (): Promise<void> => {
    const full = (await props.treeApi()) || []
    topOptions.value = full.map((node: any) => ({
      label: node.dictValue || node.code,
      value: node.id
    }))
  }

  onMounted(() => {
    loadData()
    loadTopOptions()
  })

  // ===== 查询栏联动 =====
  const handleSearch = async (params: Record<string, any>): Promise<void> => {
    searchParams.value = { ...params }
    await loadData()
  }

  const handleResetSearch = async (): Promise<void> => {
    searchForm.value = {
      dictValue: '',
      code: ''
    }
    searchParams.value = {}
    await loadData()
  }

  const showDialog = (type: 'add' | 'edit', row?: Record<string, any>): void => {
    dialogType.value = type
    Object.assign(formData, defaultForm(), type === 'add' ? { parentId: row?.id ?? 0 } : row || {})
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleSubmit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      await props.saveApi({ ...formData })
      dialogVisible.value = false
      ElMessage.success('保存成功')
      // 字典维护变更后重载运行时缓存，业务页即时生效
      if (formData.code) dictStore.reload(formData.code)
      loadTopOptions()
      loadData()
    })
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除字典"${row.dictValue}"吗？`, '删除字典', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await props.removeApi(row.id)
      ElMessage.success('删除成功')
      // 删除后重载运行时缓存，业务页即时生效
      if (row.code) dictStore.reload(row.code)
      loadTopOptions()
      loadData()
    })
  }
</script>

<style scoped>
  /* 树表为自由增长内容：art-full-height 定高 + art-table-card 卡体 overflow:hidden 裁剪，
     卡片取消 flex 拉伸随内容增高、页面自备纵向滚动（track/funnel 同款范式），矮视口下行不被切断 */
  .dict-page {
    overflow-y: auto;
  }

  .dict-page .art-table-card {
    flex: none;
  }

  .dict-toolbar {
    margin-bottom: 12px;
  }
</style>
