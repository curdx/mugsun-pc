<!-- 字典树 CRUD 通用视图（系统字典 / 业务字典共用，通过 api 注入） -->
<template>
  <div class="dict-page art-full-height">
    <ElCard class="art-table-card">
      <div class="dict-toolbar">
        <ElButton @click="showDialog('add')" v-ripple>新增字典</ElButton>
      </div>

      <ElTable :data="treeData" row-key="id" default-expand-all border>
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
            <ElButton link type="primary" @click="showDialog('add', row)">新增下级</ElButton>
            <ElButton link type="primary" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
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

  interface Props {
    treeApi: () => Promise<any[]>
    saveApi: (data: Record<string, any>) => Promise<any>
    removeApi: (id: any) => Promise<any>
  }

  const props = defineProps<Props>()

  const treeData = ref<any[]>([])
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
    treeData.value = (await props.treeApi()) || []
    // 顶级字典类型作为上级候选
    topOptions.value = treeData.value.map((node: any) => ({
      label: node.dictValue || node.code,
      value: node.id
    }))
  }

  onMounted(loadData)

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
      loadData()
    })
  }
</script>

<style scoped>
  .dict-toolbar {
    margin-bottom: 12px;
  }
</style>
