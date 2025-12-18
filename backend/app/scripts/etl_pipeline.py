import pandas as pd
import sys
import os
import logging

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from app.db.neo4j_client import neo4j_client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data')

def load_risks():
    csv_path = os.path.join(DATA_DIR, 'risks.csv')
    if not os.path.exists(csv_path):
        logger.error(f"File not found: {csv_path}")
        return

    logger.info(f"Loading Risks from {csv_path}...")
    df = pd.read_csv(csv_path)
    # Convert dataframe to list of dicts
    risks = df.to_dict('records')
    
    query = """
    UNWIND $risks AS r
    MERGE (n:Risk {id: r.id})
    SET n += r, n.label = r.title, n.group = 4
    """
    
    try:
        neo4j_client.execute_query(query, {"risks": risks})
        logger.info(f"Successfully loaded {len(risks)} Risks.")
    except Exception as e:
        logger.error(f"Error loading Risks: {e}")

def load_controls_and_entities():
    csv_path = os.path.join(DATA_DIR, 'controls.csv')
    if not os.path.exists(csv_path):
        logger.error(f"File not found: {csv_path}")
        return

    logger.info(f"Loading Controls & Entities from {csv_path}...")
    df = pd.read_csv(csv_path)
    nodes = df.to_dict('records')
    
    for node in nodes:
        label = node['type']
        # Default group mapping
        group_map = {
            'Standard': 1,
            'ControlDomain': 1,
            'Control': 2,
            'Document': 3,
            'Evidence': 3
        }
        node['group_id'] = group_map.get(label, 3)
        
        # Cypher query with dynamic label
        query = f"""
        MERGE (n:{label} {{id: $id}})
        SET n += $props, n.label = CASE WHEN $title IS NOT NULL THEN $title ELSE $code END, n.group = $group_id
        SET n:AuditEntity
        """
        
        # Prepare props (exclude type which is used for label)
        props = {k: v for k, v in node.items() if k != 'type'}
        
        try:
            neo4j_client.execute_query(query, {"id": node['id'], "props": props, "title": node.get('title'), "code": node.get('code'), "group_id": node['group_id']})
        except Exception as e:
            logger.error(f"Error loading node {node['id']}: {e}")
            
    logger.info(f"Processed {len(nodes)} control/entity nodes.")

def load_relationships():
    csv_path = os.path.join(DATA_DIR, 'relationships.csv')
    if not os.path.exists(csv_path):
        logger.error(f"File not found: {csv_path}")
        return

    logger.info(f"Loading Relationships from {csv_path}...")
    df = pd.read_csv(csv_path)
    rels = df.to_dict('records')
    
    for rel in rels:
        rel_type = rel['type']
        query = f"""
        MATCH (s {{id: $source}}), (t {{id: $target}})
        MERGE (s)-[r:{rel_type}]->(t)
        """
        try:
            neo4j_client.execute_query(query, rel)
        except Exception as e:
            logger.error(f"Error creating relationship {rel['source']} -> {rel['target']}: {e}")

    logger.info(f"Processed {len(rels)} relationships.")

def run_etl():
    logger.info("Starting ETL Pipeline...")
    
    # Optional: Clear DB
    logger.info("Clearing existing database...")
    neo4j_client.execute_query("MATCH (n) DETACH DELETE n")
    
    load_risks()
    load_controls_and_entities()
    load_relationships()
    
    logger.info("ETL Pipeline Completed Successfully.")

if __name__ == "__main__":
    run_etl()
