<!-- 报表管理页（设计 + echarts 预览，对接 /system/report） -->
<template>
  <div class="report-page art-full-height">
    <ElCard class="art-table-card">
      <div class="report-toolbar">
        <ElButton type="primary" @click="showDialog()">新建报表</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="reportName" label="报表名称" min-width="160" />
        <ElTableColumn label="数据集" min-width="140">
          <template #default="{ row }">{{ datasetLabel(row.reportKey) }}</template>
        </ElTableColumn>
        <ElTableColumn label="图表类型" width="120">
          <template #default="{ row }">{{ chartLabel(row.chartType) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton link type="success" @click="preview(row)">预览</ElButton>
            <ElButton link type="primary" @click="showDialog(row)">编辑</ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 设计 -->
    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑报表' : '新建报表'"
      width="500px"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="报表名称" prop="reportName">
          <ElInput v-model="form.reportName" placeholder="请输入报表名称" />
        </ElFormItem>
        <ElFormItem label="数据集" prop="reportKey">
          <ElSelect v-model="form.reportKey" style="width: 100%" placeholder="选择数据集">
            <ElOption v-for="d in datasets" :key="d.key" :label="d.label" :value="d.key" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="图表类型" prop="chartType">
          <ElSelect v-model="form.chartType" style="width: 100%">
            <ElOption label="柱状图" value="bar" />
            <ElOption label="饼图" value="pie" />
            <ElOption label="折线图" value="line" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" placeholder="备注" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">提交</ElButton>
      </template>
    </ElDialog>

    <!-- 预览 -->
    <ElDialog
      v-model="previewVisible"
      :title="`报表预览 · ${previewName}`"
      width="640px"
      align-center
      @closed="disposeChart"
    >
      <div ref="chartRef" class="report-chart"></div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, nextTick } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { echarts } from '@/plugins/echarts'
  import {
    fetchReportDatasets,
    fetchReportList,
    fetchSaveReport,
    fetchRemoveReport,
    fetchReportPreview
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Report' })

  const tableData = ref<any[]>([])
  const datasets = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const previewVisible = ref(false)
  const previewName = ref('')
  const chartRef = ref<HTMLElement>()
  const formRef = ref<FormInstance>()
  let chart: echarts.ECharts | null = null

  const form = reactive<Record<string, any>>({
    id: undefined,
    reportName: '',
    reportKey: '',
    chartType: 'bar',
    remark: ''
  })

  const rules: FormRules = {
    reportName: [{ required: true, message: '请输入报表名称', trigger: 'blur' }],
    reportKey: [{ required: true, message: '请选择数据集', trigger: 'change' }],
    chartType: [{ required: true, message: '请选择图表类型', trigger: 'change' }]
  }

  const datasetLabel = (key: string): string =>
    datasets.value.find((d) => d.key === key)?.label || key

  const chartLabel = (t: string): string => ({ bar: '柱状图', pie: '饼图', line: '折线图' })[t] || t

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = (await fetchReportList()) || []
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    datasets.value = (await fetchReportDatasets()) || []
    loadData()
  })

  const showDialog = (row?: any): void => {
    Object.assign(form, {
      id: undefined,
      reportName: '',
      reportKey: '',
      chartType: 'bar',
      remark: ''
    })
    if (row) Object.assign(form, row)
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchSaveReport({ ...form })
      dialogVisible.value = false
      ElMessage.success('保存成功')
      loadData()
    })
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除报表"${row.reportName}"吗？`, '删除报表', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveReport(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const preview = async (row: any): Promise<void> => {
    const data = (await fetchReportPreview(row.id)) || []
    previewName.value = row.reportName
    previewVisible.value = true
    await nextTick()
    disposeChart()
    if (!chartRef.value) return
    chart = echarts.init(chartRef.value)
    chart.setOption(buildOption(row.chartType, data))
  }

  const buildOption = (type: string, data: any[]): any => {
    const items = data.map((d) => ({ name: d.name, value: Number(d.value) }))
    if (type === 'pie') {
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0 },
        series: [{ type: 'pie', radius: '62%', data: items }]
      }
    }
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: items.map((i) => i.name) },
      yAxis: { type: 'value' },
      series: [{ type: type === 'line' ? 'line' : 'bar', data: items.map((i) => i.value) }]
    }
  }

  const disposeChart = (): void => {
    if (chart) {
      chart.dispose()
      chart = null
    }
  }
</script>

<style scoped>
  .report-toolbar {
    margin-bottom: 12px;
  }

  .report-chart {
    width: 100%;
    height: 380px;
  }
</style>
