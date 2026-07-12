// 图形流程设计的前端模型：节点树（数组表示）+ 提交前转递归 DTO
let seq = 0
const uid = (): string => `g${Date.now().toString(36)}${(seq++).toString(36)}`

export interface Rule {
  field: string
  op: string
  value: string
}
export interface GBranch {
  id: string
  name: string
  conditions: Rule[]
  logic: 'AND' | 'OR'
  isDefault: boolean
  children: GNode[]
}
export interface GNode {
  id: string
  type: 'approval' | 'condition' | 'parallel'
  name: string
  candidates: { type: string; value: string }[]
  nodeRatio: string
  branches: GBranch[]
}

export const newBranch = (name = '分支'): GBranch => ({
  id: uid(),
  name,
  conditions: [],
  logic: 'AND',
  isDefault: false,
  children: []
})

export const newNode = (type: string): GNode => {
  const base: GNode = {
    id: uid(),
    type: type as GNode['type'],
    name: '',
    candidates: [{ type: 'role', value: '' }],
    nodeRatio: '0',
    branches: []
  }
  if (type === 'condition') {
    base.name = '条件分支'
    base.branches = [newBranch('分支一'), { ...newBranch('否则'), isDefault: true }]
  } else if (type === 'parallel') {
    base.name = '并行分支'
    base.branches = [newBranch('分支一'), newBranch('分支二')]
  } else {
    base.name = '审批'
  }
  return base
}

// 单个候选人 → storageId 前缀 token（与后端 FlowConstants 前缀一致）
const candidateToken = (c: { type: string; value: string }): string => {
  if (c.type === 'initiator') return 'initiator'
  if (c.type === 'deptLeader') return 'deptLeader'
  return c.value ? `${c.type}:${c.value}` : ''
}

// 节点数组 → 后端递归 DTO（childNode 单链 + branches[].childNode）
export const toTree = (nodes: GNode[], i = 0): any => {
  if (i >= nodes.length) return null
  const n = nodes[i]
  const out: any = { type: n.type, name: n.name, childNode: toTree(nodes, i + 1) }
  if (n.type === 'approval') {
    out.candidates = n.candidates.map(candidateToken).filter(Boolean)
    out.nodeRatio = n.nodeRatio
  } else {
    out.branches = n.branches.map((b) => ({
      name: b.name,
      logic: b.logic,
      conditions: b.isDefault ? [] : b.conditions.filter((r) => r.field && r.op),
      childNode: toTree(b.children, 0)
    }))
  }
  return out
}

// 校验：审批节点须有候选人；条件分支须有非空分支
export const validateTree = (nodes: GNode[]): string => {
  for (const n of nodes) {
    if (n.type === 'approval') {
      if (!n.candidates.map(candidateToken).filter(Boolean).length)
        return `节点「${n.name}」未配置候选人`
    } else {
      if (n.type === 'parallel' && n.branches.length < 2) return `并行「${n.name}」至少两个分支`
      if (!n.branches.length) return `分支「${n.name}」至少一个分支`
      for (const b of n.branches) {
        if (n.type === 'condition' && !b.isDefault && !b.conditions.filter((r) => r.field).length)
          return `条件分支「${b.name}」需配置条件或标记为默认`
        const sub = validateTree(b.children)
        if (sub) return sub
      }
    }
  }
  return ''
}
