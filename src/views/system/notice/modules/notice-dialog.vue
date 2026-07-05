<!-- 通知公告新增/编辑弹窗（对接后端 /system/notice/submit，富文本内容） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增公告' : '编辑公告'"
    width="760px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="标题" prop="title">
        <ElInput v-model="formData.title" placeholder="请输入标题" />
      </ElFormItem>
      <ElFormItem label="分类" prop="category">
        <ElInput v-model="formData.category" placeholder="如 通知 / 公告" />
      </ElFormItem>
      <ElFormItem label="置顶" prop="isTop">
        <ElSwitch v-model="formData.isTop" :active-value="1" :inactive-value="0" />
      </ElFormItem>
      <ElFormItem label="内容" prop="content">
        <ArtWangEditor v-model="formData.content" height="300px" />
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
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'

  interface Props {
    visible: boolean
    type: string
    noticeData?: Record<string, any>
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
    title: '',
    category: '',
    isTop: 0,
    content: ''
  })

  const rules: FormRules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
  }

  watch(
    () => [props.visible, props.noticeData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, title: '', category: '', isTop: 0, content: '' },
          props.noticeData || {}
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
