import React, { useState, useEffect, useRef } from 'react';

// Common Tamil static dictionary for offline fallback suggestions
const BUILT_IN_DICT = {
    // Occasions / Terms
    "moi": "மொய்",
    "panam": "பணம்",
    "pon": "பொன்",
    "kalyanam": "கல்யாணம்",
    "marriage": "திருமணம்",
    "kadukuthu": "காதுகுத்து",
    "kovil": "கோவில்",
    "oor": "ஊர்",
    "nalla": "நல்ல",
    "anbu": "அன்பு",
    "arun": "அருண்",
    "selvam": "செல்வம்",
    "selvi": "செல்வி",
    "kumar": "குமார்",
    "kumaran": "குமரன்",
    "murugan": "முருகன்",
    "raja": "ராஜா",
    "devi": "தேவி",
    "ramesh": "ரமேஷ்",
    "suresh": "சுரேஷ்",
    "ganesh": "கணேஷ்",
    "mani": "மணி",
    "velu": "வேலு",
    "palani": "பழனி",
    "subra": "சுப்பிரமணியன்",
    "lakshmi": "லட்சுமி",
    "radha": "ராதா",
    "meena": "மீனா",
    "madurai": "மதுரை",
    "trichy": "திருச்சி",
    "chennai": "சென்னை",
    "kovai": "கோவை",
    "salem": "சேலம்",
    "karur": "கரூர்",
    "dindigul": "திண்டுக்கல்",
    "thanjavur": "தஞ்சாவூர்",
    "nellai": "நெல்லை",
    "siva": "சிவா",
    "kala": "கலா",
    "chitra": "சித்ரா",
    "geetha": "கீதா",
    "revathi": "ரேவதி",
    "banu": "பானு",
    "vijay": "விஜய்",
    "ajith": "அஜித்",
    "surya": "சூர்யா",
    "vijayan": "விஜயன்",
    "kannan": "கண்ணன்",
    "sekar": "சேகர்",
    "ravi": "ரவி",
    "gopal": "கோபால்",
    "balu": "பாலு",
    "vasu": "வாசு",
};

// Syllable-based English to Tamil phonetic mapping for offline translation fallback
const offlinePhoneticTranslate = (englishWord) => {
    if (!englishWord) return "";
    let text = englishWord.toLowerCase();

    const vowelMap = {
        'aa': 'ஆ', 'ee': 'ஈ', 'oo': 'ஊ', 'ai': 'ஐ', 'au': 'ஔ',
        'a': 'அ', 'e': 'எ', 'i': 'இ', 'o': 'ஒ', 'u': 'உ'
    };

    const mappings = [
        { eng: 'ccha', tam: 'ச்ச' },
        { eng: 'cha', tam: 'ச' },
        { eng: 'tha', tam: 'த' },
        { eng: 'dha', tam: 'த' },
        { eng: 'gha', tam: 'க' },
        { eng: 'kha', tam: 'க' },
        { eng: 'pha', tam: 'ப' },
        { eng: 'bha', tam: 'ப' },
        { eng: 'sha', tam: 'ஷ' },
        { eng: 'zha', tam: 'ழ' },
        { eng: 'kka', tam: 'க்க' },
        { eng: 'ppa', tam: 'ப்ப' },
        { eng: 'tta', tam: 'ட்ட' },
        { eng: 'nna', tam: 'ண்ண' },
        { eng: 'lla', tam: 'ள்ள' },
        
        { eng: 'ka', tam: 'க' }, { eng: 'ki', tam: 'கி' }, { eng: 'ku', tam: 'கு' }, { eng: 'ke', tam: 'கெ' }, { eng: 'ko', tam: 'கொ' },
        { eng: 'ga', tam: 'க' }, { eng: 'gi', tam: 'கி' }, { eng: 'gu', tam: 'கு' }, { eng: 'ge', tam: 'கெ' }, { eng: 'go', tam: 'கொ' },
        { eng: 'ca', tam: 'ச' }, { eng: 'ci', tam: 'சி' }, { eng: 'cu', tam: 'சு' }, { eng: 'ce', tam: 'செ' }, { eng: 'co', tam: 'சொ' },
        { eng: 'sa', tam: 'ச' }, { eng: 'si', tam: 'சி' }, { eng: 'su', tam: 'சு' }, { eng: 'se', tam: 'செ' }, { eng: 'so', tam: 'சொ' },
        { eng: 'ta', tam: 'த' }, { eng: 'ti', tam: 'தி' }, { eng: 'tu', tam: 'து' }, { eng: 'te', tam: 'தெ' }, { eng: 'to', tam: 'தொ' },
        { eng: 'da', tam: 'ட' }, { eng: 'di', tam: 'டி' }, { eng: 'du', tam: 'டு' }, { eng: 'de', tam: 'டெ' }, { eng: 'do', tam: 'டொ' },
        { eng: 'pa', tam: 'ப' }, { eng: 'pi', tam: 'பி' }, { eng: 'pu', tam: 'பு' }, { eng: 'pe', tam: 'பெ' }, { eng: 'po', tam: 'பொ' },
        { eng: 'ba', tam: 'ப' }, { eng: 'bi', tam: 'பி' }, { eng: 'bu', tam: 'பு' }, { eng: 'be', tam: 'பெ' }, { eng: 'bo', tam: 'பொ' },
        { eng: 'ma', tam: 'ம' }, { eng: 'mi', tam: 'மி' }, { eng: 'mu', tam: 'மு' }, { eng: 'me', tam: 'மெ' }, { eng: 'mo', tam: 'மொ' },
        { eng: 'na', tam: 'ந' }, { eng: 'ni', tam: 'நி' }, { eng: 'nu', tam: 'நு' }, { eng: 'ne', tam: 'நெ' }, { eng: 'no', tam: 'நொ' },
        { eng: 'ya', tam: 'ய' }, { eng: 'yi', tam: 'யி' }, { eng: 'yu', tam: 'யு' }, { eng: 'ye', tam: 'யெ' }, { eng: 'yo', tam: 'யொ' },
        { eng: 'ra', tam: 'ர' }, { eng: 'ri', tam: 'ரி' }, { eng: 'ru', tam: 'ரு' }, { eng: 're', tam: 'ரெ' }, { eng: 'ro', tam: 'ரொ' },
        { eng: 'la', tam: 'ல' }, { eng: 'li', tam: 'லி' }, { eng: 'lu', tam: 'லு' }, { eng: 'le', tam: 'லெ' }, { eng: 'lo', tam: 'லொ' },
        { eng: 'va', tam: 'வ' }, { eng: 'vi', tam: 'வி' }, { eng: 'vu', tam: 'வு' }, { eng: 've', tam: 'வெ' }, { eng: 'vo', tam: 'வொ' },
        { eng: 'wa', tam: 'வ' }, { eng: 'wi', tam: 'வி' }, { eng: 'wu', tam: 'வு' }, { eng: 'we', tam: 'வெ' }, { eng: 'wo', tam: 'வொ' },

        { eng: 'k', tam: 'க்' }, { eng: 'g', tam: 'க்' }, { eng: 'c', tam: 'ச்' }, { eng: 's', tam: 'ஸ்' }, { eng: 'j', tam: 'ஜ்' },
        { eng: 't', tam: 'த்' }, { eng: 'd', tam: 'ட்' }, { eng: 'p', tam: 'ப்' }, { eng: 'b', tam: 'ப்' }, { eng: 'm', tam: 'ம்' },
        { eng: 'n', tam: 'ன்' }, { eng: 'y', tam: 'ய்' }, { eng: 'r', tam: 'ர்' }, { eng: 'l', tam: 'ல்' }, { eng: 'v', tam: 'வ்' },
        { eng: 'w', tam: 'வ்' }, { eng: 'h', tam: 'ஹ்' }
    ];

    let res = text;
    // Extract starting vowel
    for (const [eng, tam] of Object.entries(vowelMap)) {
        if (res.startsWith(eng)) {
            res = tam + res.substring(eng.length);
            break;
        }
    }

    // Replace other syllables in order
    for (const rule of mappings) {
        res = res.replace(new RegExp(rule.eng, 'g'), rule.tam);
    }
    
    // Clean up overlapping consonant vowel marks
    res = res
        .replace(/க்ா/g, 'கா').replace(/க்ி/g, 'கி').replace(/க்ீ/g, 'கீ').replace(/க்ு/g, 'கு').replace(/க்ூ/g, 'கூ').replace(/க்ெ/g, 'கெ').replace(/க்ே/g, 'கே').replace(/க்ை/g, 'கை').replace(/க்ொ/g, 'கொ').replace(/க்ோ/g, 'கோ').replace(/க்ௌ/g, 'கௌ')
        .replace(/ச்ா/g, 'சா').replace(/ச்ி/g, 'சி').replace(/ச்ீ/g, 'சீ').replace(/ச்ு/g, 'சு').replace(/ச்ூ/g, 'சூ').replace(/ச்ெ/g, 'செ').replace(/ச்ே/g, 'சே').replace(/ச்ை/g, 'சை').replace(/ச்ொ/g, 'சொ').replace(/ச்ோ/g, 'சோ').replace(/ச்ௌ/g, 'சௌ')
        .replace(/த்ா/g, 'தா').replace(/த்ி/g, 'தி').replace(/த்ீ/g, 'தீ').replace(/த்ு/g, 'து').replace(/த்ூ/g, 'தூ').replace(/த்ெ/g, 'தெ').replace(/த்ே/g, 'தே').replace(/த்ை/g, 'தை').replace(/த்ொ/g, 'தொ').replace(/த்ோ/g, 'தோ').replace(/த்ௌ/g, 'தௌ')
        .replace(/ட்ா/g, 'டா').replace(/ட்ி/g, 'டி').replace(/ட்ீ/g, 'டீ').replace(/ட்ு/g, 'டு').replace(/ட்ூ/g, 'டூ').replace(/ட்ெ/g, 'டெ').replace(/ட்ே/g, 'டே').replace(/ட்ை/g, 'டை').replace(/ட்ொ/g, 'டொ').replace(/ட்ோ/g, 'டோ').replace(/ட்ௌ/g, 'டௌ')
        .replace(/ப்ா/g, 'பா').replace(/ப்ி/g, 'பி').replace(/ப்ீ/g, 'பீ').replace(/ப்ு/g, 'பு').replace(/ப்ூ/g, 'பூ').replace(/ப்ெ/g, 'பெ').replace(/ப்ே/g, 'பே').replace(/ப்ை/g, 'பை').replace(/ப்ொ/g, 'பொ').replace(/ப்ோ/g, 'போ').replace(/ப்ௌ/g, 'பௌ')
        .replace(/ம்ா/g, 'மா').replace(/ம்ி/g, 'மி').replace(/ம்ீ/g, 'மீ').replace(/ம்ு/g, 'மு').replace(/ம்ூ/g, 'மூ').replace(/ம்ெ/g, 'மெ').replace(/ம்ே/g, 'மே').replace(/ம்ை/g, 'மை').replace(/ம்ொ/g, 'மொ').replace(/ம்ோ/g, 'மோ').replace(/ம்ௌ/g, 'மௌ')
        .replace(/ன்ா/g, 'னா').replace(/ன்ி/g, 'னி').replace(/ன்ீ/g, 'னீ').replace(/ன்ு/g, 'னு').replace(/ன்ூ/g, 'னூ').replace(/ன்ெ/g, 'னெ').replace(/ன்ே/g, 'னே').replace(/ன்ை/g, 'னை').replace(/ன்ொ/g, 'னொ').replace(/ன்ோ/g, 'னோ').replace(/ன்ௌ/g, 'னௌ')
        .replace(/ல்ா/g, 'லா').replace(/ல்ி/g, 'லி').replace(/ல்ீ/g, 'லீ').replace(/ல்ு/g, 'லு').replace(/ல்ூ/g, 'லூ').replace(/ல்ெ/g, 'லெ').replace(/ல்ே/g, 'லே').replace(/ல்ை/g, 'லை').replace(/ல்ொ/g, 'லொ').replace(/ல்ோ/g, 'லோ').replace(/ல்ௌ/g, 'லௌ')
        .replace(/வ்ா/g, 'வா').replace(/வ்ி/g, 'வி').replace(/வ்ீ/g, 'வீ').replace(/வ்ு/g, 'வு').replace(/வ்ூ/g, 'வூ').replace(/வ்ெ/g, 'வெ').replace(/வ்ே/g, 'வே').replace(/வ்ை/g, 'வை').replace(/வ்ொ/g, 'வொ').replace(/வ்ோ/g, 'வோ').replace(/வ்ௌ/g, 'வௌ')
        .replace(/ர்ா/g, 'ரா').replace(/ர்ி/g, 'ரி').replace(/ர்ீ/g, 'ரீ').replace(/ர்ு/g, 'ரு').replace(/ர்ூ/g, 'ரூ').replace(/ர்ெ/g, 'ரெ').replace(/ர்ே/g, 'ரே').replace(/ர்ை/g, 'ரை').replace(/ர்ொ/g, 'ரொ').replace(/ர்ோ/g, 'ரோ').replace(/ர்ௌ/g, 'ரௌ')
        .replace(/ய்ா/g, 'யா').replace(/ய்ி/g, 'யி').replace(/ய்ீ/g, 'யீ').replace(/ய்ு/g, 'யு').replace(/ய்ூ/g, 'யூ').replace(/ய்ெ/g, 'யெ').replace(/ய்ே/g, 'யே').replace(/ய்ை/g, 'யை').replace(/ய்ொ/g, 'யொ').replace(/ய்ோ/g, 'யோ').replace(/ய்ௌ/g, 'யௌ')
        .replace(/ஹ்ா/g, 'ஹா').replace(/ஹ்ி/g, 'ஹி').replace(/ஹ்ீ/g, 'ஹீ').replace(/ஹ்ு/g, 'ஹு').replace(/ஹ்ூ/g, 'ஹூ').replace(/ஹ்ெ/g, 'ஹெ').replace(/ஹ்ே/g, 'ஹே').replace(/ஹ்ை/g, 'ஹை').replace(/ஹ்ொ/g, 'ஹொ').replace(/ஹ்ோ/g, 'ஹோ').replace(/ஹ்ௌ/g, 'ஹௌ')
        .replace(/ஷ்ா/g, 'ஷா').replace(/ஷ்ி/g, 'ஷி').replace(/ஷ்ீ/g, 'ஷீ').replace(/ஷ்ு/g, 'ஷு').replace(/ஷ்ூ/g, 'ஷூ').replace(/ஷ்ெ/g, 'ஷெ').replace(/ஷ்ே/g, 'ஷே').replace(/ஷ்ை/g, 'ஷை').replace(/ஷ்ொ/g, 'ஷொ').replace(/ஷ்ோ/g, 'ஷோ').replace(/ஷ்ௌ/g, 'ஷௌ')
        .replace(/ஜ்ா/g, 'ஜா').replace(/ஜ்ி/g, 'ஜி').replace(/ஜ்ீ/g, 'ஜீ').replace(/ஜ்ு/g, 'ஜு').replace(/ஜ்ூ/g, 'ஜூ').replace(/ஜ்ெ/g, 'ஜெ').replace(/ஜ்ே/g, 'ஜே').replace(/ஜ்ை/g, 'ஜை').replace(/ஜ்ொ/g, 'ஜொ').replace(/ஜ்ோ/g, 'ஜோ').replace(/ஜ்ௌ/g, 'ஜௌ')
        .replace(/ழ்ா/g, 'ழா').replace(/ழ்ி/g, 'ழி').replace(/ழ்ீ/g, 'ழீ').replace(/ழ்ு/g, 'ழு').replace(/ழ்ூ/g, 'ழூ').replace(/ழ்ெ/g, 'ழெ').replace(/ழ்ே/g, 'ழே').replace(/ழ்ை/g, 'ழை').replace(/ழ்ொ/g, 'ழொ').replace(/ழ்ோ/g, 'ழோ').replace(/ழ்ௌ/g, 'ழௌ')
        .replace(/ஸ்ா/g, 'ஸா').replace(/ஸ்ி/g, 'ஸி').replace(/ஸ்ீ/g, 'ஸீ').replace(/ஸ்ு/g, 'ஸு').replace(/ஸ்ூ/g, 'ஸூ').replace(/ஸ்ெ/g, 'ஸெ').replace(/ஸ்ே/g, 'ஸே').replace(/ஸ்ை/g, 'ஸை').replace(/ஸ்ொ/g, 'ஸொ').replace(/ஸ்ோ/g, 'ஸோ').replace(/ஸ்ௌ/g, 'ஸௌ');

    return res;
};

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

    // Helper to safely read localStorage JSON arrays
    const getCache = (key, defaultValue = []) => {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : defaultValue;
        } catch {
            return defaultValue;
        }
    };

    const setCache = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to set cache', e);
        }
    };

    const fetchSuggestions = async (word) => {
        if (!word || !/^[a-zA-Z]+$/.test(word)) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        const lowercaseWord = word.toLowerCase();

        // 1. Check if we have the EXACT word cached from Google Input Tools previously
        const cachedTranslit = getCache('translit_' + lowercaseWord, null);
        if (cachedTranslit && cachedTranslit.length > 0) {
            setSuggestions(cachedTranslit);
            setSelectedIndex(0);
            setShowDropdown(true);
            return;
        }

        // 2. Try to fetch from Google Input Tools online
        try {
            if (navigator.onLine) {
                const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=ta-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
                const res = await fetch(url);
                const data = await res.json();

                if (data[0] === 'SUCCESS' && data[1]?.[0]?.[1]) {
                    const list = data[1][0][1];
                    setSuggestions(list);
                    setSelectedIndex(0);
                    setShowDropdown(list.length > 0);
                    
                    // Save exact suggestions returned by Google in localStorage
                    setCache('translit_' + lowercaseWord, list);
                    return;
                }
            }
        } catch (e) {
            console.warn('Online transliteration failed, falling back to local dictionaries', e);
        }

        // 3. Offline fallback using dynamically harvested prefixes + static dictionary + phonetic rules
        const localMatches = [];

        // Offline: Generate basic phonetic Tamil guess
        const phoneticGuess = offlinePhoneticTranslate(word);
        if (phoneticGuess) {
            localMatches.push(phoneticGuess);
        }

        // Search sub-word prefixes from previously cached Google Translit keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('translit_')) {
                const cachedEngWord = key.substring('translit_'.length);
                if (cachedEngWord.startsWith(lowercaseWord)) {
                    const recommendations = getCache(key, []);
                    if (recommendations && recommendations[0]) {
                        localMatches.push(recommendations[0]);
                    }
                }
            }
        }

        // Static built-in common Tamil terms prefix matches
        Object.entries(BUILT_IN_DICT).forEach(([eng, tam]) => {
            if (eng.startsWith(lowercaseWord) || eng.includes(lowercaseWord)) {
                localMatches.push(tam);
            }
        });

        // Harvest previously typed Tamil names and villages from cache to suggest matches
        const cachedNames = new Set();
        const cachedVillages = new Set();

        // Received Transactions Cache
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_transactions_event_')) {
                getCache(key).forEach(t => {
                    if (t.contributorName) cachedNames.add(t.contributorName);
                    if (t.village) cachedVillages.add(t.village);
                });
            }
        }

        // Given Moi Cache
        getCache('cache_given_moi').forEach(t => {
            if (t.recipientName) cachedNames.add(t.recipientName);
            if (t.village) cachedVillages.add(t.village);
        });

        // Villages list cache
        getCache('cache_villages').forEach(v => {
            if (v) cachedVillages.add(v);
        });

        // If user typed some letters, do a Tamil prefix match using our phonetic guess
        if (phoneticGuess) {
            cachedNames.forEach(name => {
                if (name.startsWith(phoneticGuess) || name.includes(phoneticGuess)) {
                    localMatches.push(name);
                }
            });
            cachedVillages.forEach(vil => {
                if (vil.startsWith(phoneticGuess) || vil.includes(phoneticGuess)) {
                    localMatches.push(vil);
                }
            });
        }

        // Deduplicate and slice to maximum 5 suggestions
        const finalSuggestions = Array.from(new Set(localMatches)).slice(0, 5);

        if (finalSuggestions.length > 0) {
            setSuggestions(finalSuggestions);
            setSelectedIndex(0);
            setShowDropdown(true);
        } else {
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
