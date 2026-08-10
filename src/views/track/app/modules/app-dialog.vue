<!-- 埋点应用新增/编辑弹窗（对接后端 /system/track/app/submit；appKey 由服务端生成） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增应用' : '编辑应用'"
    width="520px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="96px">
      <ElFormItem label="应用名称" prop="appName">
        <ElInput v-model="formData.appName" placeholder="请输入应用名称" />
      </ElFormItem>
      <ElFormItem label="采样率" prop="sampleRate">
        <ElInputNumber v-model="formData.sampleRate" :min="1" :max="100" :step="5" :precision="0" />
        <span class="track-form-hint">百分比 1 ~ 100，100 表示全量采集</span>
      </ElFormItem>
      <ElFormItem label="启用" prop="enabled">
        <ElSwitch v-model="formData.enabled" :active-value="1" :inactive-value="0" />
      </ElFormItem>
      <ElFormItem label="脱敏选择器" prop="maskSelectors">
        <ElInput
          v-model="formData.maskSelectors"
          placeholder="逗号分隔的 CSS 选择器，如 .phone,#id-card"
        />
      </ElFormItem>
      <ElFormItem label="数据保留期" prop="retentionDays">
        <ElInputNumber v-model="formData.retentionDays" :min="1" :max="3650" :precision="0" />
        <span class="track-form-hint">单位：天</span>
      </ElFormItem>
      <ElFormItem label="会话回放" prop="replayEnabled">
        <ElSwitch v-model="formData.replayEnabled" :active-value="1" :inactive-value="0" />
        <span class="track-form-hint">开启后 SDK 常录，按采样率上传</span>
      </ElFormItem>
      <template v-if="formData.replayEnabled === 1">
        <ElFormItem label="回放采样率" prop="replaySampleRate">
          <ElInputNumber
            v-model="formData.replaySampleRate"
            :min="0"
            :max="100"
            :step="10"
            :precision="0"
          />
          <span class="track-form-hint">百分比 0 ~ 100，0 表示仅含错误会话强制上传</span>
        </ElFormItem>
        <ElFormItem label="回放保留期" prop="replayRetentionDays">
          <ElInputNumber v-model="formData.replayRetentionDays" :min="1" :max="30" :precision="0" />
          <span class="track-form-hint">单位：天，最长 30 天</span>
        </ElFormItem>
      </template>
      <ElFormItem label="错误告警" prop="alertEnabled">
        <ElSwitch v-model="formData.alertEnabled" :active-value="1" :inactive-value="0" />
        <span class="track-form-hint">新错误指纹或同指纹超阈值时站内信通知租户管理员</span>
      </ElFormItem>
      <ElFormItem v-if="formData.alertEnabled === 1" label="告警阈值" prop="alertThreshold">
        <ElInputNumber v-model="formData.alertThreshold" :min="1" :max="1000" :precision="0" />
        <span class="track-form-hint">10 分钟内同指纹错误超过该次数时告警</span>
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: string
    appData?: Record<string, any>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', form: Record<string, any>): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()

  const formData = reactive<Record<string, any>>({
    id: undefined,
    appName: '',
    sampleRate: 100,
    enabled: 1,
    maskSelectors: '',
    retentionDays: 90,
    replayEnabled: 0,
    replaySampleRate: 10,
    replayRetentionDays: 14,
    alertEnabled: 0,
    alertThreshold: 10,
    remark: ''
  })

  const rules: FormRules = {
    appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
    sampleRate: [{ required: true, message: '请设置采样率', trigger: 'blur' }],
    retentionDays: [{ required: true, message: '请设置数据保留期', trigger: 'blur' }],
    replaySampleRate: [{ required: true, message: '请设置回放采样率', trigger: 'blur' }],
    replayRetentionDays: [{ required: true, message: '请设置回放保留期', trigger: 'blur' }],
    alertThreshold: [{ required: true, message: '请设置告警阈值', trigger: 'blur' }]
  }

  watch(
    () => [props.visible, props.appData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          {
            id: undefined,
            appName: '',
            sampleRate: 100,
            enabled: 1,
            maskSelectors: '',
            retentionDays: 90,
            replayEnabled: 0,
            replaySampleRate: 10,
            replayRetentionDays: 14,
            alertEnabled: 0,
            alertThreshold: 10,
            remark: ''
          },
          props.appData || {}
        )
        nextTick(() => formRef.value?.clearValidate())
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        emit('submit', { ...formData })
      }
    })
  }
</script>

<style scoped>
  .track-form-hint {
    margin-left: 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
