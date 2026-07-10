<!-- 低代码表单：设计（form-create 设计器）→ 保存 schema → 运行时渲染填报 → 数据落库 -->
<template>
  <div class="form-page art-full-height">
    <ElCard class="art-table-card">
      <div class="form-toolbar">
        <ElButton type="primary" @click="showCreate">新建表单</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="name" label="表单名称" min-width="150" />
        <ElTableColumn prop="formKey" label="表单标识" min-width="150" />
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDesigner(row)">设计</ElButton>
            <ElButton link type="success" @click="openFill(row)">填报</ElButton>
            <ElButton link type="warning" @click="openRecords(row)">记录</ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 新建表单 -->
    <ElDialog v-model="createVisible" title="新建表单" width="500px" align-center>
      <ElForm ref="createRef" :model="createForm" :rules="createRules" label-width="90px">
        <ElFormItem label="表单名称" prop="name">
          <ElInput v-model="createForm.name" placeholder="请输入表单名称" />
        </ElFormItem>
        <ElFormItem label="表单标识" prop="formKey">
          <ElInput v-model="createForm.formKey" placeholder="唯一英文标识，如 leave_apply" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="createForm.remark" type="textarea" placeholder="备注" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitCreate">创建并设计</ElButton>
      </template>
    </ElDialog>

    <!-- 设计器 -->
    <ElDialog
      v-model="designerVisible"
      :title="`设计表单 - ${current?.name || ''}`"
      fullscreen
      :destroy-on-close="true"
    >
      <FcDesigner v-if="designerVisible" ref="designerRef" height="calc(100vh - 140px)" />
      <template #footer>
        <ElButton @click="designerVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveDesign">保存设计</ElButton>
      </template>
    </ElDialog>

    <!-- 填报（运行时渲染） -->
    <ElDialog
      v-model="fillVisible"
      :title="`填报 - ${current?.name || ''}`"
      width="640px"
      align-center
      :destroy-on-close="true"
    >
      <div v-if="fillEmpty" class="form-empty">该表单尚未设计，请先设计表单。</div>
      <FormCreate
        v-else-if="fillVisible"
        v-model:api="fApi"
        :rule="fillRule"
        :option="fillOption"
        @submit="onFillSubmit"
      />
    </ElDialog>

    <!-- 填报记录 -->
    <ElDialog
      v-model="recordsVisible"
      :title="`填报记录 - ${current?.name || ''}`"
      width="720px"
      align-center
    >
      <ElTable :data="records" border max-height="420">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn label="填报数据" min-width="360">
          <template #default="{ row }">
            <pre class="form-data-cell">{{ prettyData(row.formData) }}</pre>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="submitter" label="提交人" width="170" />
        <ElTableColumn prop="createTime" label="时间" min-width="170" />
      </ElTable>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, nextTick } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import formCreate from '@form-create/element-ui'
  import {
    fetchFormPage,
    fetchFormDetail,
    fetchSubmitForm,
    fetchRemoveForm,
    fetchSubmitFormData,
    fetchFormData
  } from '@/api/form'

  defineOptions({ name: 'FormDesigner' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const current = ref<any>(null)

  // 新建
  const createVisible = ref(false)
  const createRef = ref<FormInstance>()
  const createForm = reactive<Record<string, any>>({ name: '', formKey: '', remark: '' })
  const createRules: FormRules = {
    name: [{ required: true, message: '请输入表单名称', trigger: 'blur' }],
    formKey: [
      { required: true, message: '请输入表单标识', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: '以字母开头，仅字母数字下划线',
        trigger: 'blur'
      }
    ]
  }

  // 设计器
  const designerVisible = ref(false)
  const designerRef = ref<any>()

  // 填报
  const fillVisible = ref(false)
  const fillEmpty = ref(false)
  const fillRule = ref<any[]>([])
  const fillOption = ref<Record<string, any>>({})
  const fApi = ref<any>()

  // 记录
  const recordsVisible = ref(false)
  const records = ref<any[]>([])

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchFormPage({ pageNum: 1, pageSize: 50 })
      tableData.value = resp?.records ?? []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const showCreate = (): void => {
    Object.assign(createForm, { name: '', formKey: '', remark: '' })
    createVisible.value = true
  }

  const submitCreate = async (): Promise<void> => {
    if (!createRef.value) return
    await createRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchSubmitForm({ ...createForm, status: 1 })
      ElMessage.success('创建成功')
      createVisible.value = false
      await loadData()
      // 直接进入设计
      const row = tableData.value.find((f) => f.formKey === createForm.formKey)
      if (row) openDesigner(row)
    })
  }

  const openDesigner = async (row: any): Promise<void> => {
    current.value = row
    designerVisible.value = true
    const detail = await fetchFormDetail(row.id)
    await nextTick()
    // 回显已有设计
    if (detail?.formSchema) {
      try {
        designerRef.value?.setRule(formCreate.parseJson(detail.formSchema))
        if (detail.formOption) designerRef.value?.setOption(JSON.parse(detail.formOption))
      } catch (e) {
        console.warn('表单设计回显失败', e)
      }
    }
  }

  const saveDesign = async (): Promise<void> => {
    if (!current.value || !designerRef.value) return
    const rule = designerRef.value.getJson() // 规则 JSON 字符串
    const option = JSON.stringify(designerRef.value.getOption())
    await fetchSubmitForm({
      id: current.value.id,
      name: current.value.name,
      formKey: current.value.formKey,
      formSchema: rule,
      formOption: option,
      status: current.value.status ?? 1,
      remark: current.value.remark
    })
    ElMessage.success('设计已保存')
    designerVisible.value = false
    loadData()
  }

  const openFill = async (row: any): Promise<void> => {
    current.value = row
    const detail = await fetchFormDetail(row.id)
    if (!detail?.formSchema) {
      fillEmpty.value = true
      fillVisible.value = true
      return
    }
    fillEmpty.value = false
    fillRule.value = formCreate.parseJson(detail.formSchema)
    const opt = detail.formOption ? JSON.parse(detail.formOption) : {}
    opt.submitBtn = opt.submitBtn ?? { show: true, innerText: '提交' }
    fillOption.value = opt
    fillVisible.value = true
  }

  const onFillSubmit = async (formData: Record<string, any>): Promise<void> => {
    await fetchSubmitFormData(current.value.formKey, formData)
    ElMessage.success('提交成功')
    fillVisible.value = false
  }

  const openRecords = async (row: any): Promise<void> => {
    current.value = row
    const resp = await fetchFormData(row.formKey, { pageNum: 1, pageSize: 50 })
    records.value = resp?.records ?? []
    recordsVisible.value = true
  }

  const prettyData = (data: string): string => {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除表单"${row.name}"吗？`, '删除表单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveForm(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .form-toolbar {
    margin-bottom: 12px;
  }

  .form-empty {
    padding: 40px 0;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .form-data-cell {
    margin: 0;
    font-size: 12px;
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>
