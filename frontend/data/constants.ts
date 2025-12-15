import { AuditStat, GraphData, RiskItem, Document, RegulationClause, AuditReport } from '../types/index';

export const COMPLIANCE_STATS: AuditStat[] = [
  { name: 'Compliant', value: 65, color: '#10b981' }, // Emerald-500
  { name: 'Non-Compliant', value: 15, color: '#ef4444' }, // Red-500
  { name: 'Pending Review', value: 20, color: '#f59e0b' }, // Amber-500
];

export const RISK_STATS: AuditStat[] = [
  { name: '高危', value: 12, color: '#ef4444' },
  { name: '中危', value: 24, color: '#f59e0b' },
  { name: '低危', value: 45, color: '#3b82f6' },
];

export const MOCK_RISKS: RiskItem[] = [
  { id: 'R-001', title: '管理员账号缺少 MFA', severity: 'High', category: 'Access Control', status: 'Open', description: '监测到 root 账号在未进行多因素认证的情况下登录系统。', dateIdentified: '2024-03-01', owner: 'IT Security' },
  { id: 'R-002', title: '数据备份验证失败', severity: 'Medium', category: 'Business Continuity', status: 'Open', description: '第三季度数据库恢复测试记录缺失。', dateIdentified: '2024-03-10', owner: 'DevOps' },
  { id: 'R-003', title: 'SSL 证书已过期', severity: 'Low', category: 'Encryption', status: 'Mitigated', description: '开发环境证书已过期，影响内部测试。', dateIdentified: '2024-02-15', owner: 'App Support' },
  { id: 'R-004', title: '供应商评估逾期', severity: 'Medium', category: 'Supplier Relationships', status: 'Open', description: '云服务提供商 X 的年度安全审查逾期 30 天。', dateIdentified: '2024-03-20', owner: 'Procurement' },
  { id: 'R-005', title: '弱口令策略', severity: 'High', category: 'Access Control', status: 'Closed', description: '检测到最小密码长度配置为 6 位，已更新为 12 位。', dateIdentified: '2024-01-05', owner: 'IT Security' },
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'D-001', name: 'ISO27001_信息安全策略_v2.pdf', type: 'PDF', size: '2.4 MB', uploadDate: '2024-03-15', status: 'Indexed' },
  { id: 'D-002', name: '2023_内部审计报告.docx', type: 'DOCX', size: '1.1 MB', uploadDate: '2024-02-10', status: 'Indexed' },
  { id: 'D-003', name: '云基础设施配置清单.json', type: 'JSON', size: '0.5 MB', uploadDate: '2024-03-18', status: 'Processing' },
  { id: 'D-004', name: '员工访问日志_Q1.csv', type: 'CSV', size: '15.2 MB', uploadDate: '2024-03-25', status: 'Indexed' },
];

export const MOCK_REGULATIONS: RegulationClause[] = [
  {
    id: 'ISO-A.5',
    code: 'A.5',
    title: '信息安全策略',
    description: '管理层对信息安全的指导。',
    children: [
      { id: 'A.5.1.1', code: 'A.5.1.1', title: '信息安全策略文档', description: '应定义一套信息安全策略，经管理层批准，发布并传达给员工。' },
      { id: 'A.5.1.2', code: 'A.5.1.2', title: '策略的审查', description: '应按计划的时间间隔对信息安全策略进行审查。' }
    ]
  },
  {
    id: 'ISO-A.9',
    code: 'A.9',
    title: '访问控制',
    description: '限制对信息和信息处理设施的访问。',
    children: [
      { id: 'A.9.1.1', code: 'A.9.1.1', title: '访问控制策略', description: '应基于业务和信息安全要求，建立、记录并审查访问控制策略。' },
      { id: 'A.9.2.1', code: 'A.9.2.1', title: '用户注册和注销', description: '应实施正式的用户注册和注销流程。' }
    ]
  },
  {
    id: 'ISO-A.12',
    code: 'A.12',
    title: '操作安全',
    description: '确保信息处理设施的正确和安全运行。',
    children: []
  }
];

export const MOCK_REPORTS: AuditReport[] = [
  { id: 'REP-2024-001', title: '2024 Q1 内部安全审计报告', date: '2024-03-31', status: 'Finalized', summary: '整体合规性保持稳定。在访问控制领域需要重大改进。', findingsCount: 12 },
  { id: 'REP-2024-002', title: '云基础设施审查', date: '2024-04-15', status: 'Draft', summary: '针对 AWS 配置与 CIS 基线的初步分析。', findingsCount: 5 },
];

// Mock Graph Data representing a subset of ISO27001 Knowledge Graph
export const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    { id: 'ISO27001', group: 1, label: 'ISO 27001', val: 20 },
    { id: 'A.9', group: 1, label: 'A.9 访问控制', val: 15 },
    { id: 'A.9.1.1', group: 2, label: '访问控制策略', val: 10 },
    { id: 'A.9.4.1', group: 2, label: '访问限制', val: 10 },
    { id: 'DOC-001', group: 3, label: '密码策略.pdf', val: 5 },
    { id: 'LOG-005', group: 3, label: '服务器日志', val: 5 },
    { id: 'RISK-001', group: 4, label: '弱口令风险', val: 8 },
    { id: 'A.12', group: 1, label: 'A.12 操作安全', val: 15 },
    { id: 'A.12.3.1', group: 2, label: '数据备份', val: 10 },
    { id: 'RISK-002', group: 4, label: '数据丢失风险', val: 8 }
  ],
  links: [
    { source: 'ISO27001', target: 'A.9', type: 'CONTAINS' },
    { source: 'ISO27001', target: 'A.12', type: 'CONTAINS' },
    { source: 'A.9', target: 'A.9.1.1', type: 'REQUIRES' },
    { source: 'A.9', target: 'A.9.4.1', type: 'REQUIRES' },
    { source: 'A.9.1.1', target: 'DOC-001', type: 'EVIDENCED_BY' },
    { source: 'A.9.4.1', target: 'LOG-005', type: 'EVIDENCED_BY' },
    { source: 'A.9.1.1', target: 'RISK-001', type: 'MITIGATES' },
    { source: 'A.12', target: 'A.12.3.1', type: 'REQUIRES' },
    { source: 'A.12.3.1', target: 'RISK-002', type: 'MITIGATES' }
  ]
};