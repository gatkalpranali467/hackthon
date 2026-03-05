"""Configuration settings for DocuMind AI"""

import os
from pathlib import Path
BASE_DIR = Path(__file__).parent

class Config:
    # Base paths
    STORAGE_DIR = BASE_DIR / "storage"
    
    # Storage paths
    UPLOAD_DIR = STORAGE_DIR / "uploads"
    PROCESSED_DIR = STORAGE_DIR / "processed"
    VECTOR_DB_DIR = STORAGE_DIR / "vector_db"
    
    # OCR settings
    TESSERACT_PATH = os.getenv("TESSERACT_PATH", "/usr/bin/tesseract")
    OCR_LANGUAGE = "eng"
    OCR_DPI = 300
    
    # Text processing
    CHUNK_SIZE = 512
    CHUNK_OVERLAP = 128
    MIN_CHUNK_LENGTH = 50
    
    # Embedding settings
    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION = 384
    
    # Vector store settings
    FAISS_INDEX_TYPE = "IndexFlatIP"  # Inner Product
    FAISS_METRIC = "cosine"
    
    # LLM settings
    OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
    LLM_TEMPERATURE = 0.3
    LLM_MAX_TOKENS = 500
    
    # RAG settings
    RAG_TOP_K = 5
    RAG_CONFIDENCE_THRESHOLD = 0.7
    RAG_MIN_RELEVANCE_SCORE = 0.5
    
    # API settings
    MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {".pdf"}
