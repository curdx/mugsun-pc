<!-- 递归流程链：渲染一段流程节点数组（审批/条件分支/并行分支），条件/并行节点内嵌分支列 → 递归子链 -->
<template>
  <div class="g-chain">
    <div class="g-add">
      <GraphAdd @pick="(t: string) => insertAt(0, t)" />
    </div>
    <template v-for="(node, idx) in nodes" :key="node.id">
      <div class="g-node" :class="`g-node--${node.type}`">
        <div class="g-node-hd">
          <span class="g-type">{{ typeLabel(node.type) }}</span>
          <ElInput
            v-model="node.name"
            size="small"
            :placeholder="typeLabel(node.type)"
            class="g-name"
          />
          <ElButton link type="danger" size="small" @click="removeNode(idx)">删除</ElButton>
        </div>

        <!-- 审批节点 -->
        <div v-if="node.type === 'approval'" class="g-node-bd">
          <div v-for="(c, ci) in node.candidates" :key="ci" class="g-cand">
            <ElSelect v-model="c.type" size="small" class="g-cand-type" @change="c.value = ''">
              <ElOption label="角色" value="role" />
              <ElOption label="部门" value="dept" />
              <ElOption label="指定用户" value="user" />
              <ElOption label="发起人本人" value="initiator" />
              <ElOption label="部门负责人" value="deptLeader" />
            </ElSelect>
            <ElSelect
              v-if="c.type === 'role'"
              v-model="c.value"
              size="small"
              class="g-cand-val"
              placeholder="角色"
            >
              <ElOption v-for="r in reg.roles" :key="r.value" :label="r.label" :value="r.value" />
            </ElSelect>
            <ElSelect
              v-else-if="c.type === 'dept'"
              v-model="c.value"
              size="small"
              class="g-cand-val"
              placeholder="部门"
            >
              <ElOption v-for="d in reg.depts" :key="d.value" :label="d.label" :value="d.value" />
            </ElSelect>
            <ElSelect
              v-else-if="c.type === 'user'"
              v-model="c.value"
              size="small"
              filterable
              class="g-cand-val"
              placeholder="用户"
            >
              <ElOption v-for="u in reg.users" :key="u.value" :label="u.label" :value="u.value" />
            </ElSelect>
            <ElButton
              v-if="node.candidates.length > 1"
              link
              type="danger"
              size="small"
              @click="node.candidates.splice(ci, 1)"
              >×</ElButton
            >
          </div>
          <div class="g-row">
            <ElButton
              link
              type="primary"
              size="small"
              @click="node.candidates.push({ type: 'role', value: '' })"
              >+候选人</ElButton
            >
            <ElSelect v-model="node.nodeRatio" size="small" class="g-ratio">
              <ElOption label="或签(任一通过)" value="0" />
              <ElOption label="会签(全部通过)" value="100" />
              <ElOption label="票签(过半通过)" value="50" />
            </ElSelect>
          </div>
        </div>

        <!-- 条件/并行分支 -->
        <div v-else class="g-branches">
          <div v-for="(b, bi) in node.branches" :key="b.id" class="g-branch">
            <div class="g-branch-hd">
              <ElInput v-model="b.name" size="small" placeholder="分支名" class="g-bname" />
              <ElButton
                v-if="node.branches.length > 1"
                link
                type="danger"
                size="small"
                @click="node.branches.splice(bi, 1)"
                >×</ElButton
              >
            </div>
            <div v-if="node.type === 'condition'" class="g-rules">
              <ElCheckbox v-model="b.isDefault" size="small">否则（默认分支）</ElCheckbox>
              <template v-if="!b.isDefault">
                <div v-for="(r, ri) in b.conditions" :key="ri" class="g-rule">
                  <ElInput v-model="r.field" size="small" placeholder="变量" class="g-rf" />
                  <ElSelect v-model="r.op" size="small" class="g-ro">
                    <ElOption v-for="o in OPS" :key="o.value" :label="o.label" :value="o.value" />
                  </ElSelect>
                  <ElInput v-model="r.value" size="small" placeholder="值" class="g-rv" />
                  <ElButton link type="danger" size="small" @click="b.conditions.splice(ri, 1)"
                    >×</ElButton
                  >
                </div>
                <div class="g-row">
                  <ElButton
                    link
                    size="small"
                    @click="b.conditions.push({ field: '', op: 'eq', value: '' })"
                    >+条件</ElButton
                  >
                  <ElRadioGroup v-if="b.conditions.length > 1" v-model="b.logic" size="small">
                    <ElRadioButton value="AND">且</ElRadioButton>
                    <ElRadioButton value="OR">或</ElRadioButton>
                  </ElRadioGroup>
                </div>
              </template>
            </div>
            <GraphChain :nodes="b.children" />
          </div>
          <div class="g-add-branch">
            <ElButton link type="primary" size="small" @click="node.branches.push(newBranch())"
              >+ 分支</ElButton
            >
          </div>
        </div>
      </div>
      <div class="g-add">
        <GraphAdd @pick="(t: string) => insertAt(idx + 1, t)" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import GraphAdd from './GraphAdd.vue'
  import { newNode, newBranch, type GNode } from './graph-model'

  defineOptions({ name: 'GraphChain' })

  const props = defineProps<{ nodes: GNode[] }>()

  const reg = inject<{ roles: any[]; depts: any[]; users: any[] }>('flowReg', {
    roles: [],
    depts: [],
    users: []
  })

  const OPS = [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '大于', value: 'gt' },
    { label: '大于等于', value: 'ge' },
    { label: '小于', value: 'lt' },
    { label: '小于等于', value: 'le' },
    { label: '包含', value: 'like' },
    { label: '不包含', value: 'notLike' }
  ]

  const typeLabel = (t: string): string =>
    ({ approval: '审批', condition: '条件分支', parallel: '并行分支' })[t] || t

  // 递归树编辑器：节点链是父级下传的共享响应式数组，就地增删是该场景既定模式（各层协同编辑同一棵树）
  const insertAt = (idx: number, type: string): void => {
    // eslint-disable-next-line vue/no-mutating-props
    props.nodes.splice(idx, 0, newNode(type))
  }
  const removeNode = (idx: number): void => {
    // eslint-disable-next-line vue/no-mutating-props
    props.nodes.splice(idx, 1)
  }
</script>

<style scoped>
  .g-chain {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .g-add {
    display: flex;
    justify-content: center;
    height: 24px;
  }

  .g-node {
    width: 240px;
    padding: 8px 10px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-left: 3px solid var(--el-color-primary);
    border-radius: 8px;
  }

  .g-node--condition {
    width: auto;
    border-left-color: var(--el-color-warning);
  }

  .g-node--parallel {
    width: auto;
    border-left-color: var(--el-color-success);
  }

  .g-node-hd {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }

  .g-type {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .g-name {
    flex: 1;
  }

  .g-cand,
  .g-rule {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-bottom: 4px;
  }

  .g-cand-type {
    width: 92px;
  }

  .g-cand-val {
    width: 110px;
  }

  .g-ratio {
    width: 132px;
  }

  .g-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 2px;
  }

  .g-branches {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .g-branch {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  .g-branch-hd {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-bottom: 4px;
  }

  .g-bname {
    width: 120px;
  }

  .g-rules {
    width: 260px;
    padding: 6px;
    margin-bottom: 6px;
    background: var(--el-bg-color);
    border-radius: 6px;
  }

  .g-rf {
    width: 78px;
  }

  .g-ro {
    width: 92px;
  }

  .g-rv {
    width: 64px;
  }

  .g-add-branch {
    align-self: center;
  }
</style>
