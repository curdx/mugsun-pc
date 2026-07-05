<!-- 系统字典管理页面 -->
<template>
  <DictTreeView :tree-api="fetchDictTree" :save-api="fetchSaveDict" :remove-api="fetchRemoveDict" />
</template>

<script setup lang="ts">
  import DictTreeView from './components/DictTreeView.vue'
  import { fetchDictTree, fetchSaveDict, fetchRemoveDict } from '@/api/system-manage'

  defineOptions({ name: 'Dict' })
</script>
