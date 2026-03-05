"""
DocuMind AI - Main FastAPI Application
Intelligent RAG System for Handwritten PDF Notes
"""

import os
import uuid
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from backend.config import Config
from models.document import Document, ProcessingStatus
from models.query import QueryRequest, QueryResponse, SourceChunk
from services.ocr_service import OCRService
from services.text_processor import TextProcessor
from services.embedding_service import EmbeddingService
from services.vector_store import VectorStore
from services.llm_service import LLMService
from services.rag_pipeline import RAGPipeline
# Initialize FastAPI app
app = FastAPI(
    title="DocuMind AI",
    description="Intelligent RAG System for Handwritten PDF Notes",
    version="1.0.0"
)

# CORS configuration - FIXED
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Must be ["*"] not [""]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocrservice = OCRService()
textprocessor = TextProcessor()
embeddingservice = EmbeddingService()
vectorstore = VectorStore()
llmservice = LLMService()
ragpipeline = RAGPipeline(
    ocrservice=ocrservice,
    textprocessor=textprocessor,
    embeddingservice=embeddingservice,
    vectorstore=vectorstore,
    llmservice=llmservice
)

# In-memory document storage (use Redis in production)
documents: Dict[str, Document] = {}
conversationhistory: Dict[str, List[Dict]] = {}

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting DocuMind AI Server...")
    
    # Create necessary directories
    for path in [Config.UPLOADDIR, Config.PROCESSEDDIR, Config.VECTORDBDIR]:
        Path(path).mkdir(parents=True, exist_ok=True)
    
    # Initialize Ollama connection
    await llmservice.initialize()
    
    print("✅ DocuMind AI Server Ready!")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "DocuMind AI",
        "status": "running",
        "version": "1.0.0",
        "description": "Intelligent RAG System for Handwritten PDF Notes"
    }

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process a PDF document
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Save uploaded file
        filepath = os.path.join(Config.UPLOADDIR, f"{doc_id}.pdf")
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Create document record
        document = Document(
            id=doc_id,
            filename=file.filename,
            upload_path=filepath,
            status=ProcessingStatus.PROCESSING,
            upload_date=datetime.now()
        )
        documents[doc_id] = document
        
        # Initialize conversation history
        conversationhistory[doc_id] = []
        
        # Process document asynchronously
        processing_result = await ragpipeline.process_document(filepath, doc_id)
        
        # Update document status
        document.status = ProcessingStatus.COMPLETED
        document.total_pages = processing_result.get("total_pages", 0)
        document.total_chunks = processing_result.get("total_chunks", 0)
        document.processing_time = processing_result.get("processing_time", 0)
        
        return JSONResponse(content={
            "success": True,
            "document_id": doc_id,
            "message": "Document processed successfully",
            "details": {
                "filename": file.filename,
                "total_pages": document.total_pages,
                "total_chunks": document.total_chunks,
                "processing_time": f"{document.processing_time:.2f}s"
            }
        })
        
    except Exception as e:
        print(f"Error processing document: {str(e)}")
        if doc_id in documents:
            documents[doc_id].status = ProcessingStatus.FAILED
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query")
async def query_document(request: QueryRequest):
    """
    Query a processed document
    """
    try:
        # Validate document exists
        if request.document_id not in documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = documents[request.document_id]
        if document.status != ProcessingStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Document processing not completed")
        
        # Execute RAG pipeline
        result = await ragpipeline.query(
            document_id=request.document_id,
            query=request.query,
            top_k=request.top_k or 5,
            conversation_history=conversationhistory.get(request.document_id, [])
        )
        
        # Update conversation history
        conversationhistory[request.document_id].append({
            "query": request.query,
            "response": result["answer"],
            "timestamp": datetime.now().isoformat()
        })
        
        # Prepare response
        response = QueryResponse(
            answer=result["answer"],
            confidence_score=result["confidence_score"],
            source_chunks=[
                SourceChunk(
                    text=chunk["text"],
                    page_number=chunk["page_number"],
                    chunk_id=chunk["chunk_id"],
                    relevance_score=chunk["relevance_score"]
                )
                for chunk in result["source_chunks"]
            ],
            has_answer=result["has_answer"],
            processing_time=result["processing_time"]
        )
        
        return response
        
    except Exception as e:
        print(f"Error querying document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/document/{document_id}")
async def get_document_info(document_id: str):
    """Get document information"""
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = documents[document_id]
    return {
        "id": document.id,
        "filename": document.filename,
        "status": document.status.value,
        "total_pages": document.total_pages,
        "total_chunks": document.total_chunks,
        "upload_date": document.upload_date.isoformat()
    }

@app.get("/api/history/{document_id}")
async def get_conversation_history(document_id: str):
    """Get conversation history for a document"""
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "document_id": document_id,
        "history": conversationhistory.get(document_id, [])
    }

@app.delete("/api/document/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its data"""
    if document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Clean up files and data
    document = documents[document_id]
    if os.path.exists(document.upload_path):
        os.remove(document.upload_path)
    
    # Remove from vector store
    vectorstore.delete_document(document_id)
    
    # Clear from memory
    del documents[document_id]
    if document_id in conversationhistory:
        del conversationhistory[document_id]
    
    return {"success": True, "message": "Document deleted successfully"}

@app.websocket("/ws/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: str):
    """WebSocket for real-time updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            query_data = json.loads(data)
            
            # Process query
            result = await query_document(QueryRequest(
                document_id=document_id,
                query=query_data["query"]
            ))
            
            await websocket.send_json(result.dict())
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for document {document_id}")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )