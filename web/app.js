/**
 * AI Startup Validator - Frontend Application
 * Connects to FastAPI backend for AI-powered validation
 */

// API Configuration - Use current origin in production, localhost for development
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : window.location.origin;

// DOM Elements
const elements = {
    inputSection: document.getElementById('input-section'),
    loadingOverlay: document.getElementById('loading-overlay'),
    resultsSection: document.getElementById('results-section'),
    startupIdea: document.getElementById('startup-idea'),
    validateBtn: document.getElementById('validate-btn'),
    backBtn: document.getElementById('back-btn'),
    exportBtn: document.getElementById('export-btn'),
    resultsIdea: document.getElementById('results-idea'),
    loadingStatus: document.getElementById('loading-status'),
    // Content areas
    contentMarket: document.getElementById('content-market'),
    contentRisk: document.getElementById('content-risk'),
    contentMoney: document.getElementById('content-money'),
    contentInvestor: document.getElementById('content-investor'),
    // Status indicators
    statusMarket: document.getElementById('status-market'),
    statusRisk: document.getElementById('status-risk'),
    statusMoney: document.getElementById('status-money'),
    statusInvestor: document.getElementById('status-investor'),
    // Modal elements
    cardModal: document.getElementById('card-modal'),
    modalIcon: document.getElementById('modal-icon'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.getElementById('modal-close'),
    // Result cards
    cardMarket: document.getElementById('card-market'),
    cardRisk: document.getElementById('card-risk'),
    cardMoney: document.getElementById('card-money'),
    cardInvestor: document.getElementById('card-investor'),
    // History elements
    historyBtn: document.getElementById('history-btn'),
    historyPanel: document.getElementById('history-panel'),
    historyOverlay: document.getElementById('history-overlay'),
    historyClose: document.getElementById('history-close'),
    historyContent: document.getElementById('history-content'),
    historyClearBtn: document.getElementById('history-clear-btn'),
};

// State
let isProcessing = false;
let currentResults = null;
let currentIdea = '';

// LocalStorage key
const HISTORY_STORAGE_KEY = 'startup_validator_history';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupTextareaAutoResize();
    setupNavigation();
    setupHistory();
});

// Setup navigation smooth scroll and focus
function setupNavigation() {
    const getStartedBtn = document.querySelector('.nav-cta');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const inputSection = document.getElementById('input-section');
            if (inputSection) {
                inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Focus the textarea after scroll animation
                setTimeout(() => {
                    elements.startupIdea.focus();
                }, 500);
            }
        });
    }
}

function setupEventListeners() {
    elements.validateBtn.addEventListener('click', handleValidate);
    elements.backBtn.addEventListener('click', handleBack);
    elements.exportBtn.addEventListener('click', handleExportPDF);

    // Card expand button handlers
    document.querySelectorAll('.card-expand-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardType = btn.dataset.card;
            openCardModal(cardType);
        });
    });

    // Card export button handlers
    document.querySelectorAll('.card-export-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardType = btn.dataset.card;
            handleExportCardPDF(cardType);
        });
    });

    // Modal close handlers
    elements.modalClose.addEventListener('click', closeCardModal);
    elements.cardModal.addEventListener('click', (e) => {
        if (e.target === elements.cardModal) {
            closeCardModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.cardModal.classList.contains('active')) {
            closeCardModal();
        }
    });

    // Enter to submit (Ctrl/Cmd + Enter)
    elements.startupIdea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleValidate();
        }
    });
}

function setupTextareaAutoResize() {
    elements.startupIdea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
}

async function handleValidate() {
    const idea = elements.startupIdea.value.trim();

    if (!idea) {
        shakeElement(elements.startupIdea.parentElement);
        return;
    }

    if (isProcessing) return;
    isProcessing = true;

    // Show loading
    showLoading();

    try {
        // Call the API
        const response = await fetch(`${API_BASE_URL}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idea }),
        });

        const data = await response.json();

        if (data.status === 'success') {
            displayResults(idea, data);
        } else {
            throw new Error(data.message || 'Validation failed');
        }
    } catch (error) {
        console.error('Validation error:', error);
        hideLoading();
        showError(error.message);
    } finally {
        isProcessing = false;
    }
}

function showLoading() {
    elements.loadingOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Animate status indicators
    simulateAgentProgress();
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function simulateAgentProgress() {
    const agents = ['market', 'risk', 'money', 'investor'];
    const delays = [2000, 2500, 3000, 3500];

    agents.forEach((agent, index) => {
        const statusEl = elements[`status${capitalize(agent)}`];
        const iconEl = statusEl.querySelector('.status-icon');

        // Reset to analyzing
        iconEl.classList.remove('complete');
        iconEl.classList.add('analyzing');

        // Simulate completion
        setTimeout(() => {
            iconEl.classList.remove('analyzing');
            iconEl.classList.add('complete');
        }, delays[index]);
    });
}

function displayResults(idea, data) {
    // Hide loading and hero
    hideLoading();
    document.querySelector('.hero').style.display = 'none';

    // Store for export and modal
    currentIdea = idea;
    currentResults = data.results || {
        market_analysis: data.validation_report || '',
        risk_analysis: '',
        monetization_strategy: '',
        investor_view: ''
    };

    // Display idea
    elements.resultsIdea.textContent = `"${idea}"`;

    // Parse and display results
    if (data.results) {
        // If we have structured results
        elements.contentMarket.innerHTML = formatContent(data.results.market_analysis || 'Analysis pending...');
        elements.contentRisk.innerHTML = formatContent(data.results.risk_analysis || 'Analysis pending...');
        elements.contentMoney.innerHTML = formatContent(data.results.monetization_strategy || 'Analysis pending...');
        elements.contentInvestor.innerHTML = formatContent(data.results.investor_view || 'Analysis pending...');
    } else if (data.validation_report) {
        // If we have a combined report, try to split it
        const report = data.validation_report;
        elements.contentMarket.innerHTML = formatContent(extractSection(report, 'market') || report);
        elements.contentRisk.innerHTML = formatContent(extractSection(report, 'risk') || 'See market analysis for combined report.');
        elements.contentMoney.innerHTML = formatContent(extractSection(report, 'monetization') || 'See market analysis for combined report.');
        elements.contentInvestor.innerHTML = formatContent(extractSection(report, 'investor') || 'See market analysis for combined report.');
    }

    // Show results with animation
    elements.resultsSection.classList.add('active');

    // Animate cards
    animateCards();
}

function extractSection(report, section) {
    // Try to extract sections from combined report
    const patterns = {
        market: /market|size|competitor|trend/i,
        risk: /risk|technical|business|regulatory/i,
        monetization: /monetization|revenue|pricing|profit/i,
        investor: /investor|investment|funding|vc/i
    };

    // For now, return null to show combined report
    return null;
}

function formatContent(content) {
    if (!content) return '<p>No data available</p>';

    // Convert markdown-like content to HTML
    let html = content
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Lists
        .replace(/^\s*[-•]\s+(.*$)/gim, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraphs
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }

    // Wrap consecutive li elements in ul
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    return html;
}

function animateCards() {
    const cards = document.querySelectorAll('.result-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

function handleBack() {
    // Hide results
    elements.resultsSection.classList.remove('active');

    // Show hero
    document.querySelector('.hero').style.display = 'flex';

    // Clear input
    elements.startupIdea.value = '';
    elements.startupIdea.style.height = 'auto';

    // Reset status indicators
    ['market', 'risk', 'money', 'investor'].forEach(agent => {
        const statusEl = elements[`status${capitalize(agent)}`];
        const iconEl = statusEl.querySelector('.status-icon');
        iconEl.classList.remove('complete');
        iconEl.classList.add('analyzing');
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
        </svg>
        <span>${message}</span>
    `;

    // Add styles
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideUp 0.3s ease;
    `;

    toast.querySelector('svg').style.cssText = 'width: 20px; height: 20px;';

    document.body.appendChild(toast);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(100px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Card configuration for modal
const cardConfig = {
    market: {
        title: 'Market Analysis',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9M13 17V5M8 17v-3"/>
        </svg>`,
        key: 'market_analysis'
    },
    risk: {
        title: 'Risk Assessment',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v4M12 17h.01"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>`,
        key: 'risk_analysis'
    },
    money: {
        title: 'Monetization Strategy',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v12M9 9h6M9 15h6"/>
        </svg>`,
        key: 'monetization_strategy'
    },
    investor: {
        title: 'Investor Perspective',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>`,
        key: 'investor_view'
    }
};

// Open card modal
function openCardModal(cardType) {
    const config = cardConfig[cardType];
    if (!config || !currentResults) return;

    // Set modal content
    elements.modalIcon.innerHTML = config.icon;
    elements.modalIcon.className = `modal-icon ${cardType}`;
    elements.modalTitle.textContent = config.title;
    elements.modalBody.innerHTML = formatContent(currentResults[config.key] || 'No data available');

    // Show modal
    elements.cardModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close card modal
function closeCardModal() {
    elements.cardModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Export individual card to PDF
function handleExportCardPDF(cardType) {
    if (!currentResults || !currentIdea) {
        showError('No results to export');
        return;
    }

    const config = cardConfig[cardType];
    if (!config) {
        showError('Invalid card type');
        return;
    }

    const content = currentResults[config.key];
    if (!content) {
        showError('No content available for this section');
        return;
    }

    // Generate individual card PDF
    const pdfContent = generateCardPDFContent(cardType, config, content);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function () {
        printWindow.print();
    };
}

// Generate individual card PDF HTML content
function generateCardPDFContent(cardType, config, content) {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const colorMap = {
        market: { bg: '#22d3ee', emoji: '📊' },
        risk: { bg: '#f59e0b', emoji: '⚠️' },
        money: { bg: '#10b981', emoji: '💰' },
        investor: { bg: '#8b5cf6', emoji: '👤' }
    };

    const colors = colorMap[cardType] || { bg: '#6366f1', emoji: '📄' };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${config.title} - ${escapeHtml(currentIdea.substring(0, 50))}...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid ${colors.bg};
        }
        .header h1 {
            color: ${colors.bg};
            font-size: 28px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .header .date {
            color: #666;
            font-size: 14px;
        }
        .idea-box {
            background: #f8f9fa;
            border-left: 4px solid ${colors.bg};
            padding: 20px;
            margin-bottom: 30px;
            font-style: italic;
        }
        .idea-box h2 {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .idea-box p {
            font-size: 16px;
            color: #333;
        }
        .content {
            font-size: 15px;
            line-height: 1.8;
            color: #444;
        }
        .content strong { color: #333; }
        .content ul { margin: 10px 0; padding-left: 24px; }
        .content li { margin-bottom: 8px; }
        .content h1, .content h2, .content h3 {
            color: #333;
            margin: 20px 0 12px 0;
        }
        .content h1 { font-size: 20px; border-bottom: 2px solid ${colors.bg}; padding-bottom: 8px; }
        .content h2 { font-size: 18px; }
        .content h3 { font-size: 16px; }
        .content p { margin-bottom: 12px; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${colors.emoji} ${config.title}</h1>
        <div class="date">Generated on ${date}</div>
    </div>

    <div class="idea-box">
        <h2>Startup Idea</h2>
        <p>${escapeHtml(currentIdea)}</p>
    </div>

    <div class="content">
        ${formatContent(content)}
    </div>

    <div class="footer">
        <p>Generated by AI Startup Validator | Powered by Google Gemini AI</p>
    </div>
</body>
</html>
    `;
}

// Export PDF function
function handleExportPDF() {
    if (!currentResults || !currentIdea) {
        showError('No results to export');
        return;
    }

    // Create PDF content
    const pdfContent = generatePDFContent();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function () {
        printWindow.print();
    };
}

// Generate PDF HTML content
function generatePDFContent() {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Startup Validation Report - ${escapeHtml(currentIdea.substring(0, 50))}...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #6366f1;
        }
        .header h1 {
            color: #6366f1;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header .date {
            color: #666;
            font-size: 14px;
        }
        .idea-box {
            background: #f8f9fa;
            border-left: 4px solid #6366f1;
            padding: 20px;
            margin-bottom: 30px;
            font-style: italic;
        }
        .idea-box h2 {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .idea-box p {
            font-size: 16px;
            color: #333;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        .section-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
        }
        .section-icon.market { background: #22d3ee; }
        .section-icon.risk { background: #f59e0b; }
        .section-icon.money { background: #10b981; }
        .section-icon.investor { background: #8b5cf6; }
        .section-header h3 {
            font-size: 18px;
            color: #333;
        }
        .section-content {
            color: #555;
            font-size: 14px;
        }
        .section-content strong { color: #333; }
        .section-content ul { margin: 10px 0; padding-left: 24px; }
        .section-content li { margin-bottom: 6px; }
        .section-content h1, .section-content h2, .section-content h3 {
            color: #333;
            margin: 15px 0 10px 0;
        }
        .section-content h1 { font-size: 18px; }
        .section-content h2 { font-size: 16px; }
        .section-content h3 { font-size: 14px; }
        .section-content p { margin-bottom: 10px; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Startup Validation Report</h1>
        <div class="date">Generated on ${date}</div>
    </div>

    <div class="idea-box">
        <h2>Startup Idea</h2>
        <p>${escapeHtml(currentIdea)}</p>
    </div>

    <div class="section">
        <div class="section-header">
            <div class="section-icon market">📊</div>
            <h3>Market Analysis</h3>
        </div>
        <div class="section-content">
            ${formatContent(currentResults.market_analysis || 'No data available')}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <div class="section-icon risk">⚠️</div>
            <h3>Risk Assessment</h3>
        </div>
        <div class="section-content">
            ${formatContent(currentResults.risk_analysis || 'No data available')}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <div class="section-icon money">💰</div>
            <h3>Monetization Strategy</h3>
        </div>
        <div class="section-content">
            ${formatContent(currentResults.monetization_strategy || 'No data available')}
        </div>
    </div>

    <div class="section">
        <div class="section-header">
            <div class="section-icon investor">👤</div>
            <h3>Investor Perspective</h3>
        </div>
        <div class="section-content">
            ${formatContent(currentResults.investor_view || 'No data available')}
        </div>
    </div>

    <div class="footer">
        <p>Generated by AI Startup Validator | Powered by Google Gemini AI</p>
    </div>
</body>
</html>
    `;
}

// Escape HTML for safe insertion
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// HISTORY FUNCTIONALITY (LocalStorage)
// ============================================

// Setup history panel
function setupHistory() {
    // Open history panel
    if (elements.historyBtn) {
        elements.historyBtn.addEventListener('click', openHistoryPanel);
    }

    // Close history panel
    if (elements.historyClose) {
        elements.historyClose.addEventListener('click', closeHistoryPanel);
    }

    // Close on overlay click
    if (elements.historyOverlay) {
        elements.historyOverlay.addEventListener('click', closeHistoryPanel);
    }

    // Clear all history
    if (elements.historyClearBtn) {
        elements.historyClearBtn.addEventListener('click', clearAllHistory);
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.historyPanel.classList.contains('active')) {
            closeHistoryPanel();
        }
    });
}

// Open history panel
function openHistoryPanel() {
    renderHistoryItems();
    elements.historyPanel.classList.add('active');
    elements.historyOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close history panel
function closeHistoryPanel() {
    elements.historyPanel.classList.remove('active');
    elements.historyOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Get history from localStorage
function getHistory() {
    try {
        const history = localStorage.getItem(HISTORY_STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.error('Error reading history:', e);
        return [];
    }
}

// Save history to localStorage
function saveHistory(history) {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Error saving history:', e);
    }
}

// Add new validation to history
function addToHistory(idea, results) {
    const history = getHistory();
    const newEntry = {
        id: Date.now().toString(),
        idea: idea,
        results: results,
        timestamp: new Date().toISOString()
    };

    // Add to beginning of array (newest first)
    history.unshift(newEntry);

    // Keep only last 50 entries to prevent storage overflow
    if (history.length > 50) {
        history.pop();
    }

    saveHistory(history);
}

// Delete single history item
function deleteHistoryItem(id) {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    saveHistory(filtered);
    renderHistoryItems();
}

// Clear all history
function clearAllHistory() {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
        renderHistoryItems();
    }
}

// Format date for display
function formatHistoryDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// Render history items in panel
function renderHistoryItems() {
    const history = getHistory();

    if (history.length === 0) {
        elements.historyContent.innerHTML = `
            <div class="history-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>No validation history yet.<br>Your saved ideas will appear here.</p>
            </div>
        `;
        return;
    }

    elements.historyContent.innerHTML = history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-item-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${formatHistoryDate(item.timestamp)}
            </div>
            <div class="history-item-idea">${escapeHtml(item.idea)}</div>
            <div class="history-item-actions">
                <button class="history-item-btn view" data-id="${item.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                </button>
                <button class="history-item-btn delete" data-id="${item.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners to buttons
    document.querySelectorAll('.history-item-btn.view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            viewHistoryItem(id);
        });
    });

    document.querySelectorAll('.history-item-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            deleteHistoryItem(id);
        });
    });

    // Click on item to view
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            viewHistoryItem(id);
        });
    });
}

// View a history item
function viewHistoryItem(id) {
    const history = getHistory();
    const item = history.find(h => h.id === id);

    if (!item) return;

    // Close history panel
    closeHistoryPanel();

    // Set current state
    currentIdea = item.idea;
    currentResults = item.results;

    // Display results with fromHistory flag to prevent re-adding
    displayResults(item.idea, { results: item.results, fromHistory: true });
}

// Modify displayResults to save to history (we need to hook into this)
const originalDisplayResults = displayResults;
displayResults = function (idea, data) {
    // Call original function
    originalDisplayResults(idea, data);

    // Save to history (only if it's a new validation, not from history view)
    if (data.results && !data.fromHistory) {
        addToHistory(idea, data.results);
    }
};
