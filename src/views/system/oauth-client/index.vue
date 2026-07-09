<!-- OAuth2 客户端管理（开放平台，对接 /system/oauth-client） -->
<template>
  <div class="oauth-client-page art-full-height">
    <ElCard class="art-table-card">
      <div class="oauth-toolbar">
        <ElButton type="primary" @click="showCreate">新建客户端</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="name" label="名称" min-width="130" />
        <ElTableColumn prop="clientId" label="ClientId" min-width="180" />
        <ElTableColumn prop="clientSecret" label="ClientSecret" min-width="150" />
        <ElTableColumn label="授权类型" min-width="180">
          <template #default="{ row }">
            <ElTag
              v-for="g in (row.grantTypes || '').split(',').filter(Boolean)"
              :key="g"
              size="small"
              class="oauth-tag"
            >
              {{ grantLabel(g) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="scopes" label="授权范围" min-width="150" show-overflow-tooltip />
        <ElTableColumn label="有效期(秒)" width="100" prop="accessTokenValidity" />
        <ElTableColumn label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="showEdit(row)">编辑</ElButton>
            <ElButton link type="warning" @click="resetSecret(row)">重置密钥</ElButton>
            <ElButton link type="info" @click="toggle(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 新建/编辑 -->
    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑客户端' : '新建客户端'"
      width="560px"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="授权类型" prop="grantTypes">
          <ElCheckboxGroup v-model="grantList">
            <ElCheckbox value="client_credentials">客户端凭证</ElCheckbox>
            <ElCheckbox value="authorization_code">授权码</ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
        <ElFormItem label="授权范围">
          <ElSelect
            v-model="scopeList"
            multiple
            filterable
            allow-create
            placeholder="选择或输入 scope"
          >
            <ElOption v-for="s in scopeOptions" :key="s" :label="s" :value="s" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="回调地址">
          <ElInput v-model="form.redirectUri" placeholder="授权码模式回调地址（可选）" />
        </ElFormItem>
        <ElFormItem label="有效期">
          <ElInputNumber v-model="form.accessTokenValidity" :min="60" :step="60" />
          <span class="oauth-hint">秒</span>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" placeholder="备注" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">保存</ElButton>
      </template>
    </ElDialog>

    <!-- 密钥结果（仅此一次） -->
    <ElDialog v-model="resultVisible" title="客户端密钥" width="600px" align-center>
      <ElAlert type="warning" :closable="false" title="ClientSecret 仅显示一次，请立即妥善保存" />
      <ElDescriptions :column="1" border class="oauth-result">
        <ElDescriptionsItem label="ClientId">{{ generated.clientId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="ClientSecret">{{ generated.clientSecret }}</ElDescriptionsItem>
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
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchOauthClientPage,
    fetchSaveOauthClient,
    fetchResetOauthSecret,
    fetchEnableOauthClient,
    fetchDisableOauthClient,
    fetchRemoveOauthClient
  } from '@/api/oauth'

  defineOptions({ name: 'OauthClient' })

  const scopeOptions = ['user:read', 'user:write']
  const tableData = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const resultVisible = ref(false)
  const generated = ref<Record<string, any>>({})
  const formRef = ref<FormInstance>()

  const form = reactive<Record<string, any>>({
    id: null,
    name: '',
    grantTypes: '',
    scopes: '',
    redirectUri: '',
    accessTokenValidity: 7200,
    remark: ''
  })
  const grantList = ref<string[]>([])
  const scopeList = ref<string[]>([])

  const rules: FormRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    grantTypes: [
      {
        validator: (_r, _v, cb) =>
          grantList.value.length ? cb() : cb(new Error('请选择授权类型')),
        trigger: 'change'
      }
    ]
  }

  const grantLabel = (g: string): string =>
    g === 'client_credentials' ? '客户端凭证' : g === 'authorization_code' ? '授权码' : g

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchOauthClientPage({ pageNum: 1, pageSize: 50 })
      tableData.value = resp?.records ?? []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const resetForm = (): void => {
    Object.assign(form, {
      id: null,
      name: '',
      grantTypes: '',
      scopes: '',
      redirectUri: '',
      accessTokenValidity: 7200,
      remark: ''
    })
    grantList.value = ['client_credentials']
    scopeList.value = ['user:read']
  }

  const showCreate = (): void => {
    resetForm()
    dialogVisible.value = true
  }

  const showEdit = (row: any): void => {
    Object.assign(form, {
      id: row.id,
      name: row.name,
      redirectUri: row.redirectUri,
      accessTokenValidity: row.accessTokenValidity ?? 7200,
      remark: row.remark
    })
    grantList.value = (row.grantTypes || '').split(',').filter(Boolean)
    scopeList.value = (row.scopes || '').split(',').filter(Boolean)
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    form.grantTypes = grantList.value.join(',')
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      const payload = {
        ...form,
        grantTypes: grantList.value.join(','),
        scopes: scopeList.value.join(',')
      }
      const saved = (await fetchSaveOauthClient(payload)) || {}
      dialogVisible.value = false
      // 新建返回明文密钥
      if (!form.id && saved.clientSecret && !saved.clientSecret.includes('*')) {
        generated.value = saved
        resultVisible.value = true
      } else {
        ElMessage.success('保存成功')
      }
      loadData()
    })
  }

  const resetSecret = (row: any): void => {
    ElMessageBox.confirm(`确定重置客户端"${row.name}"的密钥吗？旧密钥将立即失效。`, '重置密钥', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      generated.value = (await fetchResetOauthSecret(row.id)) || {}
      resultVisible.value = true
      loadData()
    })
  }

  const toggle = async (row: any): Promise<void> => {
    if (row.status === 1) {
      await fetchDisableOauthClient(row.id)
      ElMessage.success('已停用')
    } else {
      await fetchEnableOauthClient(row.id)
      ElMessage.success('已启用')
    }
    loadData()
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除客户端"${row.name}"吗？`, '删除客户端', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveOauthClient(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .oauth-toolbar {
    margin-bottom: 12px;
  }

  .oauth-tag {
    margin-right: 6px;
  }

  .oauth-result {
    margin-top: 14px;
  }

  .oauth-hint {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
  }
</style>
