// DocuMind AI - UI Management

class DocuMindUI {
    constructor() {
        this.messageId = 0;
    }
    
    showProcessing() {
        document.getElementById('processingStatus').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
        
        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) {
                clearInterval(progressInterval);
                progress = 90;
            }
            document.getElementById('progressFill').style.width = `${progress}%`;
        }, 500);
    }
    
    hideProcessing() {
        document.getElementById('processingStatus').style.display = 'none';
        document.getElementById('progressFill').style.width = '100%';
        
        setTimeout(() => {
            document.getElementById('progressFill').style.width = '0%';
        }, 500);
    }
    
    showDocumentInfo(details) {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('documentInfo').style.display = 'flex';
        
        document.getElementById('docName').textContent = details.filename;
        document.getElementById('docPages').textContent = details.total_pages;
        document.getElementById('docChunks').textContent = details.total_chunks;
    }
    
    enableChat() {
        document.getElementById('queryInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
        
        // Clear welcome message
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
    }
    
    addMessage(type, text) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.id = `message-${++this.messageId}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = text;
        
        content.appendChild(textDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }
    
    addAIMessage(response) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = response.answer;
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        
        // Confidence indicator
        const confidenceDiv = document.createElement('div');
        confidenceDiv.className = 'confidence-indicator';
        
        const confidenceBar = document.createElement('div');
        confidenceBar.className = 'confidence-bar';
        
        const confidenceFill = document.createElement('div');
        confidenceFill.className = 'confidence-fill';
        const confidencePercent = response.confidence_score * 100;
        confidenceFill.style.width = `${confidencePercent}%`;
        
        if (confidencePercent >= 70) {
            confidenceFill.classList.add('high');
        } else if (confidencePercent >= 40) {
            confidenceFill.classList.add('medium');
        } else {
            confidenceFill.classList.add('low');
        }
        
        confidenceBar.appendChild(confidenceFill);
        confidenceDiv.innerHTML = `<span>Confidence: ${confidencePercent.toFixed(0)}%</span>`;
        confidenceDiv.appendChild(confidenceBar);
        
        // View sources link
        if (response.source_chunks && response.source_chunks.length > 0) {
            const sourcesLink = document.createElement('a');
            sourcesLink.className = 'view-sources';
            sourcesLink.href = '#';
            sourcesLink.textContent = `View ${response.source_chunks.length} sources`;
            sourcesLink.onclick = (e) => {
                e.preventDefault();
                toggleSourcePanel();
            };
            metaDiv.appendChild(sourcesLink);
        }
        
        metaDiv.appendChild(confidenceDiv);
        
        content.appendChild(textDiv);
        if (response.has_answer) {
            content.appendChild(metaDiv);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    showTypingIndicator() {
        const indicator = this.addMessage('ai', '...');
        indicator.classList.add('typing');
        
        // Animate dots
        let dots = 1;
        const interval = setInterval(() => {
            dots = (dots % 3) + 1;
            indicator.querySelector('.message-text').textContent = '.'.repeat(dots);
        }, 500);
        
        indicator.dataset.interval = interval;
    }
    
    hideTypingIndicator() {
        const typing = document.querySelector('.message.typing');
        if (typing) {
            clearInterval(typing.dataset.interval);
            typing.remove();
        }
    }
    
    showSources(sources) {
        const sourcesList = document.getElementById('sourcesList');
        sourcesList.innerHTML = '';
        
        sources.forEach((source, index) => {
            const sourceItem = document.createElement('div');
            sourceItem.className = 'source-item';
            
            sourceItem.innerHTML = `
                <div class="source-header">
                    <span class="page-indicator">Page ${source.page_number}</span>
                    <span class="relevance-score">${(source.relevance_score * 100).toFixed(0)}% relevant</span>
                </div>
                <div class="source-text" onclick="this.classList.toggle('expanded')">
                    ${this.escapeHtml(source.text)}
                </div>
            `;
            
            sourcesList.appendChild(sourceItem);
        });
        
        document.getElementById('sourcePanel').style.display = 'flex';
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
            color: white;
            border-radius: var(--radius-md);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
    
    resetUI() {
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('documentInfo').style.display = 'none';
        document.getElementById('chatMessages').innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-robot"></i>
                <h2>Welcome to DocuMind AI</h2>
                <p>Upload a handwritten PDF document to start asking questions</p>
            </div>
        `;
        document.getElementById('queryInput').disabled = true;
        document.getElementById('sendBtn').disabled = true;
        document.getElementById('sourcePanel').style.display = 'none';
        document.getElementById('fileInput').value = '';
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}
