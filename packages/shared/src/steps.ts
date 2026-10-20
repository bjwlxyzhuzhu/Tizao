import type { StepDefinition } from './types.js';

export const STEPS: StepDefinition[] = [
  {
    id: 'S01', seq: 1, name: '任务书解读与构件定义', type: 'form', maxScore: 4,
    description: '明确构件类型、批量与使用场景，形成设计目标。',
    fields: [
      { key: 'partType', label: '构件类型', kind: 'select', options: ['法兰', '支架', '紧固件'], default: '支架' },
      { key: 'batchQty', label: '批量', kind: 'number', unit: '件', default: 1000 },
      { key: 'purpose', label: '使用场景', kind: 'text', default: '航空结构件' }
    ]
  },
  {
    id: 'S02', seq: 2, name: '材料牌号选择', type: 'form', maxScore: 4,
    description: '根据服役条件选择钛合金牌号。',
    fields: [
      { key: 'grade', label: '牌号', kind: 'select', options: ['TC4', 'TA15', 'TA2'], default: 'TC4' }
    ]
  },
  {
    id: 'S03', seq: 3, name: '目标用户与人体尺寸', type: 'form', maxScore: 4,
    description: '选择人体尺寸百分位，确定人机设计基准。',
    fields: [
      { key: 'percentile', label: '百分位', kind: 'select', options: ['P5', 'P50', 'P95'], default: 'P50' },
      { key: 'sex', label: '性别', kind: 'select', options: ['男', '女'], default: '男' }
    ]
  },
  {
    id: 'S04', seq: 4, name: 'AI 方案预评审', type: 'ai', maxScore: 3,
    description: '提交当前方案，由智能体给出风险清单。',
    fields: []
  },
  {
    id: 'S05', seq: 5, name: '配料计算', type: 'form', maxScore: 5,
    description: '按目标成分计算海绵钛、中间合金与返回料比例。',
    fields: [
      { key: 'spongeKg', label: '海绵钛', kind: 'number', unit: 'kg', default: 100 },
      { key: 'alVKg', label: 'Al-V 中间合金', kind: 'number', unit: 'kg', default: 6 },
      { key: 'returnPct', label: '返回料比例', kind: 'number', unit: '%', default: 20 }
    ]
  },
  {
    id: 'S06', seq: 6, name: '真空系统与检漏', type: 'scene', scene: 'furnace', maxScore: 3,
    description: '按顺序抽真空并检漏。',
    fields: [
      { key: 'targetPa', label: '目标真空度', kind: 'number', unit: 'Pa', default: 1 },
      { key: 'pumpMin', label: '抽真空时间', kind: 'number', unit: 'min', default: 30 }
    ]
  },
  {
    id: 'S07', seq: 7, name: '熔炼参数设定', type: 'form', maxScore: 5,
    description: '设定电流、电压与熔速。',
    fields: [
      { key: 'currentA', label: '电流', kind: 'number', unit: 'A', default: 8000 },
      { key: 'voltageV', label: '电压', kind: 'number', unit: 'V', default: 30 },
      { key: 'meltRate', label: '熔速', kind: 'number', unit: 'mm/min', default: 12 }
    ]
  },
  {
    id: 'S08', seq: 8, name: '起弧与稳弧', type: 'scene', scene: 'furnace', maxScore: 5,
    description: '控制起弧电流与爬升时间。',
    fields: [
      { key: 'startCurrentA', label: '起弧电流', kind: 'number', unit: 'A', default: 3000 },
      { key: 'rampSec', label: '电流爬升时间', kind: 'number', unit: 's', default: 60 }
    ]
  },
  {
    id: 'S09', seq: 9, name: '熔炼过程监控', type: 'chart', maxScore: 4,
    description: '观察温度曲线，必要时调整熔速。',
    fields: [
      { key: 'adjustRate', label: '熔速调整量', kind: 'number', unit: 'mm/min', default: 0 }
    ]
  },
  {
    id: 'S10', seq: 10, name: '凝固组织判读', type: 'chart', maxScore: 4,
    description: '判读缩孔与柱状晶组织。',
    fields: [
      { key: 'defect', label: '判读结论', kind: 'select', options: ['正常', '缩孔', '柱状晶'], default: '正常' }
    ]
  },
  {
    id: 'S11', seq: 11, name: '成分偏析与缺陷识别', type: 'chart', maxScore: 5,
    description: '判读偏析指数并标注缺陷。',
    fields: [
      { key: 'segregationIndex', label: '偏析指数', kind: 'number', default: 1.2 },
      { key: 'defect', label: '缺陷类型', kind: 'select', options: ['无', '偏析', '夹杂'], default: '无' }
    ]
  },
  {
    id: 'S12', seq: 12, name: '锻造温度与保温', type: 'form', maxScore: 4,
    description: '选择锻造相区与保温时间。',
    fields: [
      { key: 'forgeTempC', label: '锻造温度', kind: 'number', unit: '°C', default: 950 },
      { key: 'holdMin', label: '保温时间', kind: 'number', unit: 'min', default: 60 }
    ]
  },
  {
    id: 'S13', seq: 13, name: '变形量分配', type: 'form', maxScore: 4,
    description: '设计道次与每道压下量。',
    fields: [
      { key: 'passes', label: '道次', kind: 'number', default: 4 },
      { key: 'reductionPct', label: '每道压下量', kind: 'number', unit: '%', default: 25 }
    ]
  },
  {
    id: 'S14', seq: 14, name: '锻压操作', type: 'scene', scene: 'forge', maxScore: 5,
    description: '控制下压速度与终锻温度。',
    fields: [
      { key: 'pressSpeed', label: '下压速度', kind: 'number', unit: 'mm/s', default: 5 },
      { key: 'finalTempC', label: '终锻温度', kind: 'number', unit: '°C', default: 900 }
    ]
  },
  {
    id: 'S15', seq: 15, name: '裂纹与折叠判读', type: 'chart', maxScore: 4,
    description: '判读锻件表面缺陷。',
    fields: [
      { key: 'defect', label: '判读结论', kind: 'select', options: ['无', '裂纹', '折叠'], default: '无' }
    ]
  },
  {
    id: 'S16', seq: 16, name: '锻后组织与再结晶', type: 'chart', maxScore: 3,
    description: '判读晶粒尺寸与再结晶分数。',
    fields: [
      { key: 'grainUm', label: '晶粒尺寸', kind: 'number', unit: 'μm', default: 50 }
    ]
  },
  {
    id: 'S17', seq: 17, name: '热处理制度设计', type: 'form', maxScore: 5,
    description: '设计固溶与时效制度。',
    fields: [
      { key: 'solutionC', label: '固溶温度', kind: 'number', unit: '°C', default: 950 },
      { key: 'agingC', label: '时效温度', kind: 'number', unit: '°C', default: 540 },
      { key: 'agingH', label: '时效时间', kind: 'number', unit: 'h', default: 6 }
    ]
  },
  {
    id: 'S18', seq: 18, name: '冷却速率与性能', type: 'chart', maxScore: 4,
    description: '选择冷却方式并观察组织性能变化。',
    fields: [
      { key: 'coolingRate', label: '冷却速率', kind: 'number', unit: '°C/min', default: 10 }
    ]
  },
  {
    id: 'S19', seq: 19, name: '阳极氧化表面处理', type: 'scene', scene: 'forge', maxScore: 4,
    description: '设定电压与时间，观察膜厚与色差。',
    fields: [
      { key: 'anodizeV', label: '氧化电压', kind: 'number', unit: 'V', default: 60 },
      { key: 'anodizeMin', label: '氧化时间', kind: 'number', unit: 'min', default: 20 }
    ]
  },
  {
    id: 'S20', seq: 20, name: '工位布局与作业姿态', type: 'scene', scene: 'workstation', maxScore: 5,
    description: '调整工位高度与物料位置。',
    fields: [
      { key: 'benchHeight', label: '工位高度', kind: 'number', unit: 'mm', default: 900 },
      { key: 'partX', label: '物料水平距离', kind: 'number', unit: 'mm', default: 400 }
    ]
  },
  {
    id: 'S21', seq: 21, name: '可达性与视野校核', type: 'scene', scene: 'workstation', maxScore: 4,
    description: '校核肩点、臂长与目标位置的可达性。',
    fields: [
      { key: 'shoulderH', label: '肩高', kind: 'number', unit: 'mm', default: 1350 },
      { key: 'armLen', label: '臂长', kind: 'number', unit: 'mm', default: 700 },
      { key: 'targetX', label: '目标水平距离', kind: 'number', unit: 'mm', default: 450 }
    ]
  },
  {
    id: 'S22', seq: 22, name: 'RULA 工效评价', type: 'form', maxScore: 4,
    description: '输入关节角度，计算 RULA 分值与动作等级。',
    fields: [
      { key: 'upperArmDeg', label: '上臂角度', kind: 'number', unit: '°', default: 45 },
      { key: 'trunkDeg', label: '躯干前倾', kind: 'number', unit: '°', default: 10 },
      { key: 'neckDeg', label: '颈部前屈', kind: 'number', unit: '°', default: 20 }
    ]
  },
  {
    id: 'S23', seq: 23, name: '工艺—人机协同优化与成本', type: 'form', maxScore: 4,
    description: '在成本约束下调整方案，形成优化结论。',
    fields: [
      { key: 'targetCost', label: '目标成本', kind: 'number', unit: '元/件', default: 500 },
      { key: 'targetYield', label: '目标成材率', kind: 'number', unit: '%', default: 80 }
    ]
  },
  {
    id: 'S24', seq: 24, name: '实验报告与能力画像', type: 'auto', maxScore: 4,
    description: '系统汇总全过程记录，生成报告与能力画像。',
    fields: []
  }
];

export const TOTAL_SCORE = STEPS.reduce((sum, step) => sum + step.maxScore, 0);

export function getStep(id: string): StepDefinition | undefined {
  return STEPS.find((step) => step.id === id);
}

export function nextStepId(id: string): string | null {
  const index = STEPS.findIndex((step) => step.id === id);
  if (index < 0 || index >= STEPS.length - 1) return null;
  return STEPS[index + 1]?.id ?? null;
}

export function isStepId(id: string): boolean {
  return STEPS.some((step) => step.id === id);
}
