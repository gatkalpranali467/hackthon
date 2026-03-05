// DocuMind AI - Main Application Logic

class DocuMindApp {
    constructor() {
        this.currentDocumentId = null;
        this.isProcessing = false;
        this.conversationHistory = [];
        this.api = new DocuMindAPI();
        this.ui = new DocuMindUI();
        this.settings = {
            topK: 5,
            confidenceThreshold: 0.7,
            model: 'llama3'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.checkDarkMode();
    }
    
    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
        
        // Query input
        const queryInput = document.getElementById('queryInput');
        const sendBtn = document.getElementById('sendBtn');
        
        queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendQuery();
            }
        });
        
        sendBtn.addEventListener('click', () => this.sendQuery());
        
        // Remove document
        const removeDoc = document.getElementById('removeDoc');
        removeDoc.addEventListener('click', () => this.removeDocument());
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.ui.showModal('settingsModal');
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Settings modal
        document.getElementById('confidenceThreshold').addEventListener('input', (e) => {
            document.getElementById('confidenceValue').textContent = `${e.target.value}%`;
        });
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.processFile(file);
        }
    }
    
    async processFile(file) {
        if (!file.name.endsWith('.pdf')) {
            this.ui.showError('Please upload a PDF file');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) {
            this.ui.showError('File size must be less than 50MB');
            return;
        }
        
        this.isProcessing = true;
        this.ui.showProcessing();
        
        try {
            const result = await this.api.uploadDocument(file);
            
            if (result.success) {
                this.currentDocumentId = result.document_id;
                this.ui.showDocumentInfo(result.details);
                this.ui.enableChat();
                this.ui.showSuccess('Document processed successfully!');
            }
        } catch (error) {
            this.ui.showError(`Failed to process document: ${error.message}`);
        } finally {
            this.isProcessing = false;
            this.ui.hideProcessing();
        }
    }
    
    async sendQuery() {
        const queryInput = document.getElementById('queryInput');
        const query = queryInput.value.trim();
        
        if (!query || !this.currentDocumentId) return;
        
        // Add user message to chat
        this.ui.addMessage('user', query);
        queryInput.value = '';
        
        // Show typing indicator
        this.ui.showTypingIndicator();
        
        try {
            const response = await this.api.queryDocument(
                this.currentDocumentId,
                query,
                this.settings.topK
            );
            
            // Add AI response to chat
            this.ui.addAIMessage(response);
            
            // Update conversation history
            this.conversationHistory.push({
                query: query,
                response: response
            });
            
            // Show sources if available
            if (response.source_chunks && response.source_chunks.length > 0) {
                this.ui.showSources(response.source_chunks);
            }
            
        } catch (error) {
            this.ui.showError(`Failed to get answer: ${error.message}`);
        } finally {
            this.ui.hideTypingIndicator();
        }
    }
    
    async removeDocument() {
        if (!this.currentDocumentId) return;
        
        if (confirm('Are you sure you want to remove this document?')) {
            try {
                await this.api.deleteDocument(this.currentDocumentId);
                this.currentDocumentId = null;
                this.conversationHistory = [];
                this.ui.resetUI();
                this.ui.showSuccess('Document removed successfully');
            } catch (error) {
                this.ui.showError(`Failed to remove document: ${error.message}`);
            }
        }
    }
    
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    checkDarkMode() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    loadSettings() {
        const saved = localStorage.getItem('documind_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            document.getElementById('topKSetting').value = this.settings.topK;
            document.getElementById('confidenceThreshold').value = this.settings.confidenceThreshold * 100;
            document.getElementById('confidenceValue').textContent = `${this.settings.confidenceThreshold * 100}%`;
            document.getElementById('modelSelect').value = this.settings.model;
        }
    }
    
    saveSettings() {
        this.settings.topK = parseInt(document.getElementById('topKSetting').value);
        this.settings.confidenceThreshold = parseInt(document.getElementById('confidenceThreshold').value) / 100;
        this.settings.model = document.getElementById('modelSelect').value;
        
        localStorage.setItem('documind_settings', JSON.stringify(this.settings));
        this.ui.closeModal('settingsModal');
        this.ui.showSuccess('Settings saved successfully');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DocuMindApp();
});

// Global functions for onclick handlers
function toggleSourcePanel() {
    const panel = document.getElementById('sourcePanel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function saveSettings() {
    window.app.saveSettings();
}
