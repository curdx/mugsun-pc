<!-- API 密钥管理页（对接 /system/api-key） -->
<template>
  <div class="apikey-page art-full-height">
    <ElCard class="art-table-card">
      <div class="apikey-toolbar">
        <ElButton type="primary" @click="showDialog">生成密钥</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="name" label="名称" min-width="140" />
        <ElTableColumn prop="accessKey" label="AccessKey" min-width="200" />
        <ElTableColumn prop="secretKey" label="SecretKey" min-width="160" />
        <ElTableColumn prop="scope" label="作用域" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElButton link type="warning" @click="toggle(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 生成 -->
    <ElDialog v-model="dialogVisible" title="生成密钥" width="500px" align-center>
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="作用域">
          <ElInput v-model="form.scope" placeholder="如 read,write" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" placeholder="备注" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">生成</ElButton>
      </template>
    </ElDialog>

    <!-- 生成结果（SK 仅此一次） -->
    <ElDialog v-model="resultVisible" title="密钥已生成" width="560px" align-center>
      <ElAlert type="warning" :closable="false" title="SecretKey 仅显示一次，请立即妥善保存" />
      <ElDescriptions :column="1" border class="apikey-result">
        <ElDescriptionsItem label="AccessKey">{{ generated.accessKey }}</ElDescriptionsItem>
        <ElDescriptionsItem label="SecretKey">{{ generated.secretKey }}</ElDescriptionsItem>
      </ElDescriptions>
      <template #footer>
        <ElButton type="primary" @click="resultVisible = false">我已保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchApiKeyPage,
    fetchGenerateApiKey,
    fetchEnableApiKey,
    fetchDisableApiKey,
    fetchRemoveApiKey
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'ApiKey' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const resultVisible = ref(false)
  const generated = ref<Record<string, any>>({})
  const formRef = ref<FormInstance>()

  const form = reactive<Record<string, any>>({ name: '', scope: '', remark: '' })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchApiKeyPage({ pageNum: 1, pageSize: 50 })
      tableData.value = resp?.records ?? []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const showDialog = (): void => {
    Object.assign(form, { name: '', scope: '', remark: '' })
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      generated.value = (await fetchGenerateApiKey({ ...form })) || {}
      dialogVisible.value = false
      resultVisible.value = true
      loadData()
    })
  }

  const toggle = async (row: any): Promise<void> => {
    if (row.status === 1) {
      await fetchDisableApiKey(row.id)
      ElMessage.success('已停用')
    } else {
      await fetchEnableApiKey(row.id)
      ElMessage.success('已启用')
    }
    loadData()
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除密钥"${row.name}"吗？`, '删除密钥', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveApiKey(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .apikey-toolbar {
    margin-bottom: 12px;
  }

  .apikey-result {
    margin-top: 14px;
  }
</style>
