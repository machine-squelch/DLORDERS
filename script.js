/**
 * Enhanced Kanban Board with Mobile Support and Improved Drag & Drop
 * Fixes timing issues and adds touch support for mobile devices
 */

class KanbanBoard {
    constructor() {
        this.columns = [
            { id: 0, name: 'readyToPick', title: 'Ready to Pick', items: [] },
            { id: 1, name: 'warehouse', title: 'Warehouse', items: [] },
            { id: 2, name: 'built', title: 'Built', items: [] },
            { id: 3, name: 'carrierBooked', title: 'Carrier Booked', items: [] },
            { id: 4, name: 'readyPickup', title: 'Ready for Pickup', items: [] }
        ];
        
        this.dragState = {
            isDragging: false,
            draggedElement: null,
            draggedFromColumn: null,
            draggedItemId: null,
            placeholder: null,
            touchStartY: 0,
            touchStartX: 0,
            lastTouchY: 0,
            lastTouchX: 0
        };
        
        this.itemIdCounter = 0;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadFromStorage();
            this.setupEventListeners();
            this.render();
            this.hideLoading();
            this.showWelcomeMessage();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Kanban board:', error);
            this.showToast('Failed to load board. Please refresh the page.', 'error');
        }
    }
    
    hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        const appContainer = document.getElementById('app-container');
        
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
            appContainer.style.display = 'block';
            appContainer.style.opacity = '0';
            appContainer.style.transition = 'opacity 0.3s ease';
            
            requestAnimationFrame(() => {
                appContainer.style.opacity = '1';
            });
        }, 500);
    }
    
    showWelcomeMessage() {
        // Welcome popup disabled per user request
        return;
    }
    
    loadSampleData() {
        this.columns[0].items = [
            { id: this.generateId(), text: "Supply Order #AG-1001 - Premium Nutrients", timestamp: Date.now() },
            { id: this.generateId(), text: "Supply Order #AG-1002 - Growing Medium", timestamp: Date.now() },
            { id: this.generateId(), text: "Supply Order #AG-1003 - LED Lighting Systems", timestamp: Date.now() }
        ];
        
        this.columns[1].items = [
            { id: this.generateId(), text: "Supply Order #AG-0998 - Irrigation Equipment", timestamp: Date.now() },
            { id: this.generateId(), text: "Supply Order #AG-0999 - Climate Control Units", timestamp: Date.now() }
        ];
        
        this.columns[2].items = [
            { id: this.generateId(), text: "Supply Order #AG-0995 - Ventilation Systems", timestamp: Date.now() },
            { id: this.generateId(), text: "Supply Order #AG-0996 - pH Testing Kits", timestamp: Date.now() }
        ];
        
        this.columns[3].items = [
            { id: this.generateId(), text: "Supply Order #AG-0993 - Organic Fertilizers", timestamp: Date.now() }
        ];
        
        this.columns[4].items = [
            { id: this.generateId(), text: "Supply Order #AG-0991 - Harvest Equipment", timestamp: Date.now() },
            { id: this.generateId(), text: "Supply Order #AG-0992 - Storage Containers", timestamp: Date.now() }
        ];
        
        this.saveToStorage();
        this.render();
    }
    
    generateId() {
        return ++this.itemIdCounter;
    }
    
    setupEventListeners() {
        // Add item buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-item-btn')) {
                const column = parseInt(e.target.closest('.add-item-btn').dataset.column);
                this.showAddForm(column);
            }
            
            if (e.target.closest('.save-btn')) {
                const column = parseInt(e.target.closest('.save-btn').dataset.column);
                this.saveNewItem(column);
            }
            
            if (e.target.closest('.cancel-btn')) {
                const column = parseInt(e.target.closest('.cancel-btn').dataset.column);
                this.hideAddForm(column);
            }
            
            if (e.target.closest('.clear-btn')) {
                this.clearBoard();
            }
            
            if (e.target.closest('.export-btn')) {
                this.exportData();
            }
            
            if (e.target.closest('.item-delete-btn')) {
                const itemElement = e.target.closest('.kanban-item');
                const itemId = parseInt(itemElement.dataset.itemId);
                const column = parseInt(itemElement.closest('.kanban-column').dataset.column);
                this.deleteItem(column, itemId);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllAddForms();
            }
            
            // Ctrl/Cmd + Enter to save
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeInput = document.activeElement;
                if (activeInput && activeInput.classList.contains('add-item-input')) {
                    const column = parseInt(activeInput.id.split('-')[2]);
                    this.saveNewItem(column);
                }
            }
        });
        
        // Input event listeners
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('add-item-input')) {
                this.autoResizeTextarea(e.target);
            }
            
            if (e.target.classList.contains('kanban-item-text')) {
                this.handleItemEdit(e.target);
            }
        });
        
        // Setup drag and drop with improved timing
        this.setupDragAndDrop();
        
        // Setup touch events for mobile
        this.setupTouchEvents();
        
        // Window resize handler for responsive design
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }
    
    setupDragAndDrop() {
        const board = document.getElementById('kanban-board');
        
        // Use event delegation for better performance
        board.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('kanban-item')) {
                this.handleDragStart(e);
            }
        });
        
        board.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('kanban-item')) {
                this.handleDragEnd(e);
            }
        });
        
        board.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(e);
        });
        
        board.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });
        
        board.addEventListener('dragenter', (e) => {
            e.preventDefault();
            this.handleDragEnter(e);
        });
        
        board.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e);
        });
    }
    
    setupTouchEvents() {
        const board = document.getElementById('kanban-board');
        
        board.addEventListener('touchstart', (e) => {
            if (e.target.closest('.kanban-item')) {
                this.handleTouchStart(e);
            }
        }, { passive: false });
        
        board.addEventListener('touchmove', (e) => {
            if (this.dragState.isDragging) {
                this.handleTouchMove(e);
            }
        }, { passive: false });
        
        board.addEventListener('touchend', (e) => {
            if (this.dragState.isDragging) {
                this.handleTouchEnd(e);
            }
        }, { passive: false });
    }
    
    handleDragStart(e) {
        const item = e.target;
        const column = item.closest('.kanban-column');
        
        this.dragState.isDragging = true;
        this.dragState.draggedElement = item;
        this.dragState.draggedFromColumn = parseInt(column.dataset.column);
        this.dragState.draggedItemId = parseInt(item.dataset.itemId);
        
        // Add dragging class with slight delay to avoid flickering
        setTimeout(() => {
            if (this.dragState.isDragging) {
                item.classList.add('dragging');
                document.body.classList.add('dragging-active');
            }
        }, 50);
        
        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', item.outerHTML);
        
        // Create placeholder
        this.createPlaceholder();
    }
    
    handleDragEnd(e) {
        const item = e.target;
        
        // Clean up drag state
        item.classList.remove('dragging');
        document.body.classList.remove('dragging-active');
        
        // Remove all drop zone indicators
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drag-over', 'drag-target');
        });
        
        // Remove placeholder
        this.removePlaceholder();
        
        // Reset drag state with longer delay to prevent timing issues
        setTimeout(() => {
            this.resetDragState();
        }, 200);
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.dragState.isDragging) return;
        
        const column = e.target.closest('.kanban-column');
        if (!column) return;
        
        // Improved boundary detection - check if we're within the column bounds
        const columnRect = column.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Add some padding to make it easier to drop in columns
        const padding = 20;
        if (mouseX < columnRect.left - padding || 
            mouseX > columnRect.right + padding || 
            mouseY < columnRect.top - padding || 
            mouseY > columnRect.bottom + padding) {
            return;
        }
        
        const itemList = column.querySelector('.item-list');
        const afterElement = this.getDragAfterElement(itemList, mouseY);
        
        if (afterElement == null) {
            itemList.appendChild(this.dragState.placeholder);
        } else {
            itemList.insertBefore(this.dragState.placeholder, afterElement);
        }
    }
    
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const column = e.target.closest('.kanban-column');
        if (column && this.dragState.isDragging) {
            // Remove drag-over from all columns first
            document.querySelectorAll('.kanban-column').forEach(col => {
                col.classList.remove('drag-over');
            });
            column.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e) {
        const column = e.target.closest('.kanban-column');
        if (column) {
            // Only remove drag-over if we're actually leaving the column
            const rect = column.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                column.classList.remove('drag-over');
            }
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const targetColumn = e.target.closest('.kanban-column');
        if (!targetColumn || !this.dragState.isDragging) return;
        
        const targetColumnId = parseInt(targetColumn.dataset.column);
        const sourceColumnId = this.dragState.draggedFromColumn;
        const itemId = this.dragState.draggedItemId;
        
        // Find the item in source column
        const sourceColumn = this.columns[sourceColumnId];
        const itemIndex = sourceColumn.items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return;
        
        const item = sourceColumn.items[itemIndex];
        
        // Remove from source column
        sourceColumn.items.splice(itemIndex, 1);
        
        // Add to target column at the correct position
        const placeholder = this.dragState.placeholder;
        const targetList = targetColumn.querySelector('.item-list');
        const placeholderIndex = Array.from(targetList.children).indexOf(placeholder);
        
        if (placeholderIndex === -1) {
            this.columns[targetColumnId].items.push(item);
        } else {
            this.columns[targetColumnId].items.splice(placeholderIndex, 0, item);
        }
        
        // Update timestamp
        item.timestamp = Date.now();
        
        // Save and re-render
        this.saveToStorage();
        this.render();
        
        // Show success message
        if (sourceColumnId !== targetColumnId) {
            this.showToast(`Order moved to ${this.columns[targetColumnId].title}`, 'success');
        }
        
        // Clean up
        targetColumn.classList.remove('drag-over');
    }
    
    // Touch event handlers for mobile support
    handleTouchStart(e) {
        const item = e.target.closest('.kanban-item');
        if (!item) return;
        
        const touch = e.touches[0];
        this.dragState.touchStartX = touch.clientX;
        this.dragState.touchStartY = touch.clientY;
        this.dragState.lastTouchX = touch.clientX;
        this.dragState.lastTouchY = touch.clientY;
        
        // Start drag after a longer delay to distinguish from scroll and reduce sensitivity
        this.dragState.touchStartTimeout = setTimeout(() => {
            this.startTouchDrag(item, e);
        }, 300);
    }
    
    startTouchDrag(item, e) {
        const column = item.closest('.kanban-column');
        
        this.dragState.isDragging = true;
        this.dragState.draggedElement = item;
        this.dragState.draggedFromColumn = parseInt(column.dataset.column);
        this.dragState.draggedItemId = parseInt(item.dataset.itemId);
        
        item.classList.add('touch-dragging');
        document.body.classList.add('touch-dragging-active');
        
        this.createPlaceholder();
        this.showToast('Drag to move order', 'info', 2000);
        
        // Prevent scrolling while dragging
        document.body.style.overflow = 'hidden';
    }
    
    handleTouchMove(e) {
        if (!this.dragState.isDragging) {
            // Clear timeout if user starts scrolling before drag starts
            clearTimeout(this.dragState.touchStartTimeout);
            return;
        }
        
        e.preventDefault();
        
        const touch = e.touches[0];
        this.dragState.lastTouchX = touch.clientX;
        this.dragState.lastTouchY = touch.clientY;
        
        // Find element under touch point
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetColumn = elementBelow?.closest('.kanban-column');
        
        if (targetColumn) {
            // Remove previous highlights
            document.querySelectorAll('.kanban-column').forEach(col => {
                col.classList.remove('drag-over');
            });
            
            // Check if touch is within column bounds with padding
            const columnRect = targetColumn.getBoundingClientRect();
            const padding = 30; // Larger padding for touch
            
            if (touch.clientX >= columnRect.left - padding && 
                touch.clientX <= columnRect.right + padding &&
                touch.clientY >= columnRect.top - padding && 
                touch.clientY <= columnRect.bottom + padding) {
                
                targetColumn.classList.add('drag-over');
                
                // Position placeholder
                const itemList = targetColumn.querySelector('.item-list');
                const afterElement = this.getDragAfterElement(itemList, touch.clientY);
                
                if (afterElement == null) {
                    itemList.appendChild(this.dragState.placeholder);
                } else {
                    itemList.insertBefore(this.dragState.placeholder, afterElement);
                }
            }
        }
    }
    
    handleTouchEnd(e) {
        clearTimeout(this.dragState.touchStartTimeout);
        
        if (!this.dragState.isDragging) return;
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetColumn = elementBelow?.closest('.kanban-column');
        
        if (targetColumn) {
            // Check if touch ended within valid drop zone
            const columnRect = targetColumn.getBoundingClientRect();
            const padding = 30;
            
            if (touch.clientX >= columnRect.left - padding && 
                touch.clientX <= columnRect.right + padding &&
                touch.clientY >= columnRect.top - padding && 
                touch.clientY <= columnRect.bottom + padding) {
                
                // Simulate drop
                const fakeDropEvent = {
                    preventDefault: () => {},
                    target: targetColumn
                };
                this.handleDrop(fakeDropEvent);
            }
        }
        
        // Clean up touch drag state
        this.dragState.draggedElement?.classList.remove('touch-dragging');
        document.body.classList.remove('touch-dragging-active');
        document.body.style.overflow = '';
        
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drag-over');
        });
        
        this.removePlaceholder();
        
        setTimeout(() => {
            this.resetDragState();
        }, 200);
    }
    
    createPlaceholder() {
        if (this.dragState.placeholder) return;
        
        this.dragState.placeholder = document.createElement('li');
        this.dragState.placeholder.className = 'kanban-item placeholder';
        this.dragState.placeholder.innerHTML = '<div class="placeholder-content">Drop here</div>';
    }
    
    removePlaceholder() {
        if (this.dragState.placeholder && this.dragState.placeholder.parentNode) {
            this.dragState.placeholder.parentNode.removeChild(this.dragState.placeholder);
        }
        this.dragState.placeholder = null;
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.kanban-item:not(.dragging):not(.placeholder)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    resetDragState() {
        this.dragState.isDragging = false;
        this.dragState.draggedElement = null;
        this.dragState.draggedFromColumn = null;
        this.dragState.draggedItemId = null;
        this.dragState.placeholder = null;
    }
    
    showAddForm(columnId) {
        this.hideAllAddForms();
        
        const form = document.getElementById(`add-form-${columnId}`);
        const input = document.getElementById(`add-input-${columnId}`);
        const button = document.querySelector(`[data-column="${columnId}"].add-item-btn`);
        
        form.style.display = 'block';
        button.style.display = 'none';
        
        setTimeout(() => {
            input.focus();
            this.autoResizeTextarea(input);
        }, 100);
    }
    
    hideAddForm(columnId) {
        const form = document.getElementById(`add-form-${columnId}`);
        const input = document.getElementById(`add-input-${columnId}`);
        const button = document.querySelector(`[data-column="${columnId}"].add-item-btn`);
        
        form.style.display = 'none';
        button.style.display = 'flex';
        input.value = '';
        this.autoResizeTextarea(input);
    }
    
    hideAllAddForms() {
        for (let i = 0; i < this.columns.length; i++) {
            this.hideAddForm(i);
        }
    }
    
    saveNewItem(columnId) {
        const input = document.getElementById(`add-input-${columnId}`);
        const text = input.value.trim();
        
        if (!text) {
            this.showToast('Please enter order details', 'warning');
            input.focus();
            return;
        }
        
        const newItem = {
            id: this.generateId(),
            text: text,
            timestamp: Date.now()
        };
        
        this.columns[columnId].items.push(newItem);
        this.saveToStorage();
        this.render();
        this.hideAddForm(columnId);
        
        this.showToast('Order added successfully', 'success');
    }
    
    deleteItem(columnId, itemId) {
        const column = this.columns[columnId];
        const itemIndex = column.items.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
            column.items.splice(itemIndex, 1);
            this.saveToStorage();
            this.render();
            this.showToast('Order deleted', 'success');
        }
    }
    
    handleItemEdit(element) {
        const item = element.closest('.kanban-item');
        const column = item.closest('.kanban-column');
        const columnId = parseInt(column.dataset.column);
        const itemId = parseInt(item.dataset.itemId);
        
        const columnData = this.columns[columnId];
        const itemData = columnData.items.find(item => item.id === itemId);
        
        if (itemData) {
            itemData.text = element.textContent.trim();
            itemData.timestamp = Date.now();
            
            // Debounced save
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveToStorage();
            }, 1000);
        }
    }
    
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    clearBoard() {
        if (!confirm('Are you sure you want to clear all orders? This action cannot be undone.')) return;
        
        this.columns.forEach(column => {
            column.items = [];
        });
        
        this.saveToStorage();
        this.render();
        this.showToast('Board cleared', 'success');
    }
    
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            columns: this.columns.map(col => ({
                name: col.title,
                items: col.items.map(item => ({
                    text: item.text,
                    timestamp: new Date(item.timestamp).toISOString()
                }))
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanban-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
    }
    
    render() {
        this.columns.forEach((column, index) => {
            this.renderColumn(index);
        });
    }
    
    renderColumn(columnId) {
        const column = this.columns[columnId];
        const itemList = document.getElementById(`item-list-${columnId}`);
        const countElement = document.getElementById(`count-${columnId}`);
        
        // Update count
        countElement.textContent = column.items.length;
        
        // Clear and rebuild items
        itemList.innerHTML = '';
        
        column.items.forEach(item => {
            const itemElement = this.createItemElement(item, columnId);
            itemList.appendChild(itemElement);
        });
        
        // Update column height
        this.updateColumnHeight(columnId);
    }
    
    createItemElement(item, columnId) {
        const li = document.createElement('li');
        li.className = 'kanban-item';
        li.draggable = true;
        li.dataset.itemId = item.id;
        li.setAttribute('role', 'listitem');
        li.setAttribute('tabindex', '0');
        
        const timeAgo = this.getTimeAgo(item.timestamp);
        
        li.innerHTML = `
            <div class="item-content">
                <button class="item-delete-btn windows-style" aria-label="Delete order" title="Delete order">
                    <span class="delete-icon">×</span>
                </button>
                <div class="item-text kanban-item-text" contenteditable="true" role="textbox" aria-label="Edit order details">${this.escapeHtml(item.text)}</div>
                <div class="item-meta">
                    <span class="item-time" title="${new Date(item.timestamp).toLocaleString()}">${timeAgo}</span>
                </div>
            </div>
        `;
        
        return li;
    }
    
    updateColumnHeight(columnId) {
        const column = document.querySelector(`[data-column="${columnId}"]`);
        const content = column.querySelector('.column-content');
        
        // Calculate available height
        const header = column.querySelector('.column-header');
        const footer = column.querySelector('.column-footer');
        const headerHeight = header.offsetHeight;
        const footerHeight = footer.offsetHeight;
        const columnHeight = column.offsetHeight;
        
        const availableHeight = columnHeight - headerHeight - footerHeight - 20; // 20px for padding
        content.style.height = `${Math.max(availableHeight, 200)}px`;
    }
    
    handleResize() {
        // Update column heights on resize
        this.columns.forEach((_, index) => {
            this.updateColumnHeight(index);
        });
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
        
        // Limit number of toasts
        const toasts = container.querySelectorAll('.toast');
        if (toasts.length > 3) {
            toasts[0].remove();
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    saveToStorage() {
        try {
            const data = {
                columns: this.columns,
                itemIdCounter: this.itemIdCounter,
                lastSaved: Date.now()
            };
            localStorage.setItem('kanban_enhanced_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            this.showToast('Failed to save data', 'error');
        }
    }
    
    async loadFromStorage() {
        try {
            const saved = localStorage.getItem('kanban_enhanced_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.columns = data.columns || this.columns;
                this.itemIdCounter = data.itemIdCounter || 0;
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.showToast('Failed to load saved data', 'warning');
        }
    }
}

// Initialize the Kanban board when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.kanbanBoard = new KanbanBoard();
});

// Handle page visibility changes to save data
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && window.kanbanBoard) {
        window.kanbanBoard.saveToStorage();
    }
});

// Handle beforeunload to save data
window.addEventListener('beforeunload', () => {
    if (window.kanbanBoard) {
        window.kanbanBoard.saveToStorage();
    }
});

