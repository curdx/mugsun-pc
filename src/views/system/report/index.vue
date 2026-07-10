<!-- 报表管理：多图表仪表盘设计 + echarts 预览（对接 /system/report） -->
<template>
  <div class="report-page art-full-height">
    <ElCard class="art-table-card">
      <div class="report-toolbar">
        <ElButton type="primary" @click="showDialog()">新建报表</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="reportName" label="报表名称" min-width="160" />
        <ElTableColumn label="图表数" width="90">
          <template #default="{ row }">{{ chartCount(row) }}</template>
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

    <!-- 设计（多图表仪表盘） -->
    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑报表' : '新建报表'"
      width="640px"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="报表名称" prop="reportName">
          <ElInput v-model="form.reportName" placeholder="请输入报表名称" />
        </ElFormItem>
        <ElFormItem label="图表">
          <ElButton size="small" type="primary" @click="addChart">+ 添加图表</ElButton>
        </ElFormItem>
        <div class="chart-list">
          <div v-for="(c, idx) in form.charts" :key="idx" class="chart-row">
            <ElInput v-model="c.title" size="small" placeholder="图表标题" class="chart-title" />
            <ElSelect v-model="c.dataset" size="small" placeholder="数据集" class="chart-ds">
              <ElOption v-for="d in datasets" :key="d.key" :label="d.label" :value="d.key" />
            </ElSelect>
            <ElSelect v-model="c.chartType" size="small" class="chart-type">
              <ElOption label="柱状图" value="bar" />
              <ElOption label="饼图" value="pie" />
              <ElOption label="折线图" value="line" />
            </ElSelect>
            <ElButton link type="danger" size="small" @click="removeChart(idx)">删除</ElButton>
          </div>
        </div>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" placeholder="备注" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">提交</ElButton>
      </template>
    </ElDialog>

    <!-- 预览（仪表盘：多图并列） -->
    <ElDialog
      v-model="previewVisible"
      :title="`报表预览 · ${previewName}`"
      width="880px"
      align-center
      @closed="disposeCharts"
    >
      <div class="dashboard-grid">
        <div v-for="(c, idx) in previewCharts" :key="idx" class="dashboard-cell">
          <div class="dashboard-title">{{ c.title }}</div>
          <div :ref="(el) => (chartEls[idx] = el as HTMLElement)" class="dashboard-chart"></div>
        </div>
      </div>
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
    fetchReportPreviewDataset
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Report' })

  interface ChartCfg {
    title: string
    dataset: string
    chartType: string
  }

  const tableData = ref<any[]>([])
  const datasets = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const previewVisible = ref(false)
  const previewName = ref('')
  const previewCharts = ref<ChartCfg[]>([])
  const chartEls = ref<Record<number, HTMLElement>>({})
  const formRef = ref<FormInstance>()
  let charts: echarts.ECharts[] = []

  const form = reactive<{ id?: number; reportName: string; charts: ChartCfg[]; remark: string }>({
    id: undefined,
    reportName: '',
    charts: [],
    remark: ''
  })

  const rules: FormRules = {
    reportName: [{ required: true, message: '请输入报表名称', trigger: 'blur' }]
  }

  const parseCharts = (row: any): ChartCfg[] => {
    if (row.charts) {
      try {
        return JSON.parse(row.charts)
      } catch {
        /* fall through */
      }
    }
    // 兼容 G31 单图表报表
    if (row.reportKey) {
      return [{ title: row.reportName, dataset: row.reportKey, chartType: row.chartType || 'bar' }]
    }
    return []
  }

  const chartCount = (row: any): number => parseCharts(row).length

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
    Object.assign(form, { id: undefined, reportName: '', charts: [], remark: '' })
    if (row) {
      form.id = row.id
      form.reportName = row.reportName
      form.remark = row.remark
      form.charts = parseCharts(row)
    }
    if (!form.charts.length) {
      form.charts = [{ title: '图表1', dataset: datasets.value[0]?.key ?? '', chartType: 'bar' }]
    }
    dialogVisible.value = true
  }

  const addChart = (): void => {
    form.charts.push({
      title: `图表${form.charts.length + 1}`,
      dataset: datasets.value[0]?.key ?? '',
      chartType: 'bar'
    })
  }

  const removeChart = (idx: number): void => {
    form.charts.splice(idx, 1)
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      if (!form.charts.length) {
        ElMessage.warning('至少添加一个图表')
        return
      }
      // 首图冗余存 reportKey/chartType 兼容旧预览接口
      await fetchSaveReport({
        id: form.id,
        reportName: form.reportName,
        reportKey: form.charts[0].dataset,
        chartType: form.charts[0].chartType,
        charts: JSON.stringify(form.charts),
        remark: form.remark
      })
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
    previewName.value = row.reportName
    previewCharts.value = parseCharts(row)
    chartEls.value = {}
    previewVisible.value = true
    await nextTick()
    disposeCharts()
    for (let i = 0; i < previewCharts.value.length; i++) {
      const cfg = previewCharts.value[i]
      const el = chartEls.value[i]
      if (!el) continue
      const data = (await fetchReportPreviewDataset(cfg.dataset)) || []
      const chart = echarts.init(el)
      chart.setOption(buildOption(cfg.chartType, data))
      charts.push(chart)
    }
  }

  const buildOption = (type: string, data: any[]): any => {
    const items = data.map((d) => ({ name: d.name, value: Number(d.value) }))
    if (type === 'pie') {
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0 },
        series: [{ type: 'pie', radius: '60%', data: items }]
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

  const disposeCharts = (): void => {
    charts.forEach((c) => c.dispose())
    charts = []
  }
</script>

<style scoped>
  .report-toolbar {
    margin-bottom: 12px;
  }

  .chart-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 0 12px 90px;
  }

  .chart-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .chart-title {
    width: 160px;
  }

  .chart-ds {
    width: 160px;
  }

  .chart-type {
    width: 110px;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .dashboard-cell {
    padding: 8px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .dashboard-title {
    margin-bottom: 6px;
    font-weight: 600;
    text-align: center;
  }

  .dashboard-chart {
    width: 100%;
    height: 300px;
  }
</style>
