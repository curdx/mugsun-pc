<!-- 系统字典管理页面 -->
<template>
  <DictTreeView :tree-api="fetchDictTree" :save-api="saveDict" :remove-api="removeDict" />
</template>

<script setup lang="ts">
  import DictTreeView from './components/DictTreeView.vue'
  import { fetchDictTree, saveDict, removeDict } from '@/api/dict'

  defineOptions({ name: 'Dict' })
</script>
