<!-- 定时任务管理页（对接后端 /system/job，代理 PowerJob） -->
<template>
  <div class="job-page art-full-height">
    <ElCard class="art-table-card">
      <div class="job-toolbar">
        <ElButton type="primary" @click="showDialog()">新建任务</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="jobName" label="任务名称" min-width="160" />
        <ElTableColumn prop="jobDescription" label="描述" min-width="160" show-overflow-tooltip />
        <ElTableColumn label="触发方式" min-width="160">
          <template #default="{ row }">
            {{ row.timeExpression ? `CRON ${row.timeExpression}` : '手动触发' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <ElButton link type="success" @click="run(row)">立即执行</ElButton>
            <ElButton link type="primary" @click="showDialog(row)">编辑</ElButton>
            <ElButton link type="warning" @click="toggle(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </ElButton>
            <ElButton link type="primary" @click="showLogs(row)">日志</ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 新建 / 编辑 -->
    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑任务' : '新建任务'"
      width="500px"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="任务名称" prop="jobName">
          <ElInput v-model="form.jobName" placeholder="请输入任务名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.jobDescription" placeholder="任务描述" />
        </ElFormItem>
        <ElFormItem label="触发方式" prop="timeExpressionType">
          <ElSelect v-model="form.timeExpressionType" style="width: 100%">
            <ElOption label="手动触发" value="API" />
            <ElOption label="定时 CRON" value="CRON" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="form.timeExpressionType === 'CRON'" label="CRON" prop="timeExpression">
          <ElInput v-model="form.timeExpression" placeholder="如 0 * * * * ?" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">提交</ElButton>
      </template>
    </ElDialog>

    <!-- 执行日志 -->
    <ElDialog v-model="logsVisible" title="执行日志" width="680px" align-center>
      <ElTable :data="logs" border size="small" max-height="420">
        <ElTableColumn prop="instanceId" label="实例ID" min-width="180" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="instTagType(row.status)">{{ instStatus(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="触发时间" min-width="170">
          <template #default="{ row }">{{ fmt(row.actualTriggerTime) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="result" label="结果" min-width="140" show-overflow-tooltip />
      </ElTable>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchJobList,
    fetchSaveJob,
    fetchRunJob,
    fetchEnableJob,
    fetchDisableJob,
    fetchDeleteJob,
    fetchJobInstances
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Job' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const logsVisible = ref(false)
  const logs = ref<any[]>([])
  const formRef = ref<FormInstance>()

  const form = reactive<Record<string, any>>({
    id: undefined,
    jobName: '',
    jobDescription: '',
    timeExpressionType: 'API',
    timeExpression: ''
  })

  const rules: FormRules = {
    jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    timeExpression: [{ required: true, message: '请输入 CRON 表达式', trigger: 'blur' }]
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = (await fetchJobList()) || []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const showDialog = (row?: any): void => {
    Object.assign(form, {
      id: undefined,
      jobName: '',
      jobDescription: '',
      timeExpressionType: 'API',
      timeExpression: ''
    })
    if (row) {
      form.id = row.id
      form.jobName = row.jobName
      form.jobDescription = row.jobDescription
      form.timeExpressionType = row.timeExpression ? 'CRON' : 'API'
      form.timeExpression = row.timeExpression || ''
    }
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchSaveJob({ ...form })
      dialogVisible.value = false
      ElMessage.success('保存成功')
      loadData()
    })
  }

  const run = async (row: any): Promise<void> => {
    const instanceId = await fetchRunJob(row.id)
    ElMessage.success(`已触发，实例ID ${instanceId}`)
  }

  const toggle = async (row: any): Promise<void> => {
    if (row.status === 1) {
      await fetchDisableJob(row.id)
      ElMessage.success('已停用')
    } else {
      await fetchEnableJob(row.id)
      ElMessage.success('已启用')
    }
    loadData()
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除任务"${row.jobName}"吗？`, '删除任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchDeleteJob(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const showLogs = async (row: any): Promise<void> => {
    logs.value = (await fetchJobInstances(row.id)) || []
    logsVisible.value = true
  }

  const instStatus = (s: number): string => {
    const map: Record<number, string> = {
      1: '等待派发',
      2: '等待接收',
      3: '运行中',
      4: '失败',
      5: '成功',
      9: '取消',
      10: '停止'
    }
    return map[s] || String(s)
  }

  const instTagType = (s: number): 'success' | 'danger' | 'warning' | 'info' => {
    if (s === 5) return 'success'
    if (s === 4) return 'danger'
    if (s === 3) return 'warning'
    return 'info'
  }

  const fmt = (ts: number): string => (ts ? new Date(ts).toLocaleString('zh-CN') : '-')
</script>

<style scoped>
  .job-toolbar {
    margin-bottom: 12px;
  }
</style>
