// DocuMind AI - API Service

class DocuMindAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
    }
    
    async uploadDocument(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${this.baseURL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }
    
    async queryDocument(documentId, query, topK = 5) {
        try {
            const response = await fetch(`${this.baseURL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    document_id: documentId,
                    query: query,
                    top_k: topK
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    }
    
    async getDocumentInfo(documentId) {
        try {
            const response = await fetch(`${this.baseURL}/document/${documentId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get document error:', error);
            throw error;
        }
    }
    
    async deleteDocument(documentId) {
        try {
            const response = await fetch(`${this.baseURL}/document/${documentId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }
    
    async getConversationHistory(documentId) {
        try {
            const response = await fetch(`${this.baseURL}/history/${documentId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get history error:', error);
            throw error;
        }
    }
}