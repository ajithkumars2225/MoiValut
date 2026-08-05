import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, X, AlertCircle, CheckCircle2, Play } from 'lucide-react';
import { offlinePhoneticTranslate, BUILT_IN_DICT } from '../TransliteratedInput';

const INITIALS_MAP = {
    'a': 'ஆ', 'aa': 'ஆ', 'b': 'பி', 'c': 'சி', 'd': 'டி', 'e': 'இ',
    'f': 'எப்', 'g': 'ஜி', 'h': 'ஹெச்', 'i': 'ஐ', 'j': 'ஜே', 'k': 'கே',
    'l': 'எல்', 'm': 'எம்', 'n': 'என்', 'o': 'ஓ', 'p': 'பி', 'q': 'கியூ',
    'r': 'ஆர்', 's': 'எஸ்', 't': 'டி', 'u': 'யு', 'v': 'வி', 'w': 'டபிள்யூ',
    'x': 'எக்ஸ்', 'y': 'ஒய்', 'z': 'இசட்', 'vai': 'வை'
};

const VILLAGE_SUFFIXES = {
    'pattu': 'பட்டு',
    'patti': 'பட்டி',
    'patty': 'பட்டி',
    'kadu': 'காடு',
    'gadu': 'காடு',
    'gaadu': 'காடு',
    'viduthi': 'விடுதி',
    'viduthy': 'விடுதி',
    'viditi': 'விடுதி',
    'vdthy': 'விடுதி',
    'pudur': 'புதூர்',
    'puthur': 'புதூர்',
    'oor': 'ஊர்',
    'ur': 'ஊர்',
    'mangalam': 'மங்கலம்',
    'palayam': 'பாளையம்',
    'kudi': 'குடி',
    'kulam': 'குளம்',
    'kovil': 'கோவில்',
    'koil': 'கோவில்',
    'neri': 'நேரி',
    'eri': 'ஏரி',
    'malai': 'மலை',
    'kottai': 'கோட்டை',
    'kotty': 'கோட்டை',
    'koval': 'கோவில்',
    'puram': 'புரம்',
    'kutti': 'குட்டி',
    'kuty': 'குட்டி',
    'ppty': 'ப்பட்டி',
    'ptty': 'ப்பட்டி'
};

const translateFullNameToTamil = (fullName) => {
    if (!fullName) return "";
    
    // Only translate if it contains English letters
    if (!/[a-zA-Z]/.test(fullName)) {
        return fullName;
    }

    // Check exact match in static dictionary first (e.g. multi-word villages like "keela mettuppatty")
    const normalizedFull = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (BUILT_IN_DICT[normalizedFull]) {
        return BUILT_IN_DICT[normalizedFull];
    }

    // Split by dot or space to preserve initials separators
    const parts = fullName.split(/([.\s]+)/);
    
    const translatedParts = parts.map(part => {
        if (/^[.\s]+$/.test(part)) {
            return part;
        }
        
        const lowercaseWord = part.toLowerCase().trim();
        if (!lowercaseWord) return part;

        // Check exact match in static dictionary (like single words)
        if (BUILT_IN_DICT[lowercaseWord]) {
            return BUILT_IN_DICT[lowercaseWord];
        }

        // Check if it matches a common village suffix ending
        for (const [engSuffix, tamSuffix] of Object.entries(VILLAGE_SUFFIXES)) {
            if (lowercaseWord.endsWith(engSuffix) && lowercaseWord.length > engSuffix.length) {
                const prefixPart = lowercaseWord.substring(0, lowercaseWord.length - engSuffix.length);
                const translatedPrefix = translateFullNameToTamil(prefixPart);
                return translatedPrefix + tamSuffix;
            }
        }

        // Check if it is a single-letter or known initials map entry (like AA or VAI)
        if (INITIALS_MAP[lowercaseWord]) {
            return INITIALS_MAP[lowercaseWord];
        }
        
        // Check exact match in dynamic translit cache in localStorage
        try {
            const cachedList = JSON.parse(localStorage.getItem('translit_' + lowercaseWord));
            if (cachedList && cachedList[0]) {
                return cachedList[0];
            }
        } catch {}
        
        // Use syllable mapping fallback
        return offlinePhoneticTranslate(part);
    });
    
    return translatedParts.join('');
};

export const BulkUploadModal = ({ isOpen, onClose, onImport, templateType }) => {
    const [fileData, setFileData] = useState(null);
    const [parsedRows, setParsedRows] = useState([]);
    const [validationSummary, setValidationSummary] = useState({ valid: 0, invalid: 0, total: 0 });
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    // Helper: Quote aware CSV line parser
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    };

    // Helper: Parse full CSV content
    const parseCSVContent = (text) => {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(line => line !== '');
        if (lines.length === 0) return { headers: [], rows: [] };
        
        const rawHeaders = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const rows = [];
        
        // Map headers to normalize both English and Tamil inputs
        const headerMapping = {};
        rawHeaders.forEach((h, idx) => {
            // Contributor / Recipient Name mapping
            if (h === 'name' || h === 'பெயர்' || h === 'நபர்' || h === 'contributorname' || h === 'recipientname') {
                headerMapping.name = idx;
            }
            // Village mapping
            else if (h === 'village' || h === 'ஊர்' || h === 'கிராமம்') {
                headerMapping.village = idx;
            }
            // Amount mapping
            else if (h === 'amount' || h === 'தொகை' || h === 'பணம்') {
                headerMapping.amount = idx;
            }
            // Gift term mapping
            else if (h === 'giftterm' || h === 'term' || h === 'முறை' || h === 'தடவை') {
                headerMapping.giftTerm = idx;
            }
            // Return amount mapping (for Inbound received moi)
            else if (h === 'returnamount' || h === 'திரும்பச்செய்தது' || h === 'திரும்ப செய்த தொகை') {
                headerMapping.returnAmount = idx;
            }
            // Gift Type mapping (for Outbound given moi: Cash or Gold)
            else if (h === 'gifttype' || h === 'type' || h === 'வகை') {
                headerMapping.giftType = idx;
            }
            // Gold Details mapping (for Outbound given gold details)
            else if (h === 'golddetails' || h === 'பொன்விவரம்' || h === 'நகையளவு') {
                headerMapping.goldDetails = idx;
            }
            // Occasion mapping
            else if (h === 'occasion' || h === 'சுபநிகழ்ச்சி' || h === 'நிகழ்ச்சி') {
                headerMapping.occasion = idx;
            }
            // Given Date mapping
            else if (h === 'givendate' || h === 'date' || h === 'தேதி') {
                headerMapping.givenDate = idx;
            }
            // Notes mapping
            else if (h === 'notes' || h === 'குறிப்பு' || h === 'குறிப்புகள்') {
                headerMapping.notes = idx;
            }
        });

        let validCount = 0;
        let invalidCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
            
            const rawRow = {};
            // Extract values using indices and automatically transliterate English inputs to Tamil
            const rawName = headerMapping.name !== undefined ? values[headerMapping.name]?.trim() : '';
            const rawVillage = headerMapping.village !== undefined ? values[headerMapping.village]?.trim() : '';
            
            rawRow.name = translateFullNameToTamil(rawName);
            rawRow.village = translateFullNameToTamil(rawVillage);
            rawRow.amount = headerMapping.amount !== undefined ? values[headerMapping.amount]?.trim() : '0';
            rawRow.giftTerm = headerMapping.giftTerm !== undefined ? values[headerMapping.giftTerm]?.trim() : '1st Time';
            rawRow.notes = headerMapping.notes !== undefined ? values[headerMapping.notes]?.trim() : '';

            // Type-specific field extractions
            if (templateType === 'moi') {
                rawRow.returnAmount = headerMapping.returnAmount !== undefined ? values[headerMapping.returnAmount]?.trim() : '0';
            } else {
                rawRow.giftType = headerMapping.giftType !== undefined ? values[headerMapping.giftType]?.trim() : 'Cash';
                rawRow.goldDetails = headerMapping.goldDetails !== undefined ? values[headerMapping.goldDetails]?.trim() : '';
                rawRow.occasion = headerMapping.occasion !== undefined ? values[headerMapping.occasion]?.trim() : '';
                rawRow.givenDate = headerMapping.givenDate !== undefined ? values[headerMapping.givenDate]?.trim() : new Date().toISOString().slice(0, 10);
            }

            // Validation logic
            let isValid = true;
            const errors = [];

            if (!rawRow.name) {
                isValid = false;
                errors.push('Name is required');
            }

            if (templateType === 'moi') {
                if (isNaN(Number(rawRow.amount)) || Number(rawRow.amount) < 0) {
                    isValid = false;
                    errors.push('Amount must be a positive number');
                }
                if (rawRow.returnAmount && (isNaN(Number(rawRow.returnAmount)) || Number(rawRow.returnAmount) < 0)) {
                    isValid = false;
                    errors.push('Return amount must be a number');
                }
            } else {
                // Given Moi validations
                const normalizedType = rawRow.giftType.toLowerCase() === 'gold' || rawRow.giftType === 'தங்கம்' ? 'Gold' : 'Cash';
                rawRow.giftType = normalizedType;
                
                if (normalizedType === 'Cash') {
                    if (isNaN(Number(rawRow.amount)) || Number(rawRow.amount) <= 0) {
                        isValid = false;
                        errors.push('Amount must be greater than 0 for Cash gifts');
                    }
                } else {
                    // Gold Validation
                    if (!rawRow.goldDetails) {
                        isValid = false;
                        errors.push('Gold Details are required for Gold gifts');
                    }
                }
            }

            if (isValid) validCount++;
            else invalidCount++;

            rows.push({
                data: rawRow,
                isValid,
                errors
            });
        }

        return {
            rows,
            summary: {
                valid: validCount,
                invalid: invalidCount,
                total: rows.length
            }
        };
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileData(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const parsed = parseCSVContent(text);
            setParsedRows(parsed.rows);
            setValidationSummary(parsed.summary);
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        let headers = '';
        let dataRows = '';
        
        if (templateType === 'moi') {
            headers = 'Name,Village,Amount,GiftTerm,ReturnAmount,Notes';
            dataRows = 'கண்ணன்,மதுரை,500,1st Time,0,Wedding Gift\nArun,Chennai,1000,2nd Time,500,Return Moi';
        } else {
            headers = 'Name,Village,GiftType,GoldDetails,Amount,Occasion,GiftTerm,GivenDate,Notes';
            dataRows = 'செல்வம்,மதுரை,Cash,,1000,Ear Piercing,1st Time,2026-08-04,Earring function\nSuresh,Trichy,Gold,1 sovereign,0,Marriage,2nd Time,2026-08-05,Chains';
        }

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + dataRows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${templateType}_bulk_load_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStartImport = async () => {
        const validRows = parsedRows.filter(r => r.isValid);
        if (validRows.length === 0) return;

        setIsImporting(true);
        setProgress({ current: 0, total: validRows.length });

        for (let i = 0; i < validRows.length; i++) {
            setProgress(prev => ({ ...prev, current: i + 1 }));
            try {
                // Call the import row callback
                await onImport(validRows[i].data);
            } catch (err) {
                console.error('Import failed for row', validRows[i].data, err);
            }
        }

        setIsImporting(false);
        window.customAlert(`Successfully imported ${validRows.length} records!`, "Import Successful");
        onClose();
    };

    const resetState = () => {
        setFileData(null);
        setParsedRows([]);
        setValidationSummary({ valid: 0, invalid: 0, total: 0 });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="custom-popup-overlay">
            <div className="custom-popup-card" style={{ width: 'min(720px, 95vw)', padding: '2rem 1.75rem', textAlign: 'left', alignItems: 'stretch' }}>
                <button className="popup-close-btn" onClick={onClose} disabled={isImporting}>
                    <X size={18} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                    <div className="badge-icon-purple-sm"><Upload size={20} /></div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {templateType === 'moi' ? 'Bulk Load Moi Cash Entries' : 'Bulk Load Given Moi Gifts'}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Import multiple spreadsheet records instantly using CSV files
                        </span>
                    </div>
                </div>

                {!fileData ? (
                    <div>
                        {/* Structure Instructions */}
                        <div style={{ background: 'rgba(139, 92, 246, 0.04)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FileText size={15} style={{ color: '#8B5CF6' }} /> CSV Structure & Header Instructions
                            </h4>
                            <p style={{ margin: '0 0 0.8rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                Your CSV file must contain the headers listed below. Both English and Tamil header labels are supported. Columns can be in any order.
                            </p>
                            
                            <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse', border: '1px solid var(--border-color)' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                                        <th style={{ padding: '6px 10px', border: '1px solid var(--border-color)', textAlign: 'left' }}>Field (English)</th>
                                        <th style={{ padding: '6px 10px', border: '1px solid var(--border-color)', textAlign: 'left' }}>Tamil Header</th>
                                        <th style={{ padding: '6px 10px', border: '1px solid var(--border-color)', textAlign: 'left' }}>Requirement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>Name</td>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>பெயர் / நபர்</td>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', color: '#EF4444', fontWeight: 600 }}>Required (கட்டாயம்)</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>Village</td>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>ஊர் / கிராமம்</td>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>Optional (விருப்பம்)</td>
                                    </tr>
                                    {templateType === 'moi' ? (
                                        <>
                                            <tr>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>Amount</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>தொகை / பணம்</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', color: '#EF4444', fontWeight: 600 }}>Required Number &gt;= 0</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>GiftTerm</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>முறை / தடவை</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>Optional (default: 1st Time)</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>ReturnAmount</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>திரும்பச்செய்தது</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>Optional (default: 0)</td>
                                            </tr>
                                        </>
                                    ) : (
                                        <>
                                            <tr>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>GiftType</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>வகை (Cash/Gold)</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>Optional (default: Cash)</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>GoldDetails</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>பொன்விவரம்</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', color: '#D97706' }}>Required for Gold type</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>Amount</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>தொகை</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>Required &gt; 0 for Cash type</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>Occasion</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>சுபநிகழ்ச்சி</td>
                                                <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>Optional</td>
                                            </tr>
                                        </>
                                    )}
                                    <tr>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)', fontWeight: 600 }}>Notes</td>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>குறிப்பு</td>
                                        <td style={{ padding: '5px 10px', border: '1px solid var(--border-color)' }}>Optional notes</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* File Upload Trigger */}
                        <div 
                            style={{
                                border: '2px dashed var(--border-color)',
                                borderRadius: '12px',
                                padding: '2.5rem 1.5rem',
                                textAlign: 'center',
                                background: 'rgba(255, 255, 255, 0.01)',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B5CF6'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept=".csv" 
                                onChange={handleFileChange} 
                            />
                            <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.8rem' }} />
                            <h5 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                                Drag & Drop or Click to Upload CSV
                            </h5>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Supported format: .csv files only (UTF-8 encoded)
                            </span>
                        </div>

                        {/* Action buttons (Template Download) */}
                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-start' }}>
                            <button className="modern-btn btn-popup-cancel" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }} onClick={handleDownloadTemplate}>
                                <Download size={14} /> Download CSV Template
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* File details & validation overview */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={18} style={{ color: '#8B5CF6' }} />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>{fileData.name}</h4>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(fileData.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                            <button className="modern-btn" style={{ background: 'rgba(244,63,94,0.1)', color: '#FB7185', border: 'none', padding: '0.35rem 0.6rem', fontSize: '0.74rem', borderRadius: '6px' }} onClick={resetState} disabled={isImporting}>
                                Remove File
                            </button>
                        </div>

                        {/* Validation KPI badges */}
                        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.25rem' }}>
                            <div style={{ flex: 1, padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Records Found</span>
                                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{validationSummary.total}</strong>
                            </div>
                            <div style={{ flex: 1, padding: '0.6rem 0.8rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: '#34D399' }}>✅ Valid Rows</span>
                                <strong style={{ fontSize: '1rem', color: '#10B981' }}>{validationSummary.valid}</strong>
                            </div>
                            <div style={{ flex: 1, padding: '0.6rem 0.8rem', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: '#FB7185' }}>❌ Invalid Rows</span>
                                <strong style={{ fontSize: '1rem', color: '#F43F5E' }}>{validationSummary.invalid}</strong>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            CSV Preview (First 5 Rows)
                        </h4>
                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '1.5rem', maxHeight: '180px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)', width: '30px' }}>#</th>
                                        <th style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>Status</th>
                                        <th style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>Name</th>
                                        <th style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>Village</th>
                                        <th style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>Amount</th>
                                        {templateType === 'given_moi' && <th style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>Type/Details</th>}
                                        <th style={{ padding: '6px 10px' }}>Validation Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedRows.slice(0, 5).map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: row.isValid ? 'transparent' : 'rgba(244, 63, 94, 0.03)' }}>
                                            <td style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                            <td style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                {row.isValid ? (
                                                    <span style={{ padding: '2px 6px', background: 'rgba(16,185,129,0.15)', color: '#34D399', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700 }}>VALID</span>
                                                ) : (
                                                    <span style={{ padding: '2px 6px', background: 'rgba(244,63,94,0.15)', color: '#FB7185', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700 }}>ERROR</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)', fontWeight: 600 }}>{row.data.name}</td>
                                            <td style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>{row.data.village || '-'}</td>
                                            <td style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>₹ {Number(row.data.amount || 0).toLocaleString('en-IN')}</td>
                                            {templateType === 'given_moi' && (
                                                <td style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)' }}>
                                                    {row.data.giftType === 'Gold' ? `Gold: ${row.data.goldDetails}` : 'Cash'}
                                                </td>
                                            )}
                                            <td style={{ padding: '6px 10px', color: row.isValid ? '#10B981' : '#F43F5E' }}>
                                                {row.isValid ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> Ready to import</div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={12} /> {row.errors.join(', ')}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Import / Actions Progress area */}
                        {isImporting ? (
                            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                                    <span>Importing records into database...</span>
                                    <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #EC4899)', transition: 'width 0.1s ease' }} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.8rem' }}>
                                <button className="modern-btn btn-popup-cancel" onClick={onClose}>
                                    Cancel
                                </button>
                                <button 
                                    className="modern-btn btn-popup-confirm" 
                                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899) !important', color: '#FFF !important', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    onClick={handleStartImport}
                                    disabled={validationSummary.valid === 0}
                                >
                                    <Play size={14} /> Start Import ({validationSummary.valid} rows)
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
