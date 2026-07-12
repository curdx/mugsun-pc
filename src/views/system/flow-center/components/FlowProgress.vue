<!-- 流程图进度：节点链横向高亮（已过/当前/驳回/待处理），对接 /flow/progress -->
<template>
  <div class="flow-progress">
    <template v-for="(node, idx) in nodes" :key="node.nodeCode">
      <div class="fp-node" :class="`fp-node--${node.status}`" :title="statusText(node.status)">
        <ArtSvgIcon class="fp-icon" :icon="statusIcon(node.status)" />
        <span class="fp-name">{{ node.nodeName }}</span>
      </div>
      <ArtSvgIcon
        v-if="idx < nodes.length - 1"
        class="fp-arrow"
        :class="{ 'fp-arrow--done': nodes[idx].status === 'passed' }"
        icon="ri:arrow-right-line"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ nodes: Array<{ nodeCode: string; nodeName: string; status: string }> }>()

  const STATUS: Record<string, { text: string; icon: string }> = {
    passed: { text: '已通过', icon: 'ri:check-line' },
    current: { text: '待处理', icon: 'ri:time-line' },
    rejected: { text: '已退回', icon: 'ri:close-line' },
    pending: { text: '未开始', icon: 'ri:more-line' }
  }
  const statusText = (s: string): string => STATUS[s]?.text ?? s
  const statusIcon = (s: string): string => STATUS[s]?.icon ?? 'ri:circle-line'
</script>

<style scoped>
  .flow-progress {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    padding: 16px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  .fp-node {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 8px 14px;
    font-size: 13px;
    color: #fff;
    border-radius: 16px;
  }

  .fp-node--passed {
    background: var(--el-color-success);
  }

  .fp-node--current {
    background: var(--el-color-primary);
    box-shadow: 0 0 0 4px var(--el-color-primary-light-7);
  }

  .fp-node--rejected {
    background: var(--el-color-danger);
  }

  .fp-node--pending {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-dark);
  }

  .fp-icon {
    font-size: 15px;
  }

  .fp-arrow {
    font-size: 18px;
    color: var(--el-text-color-placeholder);
  }

  .fp-arrow--done {
    color: var(--el-color-success);
  }
</style>
