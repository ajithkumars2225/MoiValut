/**
 * Tamil Transliteration logic using Google Input Tools API
 */

class TransliterationProvider {
    constructor() {
        this.suggestionBox = this.createSuggestionBox();
        this.activeInput = null;
        this.suggestions = [];
        this.selectedIndex = -1;
        this.currentWord = "";
        
        document.body.appendChild(this.suggestionBox);
        
        // Hide box on click outside
        document.addEventListener('click', (e) => {
            if (!this.suggestionBox.contains(e.target) && e.target !== this.activeInput) {
                this.hide();
            }
        });
    }

    createSuggestionBox() {
        const box = document.createElement('div');
        box.className = 'translite-container';
        return box;
    }

    enable(inputIds) {
        inputIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => this.handleInput(e));
                el.addEventListener('keydown', (e) => this.handleKeydown(e));
                el.setAttribute('autocomplete', 'off'); // Prevent browser autocomplete interference
            }
        });
    }

    async handleInput(e) {
        const input = e.target;
        this.activeInput = input;
        
        const cursorPosition = input.selectionStart;
        const textBeforeCursor = input.value.substring(0, cursorPosition);
        
        // Find the word currently being typed
        const words = textBeforeCursor.split(/\s/);
        const lastWord = words[words.length - 1];
        
        if (lastWord.length > 0 && /^[a-zA-Z]+$/.test(lastWord)) {
            this.currentWord = lastWord;
            await this.fetchSuggestions(lastWord);
        } else {
            this.hide();
        }
    }

    handleKeydown(e) {
        if (this.suggestionBox.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
                this.updateActiveSuggestion();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
                this.updateActiveSuggestion();
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (this.selectedIndex > -1) {
                    e.preventDefault();
                    this.selectSuggestion(this.suggestions[this.selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                this.hide();
            }
        }
    }

    async fetchSuggestions(word) {
        try {
            const url = `https://inputtools.google.com/request?text=${word}&itc=ta-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data[0] === 'SUCCESS') {
                this.suggestions = data[1][0][1];
                if (this.suggestions.length > 0) {
                    this.show();
                } else {
                    this.hide();
                }
            }
        } catch (err) {
            console.error("Transliteration fetch failed:", err);
            this.hide();
        }
    }

    show() {
        this.suggestionBox.innerHTML = '';
        this.suggestions.forEach((s, i) => {
            const div = document.createElement('div');
            div.className = 'translite-suggestion';
            div.textContent = s;
            div.onclick = () => this.selectSuggestion(s);
            this.suggestionBox.appendChild(div);
        });
        
        this.selectedIndex = 0; // Default to first suggestion
        this.updateActiveSuggestion();
        
        // Position the box
        const rect = this.activeInput.getBoundingClientRect();
        this.suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
        this.suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        this.suggestionBox.style.width = `${rect.width}px`;
        this.suggestionBox.style.display = 'block';
    }

    hide() {
        this.suggestionBox.style.display = 'none';
        this.suggestions = [];
        this.selectedIndex = -1;
    }

    updateActiveSuggestion() {
        const items = this.suggestionBox.querySelectorAll('.translite-suggestion');
        items.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    selectSuggestion(suggestion) {
        const input = this.activeInput;
        const cursorPosition = input.selectionStart;
        const textValue = input.value;
        
        const textBeforeCursor = textValue.substring(0, cursorPosition);
        const textAfterCursor = textValue.substring(cursorPosition);
        
        const words = textBeforeCursor.split(/\s/);
        words[words.length - 1] = suggestion;
        
        const newTextBefore = words.join(' ');
        input.value = newTextBefore + textAfterCursor;
        
        // Reset cursor position
        const newCursorPos = newTextBefore.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        
        // Notify other listeners
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        this.hide();
        input.focus();
    }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    const translite = new TransliterationProvider();
    translite.enable(['contributorName', 'village', 'eventName', 'eventLocation', 'eventSearch', 'goldContributorName', 'goldVillage']);
});
