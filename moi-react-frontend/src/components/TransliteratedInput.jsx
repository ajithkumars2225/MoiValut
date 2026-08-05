import React, { useState, useEffect, useRef } from 'react';

export const TransliteratedInput = ({
    value,
    onChange,
    placeholder,
    className = '',
    id,
    required = false,
    isTextArea = false,
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (word) => {
        if (!word || !/^[a-zA-Z]+$/.test(word)) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        try {
            const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=ta-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
            const res = await fetch(url);
            const data = await res.json();

            if (data[0] === 'SUCCESS' && data[1]?.[0]?.[1]) {
                const list = data[1][0][1];
                setSuggestions(list);
                setSelectedIndex(0);
                setShowDropdown(list.length > 0);
            } else {
                setShowDropdown(false);
            }
        } catch {
            setShowDropdown(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(val);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.substring(0, cursorPosition);
        const words = textBeforeCursor.split(/\s/);
        const lastWord = words[words.length - 1];

        fetchSuggestions(lastWord);
    };

    const selectSuggestion = (selectedText) => {
        const words = value.split(/\s/);
        words[words.length - 1] = selectedText;
        const newText = words.join(' ') + ' ';
        onChange(newText);
        setShowDropdown(false);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (suggestions[selectedIndex]) {
                selectSuggestion(suggestions[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const Component = isTextArea ? 'textarea' : 'input';

    return (
        <div className="translite-wrapper" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <Component
                id={id}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                required={required}
                autoComplete="off"
            />

            {showDropdown && suggestions.length > 0 && (
                <div className="translite-dropdown">
                    {suggestions.map((s, idx) => (
                        <div
                            key={idx}
                            className={`translite-item ${idx === selectedIndex ? 'active' : ''}`}
                            onClick={() => selectSuggestion(s)}
                        >
                            <span className="translite-text">{s}</span>
                            {idx === 0 && <span className="translite-badge">Tab/Enter</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
