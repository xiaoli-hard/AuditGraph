from neo4j import GraphDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.uri = settings.NEO4J_URI
        self.username = settings.NEO4J_USERNAME
        self.password = settings.NEO4J_PASSWORD
        self.driver = None

    def connect(self):
        if not self.driver:
            try:
                self.driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))
                logger.info("已连接到 Neo4j 数据库")
            except Exception as e:
                logger.error(f"连接 Neo4j 失败: {e}")
                raise e

    def close(self):
        if self.driver:
            self.driver.close()
            logger.info("已关闭 Neo4j 连接")

    def execute_query(self, query: str, parameters: dict = None):
        if not self.driver:
            self.connect()
        
        try:
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"查询执行失败: {e}")
            raise e

# 全局实例
neo4j_client = Neo4jClient()
