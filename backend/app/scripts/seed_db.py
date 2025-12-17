
MOCK_RISKS = [
  { "id": 'R-001', "title": '管理员账号缺少 MFA', "severity": 'High', "category": 'Access Control', "status": 'Open', "description": '监测到 root 账号在未进行多因素认证的情况下登录系统。', "dateIdentified": '2024-03-01', "owner": 'IT Security' },
  { "id": 'R-002', "title": '数据备份验证失败', "severity": 'Medium', "category": 'Business Continuity', "status": 'Open', "description": '第三季度数据库恢复测试记录缺失。', "dateIdentified": '2024-03-10', "owner": 'DevOps' },
  { "id": 'R-003', "title": 'SSL 证书已过期', "severity": 'Low', "category": 'Encryption', "status": 'Mitigated', "description": '开发环境证书已过期，影响内部测试。', "dateIdentified": '2024-02-15', "owner": 'App Support' },
  { "id": 'R-004', "title": '供应商评估逾期', "severity": 'Medium', "category": 'Supplier Relationships', "status": 'Open', "description": '云服务提供商 X 的年度安全审查逾期 30 天。', "dateIdentified": '2024-03-20', "owner": 'Procurement' },
  { "id": 'R-005', "title": '弱口令策略', "severity": 'High', "category": 'Access Control', "status": 'Closed', "description": '检测到最小密码长度配置为 6 位，已更新为 12 位。', "dateIdentified": '2024-01-05', "owner": 'IT Security' },
]

# Nodes from graph.py (excluding risks which are covered above, but we need to map IDs)
# Note: graph.py used RISK-001, but risks.py uses R-001. I will standardize on R-001.
# I need to update the graph links to use R-001 instead of RISK-001.

OTHER_NODES = [
    { "id": 'ISO27001', "label": 'ISO 27001', "type": "Standard" },
    { "id": 'A.9', "label": 'A.9 访问控制', "type": "ControlDomain" },
    { "id": 'A.9.1.1', "label": '访问控制策略', "type": "Control" },
    { "id": 'A.9.4.1', "label": '访问限制', "type": "Control" },
    { "id": 'DOC-001', "label": '密码策略.pdf', "type": "Document" },
    { "id": 'LOG-005', "label": '服务器日志', "type": "Evidence" },
    { "id": 'A.12', "label": 'A.12 操作安全', "type": "ControlDomain" },
    { "id": 'A.12.3.1', "label": '数据备份', "type": "Control" },
]

# Standardize IDs: RISK-001 -> R-001, RISK-002 -> R-002
RELATIONSHIPS = [
    { "source": 'ISO27001', "target": 'A.9', "type": 'CONTAINS' },
    { "source": 'ISO27001', "target": 'A.12', "type": 'CONTAINS' },
    { "source": 'A.9', "target": 'A.9.1.1', "type": 'REQUIRES' },
    { "source": 'A.9', "target": 'A.9.4.1', "type": 'REQUIRES' },
    { "source": 'A.9.1.1', "target": 'DOC-001', "type": 'EVIDENCED_BY' },
    { "source": 'A.9.4.1', "target": 'LOG-005', "type": 'EVIDENCED_BY' },
    { "source": 'A.9.1.1', "target": 'R-005', "type": 'MITIGATES' }, # Was RISK-001 (Weak Password) -> R-005 (Weak Password Policy)
    { "source": 'A.12', "target": 'A.12.3.1', "type": 'REQUIRES' },
    { "source": 'A.12.3.1', "target": 'R-002', "type": 'MITIGATES' }, # Was RISK-002 (Data Loss) -> R-002 (Backup Failure)
    # Add link for R-001 (MFA)
    { "source": 'A.9.4.1', "target": 'R-001', "type": 'MITIGATES' }
]

import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from app.db.neo4j_client import neo4j_client

def seed_data():
    print("🌱 Seeding Database...")
    
    # 1. Clear DB
    print("   Cleaning existing data...")
    neo4j_client.execute_query("MATCH (n) DETACH DELETE n")
    
    # 2. Insert Risks
    print(f"   Inserting {len(MOCK_RISKS)} Risks...")
    query_risks = """
    UNWIND $risks AS r
    MERGE (n:Risk {id: r.id})
    SET n += r, n.label = r.title, n.group = 4
    """
    neo4j_client.execute_query(query_risks, {"risks": MOCK_RISKS})
    
    # 3. Insert Other Nodes
    print(f"   Inserting {len(OTHER_NODES)} Other Nodes...")
    # Dynamic labels are tricky in parameters, so we'll just loop or use APOC if available.
    # For simplicity/compatibility, I'll iterate in Python or use Case logic in Cypher if types are few.
    # Since types are mapped to Neo4j Labels, I'll iterate python-side for clarity.
    
    for node in OTHER_NODES:
        label = node['type']
        # Also add a generic 'AuditEntity' label for easy searching
        query_node = f"""
        MERGE (n:{label} {{id: $id}})
        SET n.label = $label, n.group = CASE 
            WHEN '{label}' = 'Standard' THEN 1 
            WHEN '{label}' = 'ControlDomain' THEN 1
            WHEN '{label}' = 'Control' THEN 2
            WHEN '{label}' = 'Document' THEN 3
            ELSE 3 END
        SET n:AuditEntity
        """
        neo4j_client.execute_query(query_node, node)
        
    # 4. Insert Relationships
    print(f"   Inserting {len(RELATIONSHIPS)} Relationships...")
    for rel in RELATIONSHIPS:
        # Match nodes by ID and create rel
        query_rel = f"""
        MATCH (s {{id: $source}}), (t {{id: $target}})
        MERGE (s)-[r:{rel['type']}]->(t)
        """
        neo4j_client.execute_query(query_rel, rel)
        
    print("✅ Database Seeded Successfully!")

if __name__ == "__main__":
    seed_data()
