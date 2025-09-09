class ChatManager {
    constructor() {
        this.chatBox = document.getElementById('chat-box');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.currentChatId = null;

        this.initialize();
    }

    initialize() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        if (this.chatHistory.length > 0) {
            this.currentChatId = this.chatHistory[0].id;
            this.loadChat(this.currentChatId);
        } else {
            this.createNewChat();
        }
        this.renderChatHistory();
    }

    createNewChat() {
        this.currentChatId = Date.now().toString();
        this.chatHistory.unshift({
            id: this.currentChatId,
            title: "New Chat",
            messages: [],
            timestamp: new Date().toISOString()
        });
        this.saveToLocalStorage();
        this.renderChatHistory();
        this.clearChat();
    }

    async sendMessage() {
        const text = this.userInput.value.trim();
        if (!text) return;

        // Disable UI during processing
        this.userInput.disabled = true;
        this.sendBtn.disabled = true;
        this.showTypingIndicator();

        this.addMessage(text, 'user');
        this.userInput.value = '';

        try {
            const botResponse = await this.getBotResponse(text);
            this.addMessage(botResponse, 'bot');
        } catch (error) {
            this.addMessage(`Error: ${error.message}`, 'bot');
        } finally {
            // Re-enable UI
            this.userInput.disabled = false;
            this.sendBtn.disabled = false;
            this.hideTypingIndicator();
        }
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.classList.add('visible');
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.classList.remove('visible');
    }
    async getBotResponse(prompt) {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'deepseek-r1:1.5b',
                prompt: prompt,
                stream: false,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        const data = await response.json();
        return data.response;
    }

    addMessage(text, sender) {
        const chat = this.chatHistory.find(c => c.id === this.currentChatId);
        chat.messages.push({ text, sender, timestamp: new Date().toISOString() });
        chat.title = text.substring(0, 30);
        this.addMessageToUI(text, sender);
        this.saveToLocalStorage();
        this.renderChatHistory();
    }

    addMessageToUI(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<div class="content">${text}</div>`;
        this.chatBox.appendChild(messageDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    loadChat(chatId) {
        this.currentChatId = chatId;
        const chat = this.chatHistory.find(c => c.id === chatId);
        this.clearChat();
        chat.messages.forEach(msg => this.addMessageToUI(msg.text, msg.sender));
    }

    deleteChat(chatId) {
        this.chatHistory = this.chatHistory.filter(chat => chat.id !== chatId);
        if (this.currentChatId === chatId) {
            this.currentChatId = this.chatHistory[0]?.id || null;
            if (this.currentChatId) this.loadChat(this.currentChatId);
            else this.createNewChat();
        }
        this.saveToLocalStorage();
        this.renderChatHistory();
    }

    renderChatHistory() {
        const historyContainer = document.getElementById('chat-history');
        historyContainer.innerHTML = this.chatHistory.map(chat => `
            <div class="chat-item">
                <div class="chat-content" onclick="chatManager.loadChat('${chat.id}')">
                    <div class="chat-title">${chat.title}</div>
                    <small>${new Date(chat.timestamp).toLocaleString()}</small>
                </div>
                <button class="delete-btn" onclick="chatManager.deleteChat('${chat.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    }

    clearChat() {
        this.chatBox.innerHTML = '';
    }

    saveToLocalStorage() {
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }
}

const chatManager = new ChatManager();