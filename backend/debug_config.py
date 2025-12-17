import sys
import os
sys.path.append(os.getcwd())
from app.core.config import settings

print(f"ARK_API_KEY: '{settings.ARK_API_KEY}'")
print(f"DOUBAO_API_KEY: '{settings.DOUBAO_API_KEY}'")
print(f"DOUBAO_MODEL: '{settings.DOUBAO_MODEL}'")
print(f"DOUBAO_BASE_URL: '{settings.DOUBAO_BASE_URL}'")
