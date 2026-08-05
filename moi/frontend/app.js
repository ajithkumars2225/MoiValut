// Auth Protection
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// API Details
const API_URL = 'http://localhost:8080/api';

// DOM Elements
const eventSelector = document.getElementById('eventSelector');
const btnCreateEventModal = document.getElementById('btnCreateEventModal');
const createEventModal = document.getElementById('createEventModal');
const closeEventModal = document.getElementById('closeEventModal');
const createEventForm = document.getElementById('createEventForm');

const selectEventPrompt = document.getElementById('selectEventPrompt');
const viewsContainer = document.getElementById('viewsContainer');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

const recordMoiForm = document.getElementById('recordMoiForm');
const transactionsTableBody = document.getElementById('transactionsTableBody');
const emptyState = document.getElementById('emptyState');

// Form Elements
const editingTransactionId = document.getElementById('editingTransactionId');
const contributorNameEl = document.getElementById('contributorName');
const villageEl = document.getElementById('village');
const amountEl = document.getElementById('amount');
const submitMoiBtn = document.getElementById('submitMoiBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

// Stats Elements
const totalContributorsEl = document.getElementById('totalContributors');
const totalAmountEl = document.getElementById('totalAmount');
const recentCountEl = document.getElementById('recentCount');

// Reports Elements
const reportsTableBody = document.getElementById('reportsTableBody');

const btnExportGoogleSheet = document.getElementById('btnExportGoogleSheet');
const btnExportExcel = document.getElementById('btnExportExcel');

let currentEventId = null;
let cachedTransactions = []; // Store transactions for quick editing
let allReportsData = []; // Store all data for reports
let allGoldReportsData = []; // Store all gold data for reports
let isReportSorted = false; // Track if reports are sorted to show Tem Id

// Helper to format currency in Indian format (₹ 2,000.00)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Simple Helper for just the comma formatting without the symbol (for Excel/Word context)
function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadVillages();
});

// Event Name Search Filter
const eventSearchInput = document.getElementById('eventSearch');
if(eventSearchInput) {
    eventSearchInput.addEventListener('input', function() {
        // Just call updateTableAndStats; it will pick up the search value
        updateTableAndStats();
    });
}

// Navigation Views logic
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all nav items
        navItems.forEach(n => n.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Toggle Views
        const targetViewId = e.currentTarget.getAttribute('data-view');
        document.querySelectorAll('.view-section').forEach(view => {
            view.style.display = 'none';
        });
        
        if (document.getElementById(targetViewId)) {
            document.getElementById(targetViewId).style.display = 'block';
        }

        // Update Headers
        if(targetViewId === 'dashboardView') {
            pageTitle.innerText = "Collection Dashboard";
            pageSubtitle.innerText = "Overview of your cash gifts.";
        } else if (targetViewId === 'eventsView') {
            pageTitle.innerText = "Moi Entry / Manage Records";
            pageSubtitle.innerText = "Add and update contributor details.";
        } else if (targetViewId === 'reportsView') {
            pageTitle.innerText = "Reports";
            pageSubtitle.innerText = "Analyze your collection data.";
            loadAllReports();
        } else if (targetViewId === 'eventDetailsView') {
            pageTitle.innerText = "Events Details";
            pageSubtitle.innerText = "Manage all event tables in database.";
            loadEventsDetails();
        } else if (targetViewId === 'goldEntryView') {
            pageTitle.innerText = "Gold Entry";
            pageSubtitle.innerText = "Record and manage gold gift details.";
            loadRecentGoldEntries();
        } else if (targetViewId === 'goldReportsView') {
            pageTitle.innerText = "Gold Reports";
            pageSubtitle.innerText = "Full view of all gold collections.";
            loadAllGoldReports();
        } else if (targetViewId === 'overallReportsView') {
            pageTitle.innerText = "Overall Report";
            pageSubtitle.innerText = "Download combined document for Moi and Gold collections.";
        }
    });
});

// Load All Events for Details View
async function loadEventsDetails() {
    const eventsTableBody = document.getElementById('eventsTableBody');
    if (!eventsTableBody) return;
    try {
        const res = await fetch(`${API_URL}/events`);
        const events = await res.json();
        
        eventsTableBody.innerHTML = '';
        events.forEach(event => {
            const tr = document.createElement('tr');
            const date = new Date(event.eventDate).toLocaleDateString();
            tr.innerHTML = `
                <td>${event.id}</td>
                <td style="font-weight: 500">${event.name}</td>
                <td>${date}</td>
                <td>${event.location}</td>
                <td>
                    <button class="btn btn-delete" title="Delete Event Table" onclick="deleteEvent(${event.id})" style="padding: 6px; background: none; color: var(--danger); border: none; cursor: pointer;">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </td>
            `;
            eventsTableBody.appendChild(tr);
        });
    } catch(err) {
        console.error("Failed to load events details:", err);
    }
}

// Delete Event and its Table
window.deleteEvent = async function(eventId) {
    if(!confirm('IMPORTANT: This will PERMANENTLY delete the event and its separate database table. Are you sure?')) return;
    try {
        const res = await fetch(`${API_URL}/events/${eventId}`, { method: 'DELETE' });
        if(res.ok) {
            showToast("Event and its table deleted.");
            loadEvents(); // Refresh dropdown
            loadEventsDetails(); // Refresh list
            
            if (currentEventId == eventId) {
                currentEventId = null;
                viewsContainer.style.display = 'none';
                selectEventPrompt.style.display = 'block';
            }
        } else {
            alert('Failed to delete event');
        }
    } catch (err) {
        console.error(err);
    }
}

// Logout Logic
const logoutBtn = document.querySelector('.logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });
}

// Load All Reports
// Load All Reports
async function loadAllReports() {
    if (!currentEventId) {
        reportsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Please select an event first to view its report.</td></tr>';
        allReportsData = [];
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/moi/event/${currentEventId}`);
        allReportsData = await res.json();
        isReportSorted = false; // Reset sort flag on fresh load
        renderReportsTable();
    } catch(err) {
        console.error("Failed to load reports:", err);
    }
}

function renderReportsTable() {
    reportsTableBody.innerHTML = '';
    
    const temIdHeader = document.getElementById('temIdHeader');
    if (temIdHeader) {
        temIdHeader.style.display = isReportSorted ? 'table-cell' : 'none';
    }

    if (allReportsData.length === 0) {
        reportsTableBody.innerHTML = `<tr><td colspan="${isReportSorted ? 8 : 7}" style="text-align:center;">No records found for this event.</td></tr>`;
        return;
    }
    
    allReportsData.forEach((tx, index) => {
        const tr = document.createElement('tr');
        const date = new Date(tx.transactionDate).toLocaleDateString();
        
        const temIdCell = isReportSorted ? `<td><span class="badge" style="background: #f1f5f9; color: var(--text-main); border: 1px solid var(--border-color);">${index + 1}</span></td>` : '';
        
        tr.innerHTML = `
            <td>${tx.serialNumber}</td>
            ${temIdCell}
            <td><span class="badge">Event ${tx.eventId}</span></td>
            <td style="font-weight: 500">${tx.contributorName}</td>
            <td>${tx.village}</td>
            <td class="amt-cell">${formatCurrency(tx.amount)}</td>
            <td>${date}</td>
            <td style="white-space: nowrap;">
                <button class="btn btn-edit" title="Edit" onclick="editTransactionFromReports(${tx.transactionId})" style="padding: 6px; background: none; color: var(--primary-color); border: none; cursor: pointer;"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-delete" title="Delete" onclick="deleteTransactionFromReports(${tx.transactionId})" style="padding: 6px; background: none; color: var(--danger); border: none; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        reportsTableBody.appendChild(tr);
    });
    
    // Also sync cachedTransactions for editing
    cachedTransactions = [...allReportsData];
}

// Sorting logic for Reports
const btnSortByName = document.getElementById('btnSortByName');
if(btnSortByName) {
    btnSortByName.addEventListener('click', () => {
        if (allReportsData.length === 0) return;
        allReportsData.sort((a,b) => (a.contributorName || "").localeCompare(b.contributorName || "", 'ta'));
        isReportSorted = true;
        renderReportsTable();
    });
}

const btnSortByVillage = document.getElementById('btnSortByVillage');
if(btnSortByVillage) {
    btnSortByVillage.addEventListener('click', () => {
        if (allReportsData.length === 0) return;
        allReportsData.sort((a,b) => (a.village || "").localeCompare(b.village || "", 'ta'));
        isReportSorted = true;
        renderReportsTable();
    });
}

// Helper to bridge between Reports and Entry view for Editing
window.editTransactionFromReports = function(txId) {
    document.getElementById('nav-events').click();
    setTimeout(() => {
        window.editTransaction(txId);
    }, 100);
}

// Wrapper for Delete from Reports view
window.deleteTransactionFromReports = async function(txId) {
    await window.deleteTransaction(txId);
    loadAllReports(); // Refresh the report table after deletion
}



// Export Google Sheet (XLSX format with auto-fit)
btnExportGoogleSheet.addEventListener('click', () => {
    if (allReportsData.length === 0) return alert("No data to export!");

    // 1. Prepare Header
    const fullText = eventSelector.options[eventSelector.selectedIndex].text;
    const match = fullText.match(/(.+) \((.+)\)/);
    const headingText = match ? `${match[1]} Moi Collection report ${match[2]}` : fullText;

    const headers = ["S.No", "Event ID", "Contributor Name", "Village", "Amount (INR)", "Date"];
    if (isReportSorted) {
        headers.splice(1, 0, "Tem Id");
    }

    // 2. Prepare Data
    let totalAmount = 0;
    const dataRows = allReportsData.map((tx, idx) => {
        totalAmount += tx.amount;
        const row = [
            tx.serialNumber,
            tx.eventId,
            tx.contributorName,
            tx.village,
            tx.amount,
            new Date(tx.transactionDate).toLocaleDateString()
        ];
        if (isReportSorted) {
            row.splice(1, 0, idx + 1);
        }
        return row;
    });

    // Add Space and Total
    dataRows.push([]);
    const totalRow = new Array(headers.length).fill("");
    const totalLabelIndex = isReportSorted ? 4 : 3;
    const totalValIndex = isReportSorted ? 5 : 4;
    totalRow[totalLabelIndex] = "GRAND TOTAL:";
    totalRow[totalValIndex] = totalAmount;
    dataRows.push(totalRow);

    // 3. Create Workbook
    const finalData = [
        [headingText],
        [],
        headers,
        ...dataRows
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(finalData);

    // 4. Set Column Widths (char len + padding)
    const colWidths = headers.map((header, i) => {
        let maxLen = header.toString().length;
        dataRows.forEach(row => {
            const val = row[i] ? row[i].toString() : "";
            if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 5 };
    });
    worksheet['!cols'] = colWidths;

    // 5. Merge Header
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Moi Report");

    // 6. Download
    XLSX.writeFile(workbook, `Moi_Report_Sheets_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

// Export Excel
btnExportExcel.addEventListener('click', () => {
    if (allReportsData.length === 0) return alert("No data to export!");
    
    // 1. Get Event Details
    const fullText = eventSelector.options[eventSelector.selectedIndex].text;
    const match = fullText.match(/(.+) \((.+)\)/);
    let eventNamePart = fullText;
    let eventDatePart = "";
    if (match) {
        eventNamePart = match[1];
        eventDatePart = match[2];
    }
    const headingText = `${eventNamePart} Moi Collection report ${eventDatePart}`;

    // 2. Prepare Detailed Data Rows
    let excelTotalAmount = 0;
    const headerRow = ["S.No", "Event ID", "Contributor Name", "Village", "Amount (INR)", "Date"];
    if (isReportSorted) {
        headerRow.splice(1, 0, "Tem Id");
    }

    const dataRows = allReportsData.map((tx, idx) => {
        excelTotalAmount += tx.amount;
        const row = [
            tx.serialNumber,
            tx.eventId,
            tx.contributorName,
            tx.village,
            `₹ ${tx.amount}`, // Prefixed symbol for user request
            new Date(tx.transactionDate).toLocaleDateString()
        ];
        
        if (isReportSorted) {
            row.splice(1, 0, idx + 1);
        }
        
        return row;
    });
    
    // Add Space Row for separation
    const emptyRow = new Array(headerRow.length).fill("");
    dataRows.push(emptyRow);
    
    // Add Total Row
    const totalRow = new Array(headerRow.length).fill("");
    const totalLabelIndex = isReportSorted ? 4 : 3;
    const totalValIndex = isReportSorted ? 5 : 4;
    totalRow[totalLabelIndex] = "GRAND TOTAL:";
    totalRow[totalValIndex] = `₹ ${excelTotalAmount}`;
    dataRows.push(totalRow);

    // 3. Construct Sheet (Row 0: Title, Row 1: Empty, Row 2: Headers, Row 3+: Data)
    const finalDataArray = [
        [headingText],
        [],
        headerRow,
        ...dataRows
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(finalDataArray);

    // 4. Merge heading across all columns
    worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } }
    ];

    // 5. Dynamic Auto-Fit Columns Logic
    const colWidths = headerRow.map((_, i) => {
        // Measure length of header and each cell in the column
        let maxLength = headerRow[i].toString().length;
        dataRows.forEach(row => {
            const cellVal = row[i] ? row[i].toString() : "";
            if (cellVal.length > maxLength) {
                maxLength = cellVal.length;
            }
        });
        // Extra padding for comfort (wch is roughly character width)
        return { wch: maxLength + 5 }; 
    });
    worksheet['!cols'] = colWidths;

    // 6. Styling: Colors and Alignments
    const totalRowIndex = finalDataArray.length; // Row length is total rows

    // Loop through all defined cells to set basic styling like vertical alignment and font
    for (let cellRef in worksheet) {
        if (cellRef[0] === '!') continue; // Skip metadata
        
        const cell = worksheet[cellRef];
        if (!cell.s) cell.s = {};

        const rowIndex = parseInt(cellRef.replace(/[^0-9]/g, ''));

        // Default alignment
        cell.s.alignment = { vertical: "center", horizontal: "left" };
        cell.s.font = { name: "Arial", sz: 11 };

        // Alternating Table Rows (Zebra Stripes)
        // Header starts at row 3. Data starts at row 4.
        const dataRowIndex = rowIndex - 3;
        if (rowIndex > 3 && rowIndex < totalRowIndex - 1 && dataRowIndex % 2 === 1) {
            cell.s.fill = { fgColor: { rgb: "F5F5FC" } }; // Light Indigo
        }

        // Special Styling for Header Row (Row 3 in Excel)
        if (rowIndex === 3) {
            cell.s.fill = { fgColor: { rgb: "3F51B5" } }; // Deep Blue
            cell.s.font = { color: { rgb: "FFFFFF" }, bold: true, sz: 12 };
            cell.s.alignment = { horizontal: "center", vertical: "center" };
        }

        // Special Styling for Main Heading (A1)
        if (cellRef === 'A1') {
            cell.s.font = { bold: true, sz: 16, color: { rgb: "000000" } };
            cell.s.alignment = { horizontal: "center", vertical: "center" };
        }
        
        // Highlighting for amount and serial numbers
        // If sorted, Tem Id is G, Event ID is H/I? NO, S.No=A, TemId=B, EventId=C, Name=D, Village=E, Amount=F, Date=G
        const amountCol = isReportSorted ? 'F' : 'E';
        const snoCol = 'A';
        const temIdCol = isReportSorted ? 'B' : null;

        if (cellRef.startsWith(amountCol) || cellRef.startsWith(snoCol) || (temIdCol && cellRef.startsWith(temIdCol))) {
            cell.s.alignment.horizontal = "center";
        }

        // Special Styling for Grand Total Row (Last Row)
        if (rowIndex === totalRowIndex) {
            cell.s.font = { color: { rgb: "000000" }, bold: true, sz: 12 };
            cell.s.alignment = { horizontal: "center", vertical: "center" };
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `Moi_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
});

// Export Word
const btnExportWord = document.getElementById('btnExportWord');
btnExportWord.addEventListener('click', async () => {
    if (allReportsData.length === 0) return alert("No data to export!");
    
    btnExportWord.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';
    btnExportWord.disabled = true;

    try {
        const fullText = eventSelector.options[eventSelector.selectedIndex].text;
        const match = fullText.match(/(.+) \((.+)\)/);
        let eventName = match ? match[1] : fullText;
        let eventDate = match ? match[2] : "";
        
        // Try with Library first
        const docxLib = window.docx;
        const saveAsFunction = window.saveAs;

        if (docxLib && saveAsFunction) {
            const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType, VerticalAlign } = docxLib;
            
            const createHeaderCell = (text) => new TableCell({
                children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })],
                shading: { fill: "3F51B5", type: ShadingType.SOLID, color: "FFFFFF" },
                verticalAlign: VerticalAlign.CENTER
            });

            const tableHeaderCols = [
                createHeaderCell("S.No"),
                createHeaderCell("Event ID"),
                createHeaderCell("Contributor Name"),
                createHeaderCell("Village"),
                createHeaderCell("Amount"),
                createHeaderCell("Date"),
            ];
            if (isReportSorted) {
                tableHeaderCols.splice(1, 0, createHeaderCell("Tem Id"));
            }

            const tableHeader = new TableRow({
                children: tableHeaderCols,
            });

            let totalAmount = 0;
            const dataRows = allReportsData.map((tx, idx) => {
                totalAmount += tx.amount;
                const isOdd = idx % 2 === 1;
                const shading = isOdd ? { fill: "F5F5FC", type: ShadingType.SOLID, color: "000000" } : undefined;
                
                const cells = [
                    new TableCell({ children: [new Paragraph({ text: tx.serialNumber.toString(), alignment: AlignmentType.CENTER })], shading }),
                    new TableCell({ children: [new Paragraph({ text: tx.eventId.toString(), alignment: AlignmentType.CENTER })], shading }),
                    new TableCell({ children: [new Paragraph(tx.contributorName)], shading }),
                    new TableCell({ children: [new Paragraph(tx.village)], shading }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(tx.amount), alignment: AlignmentType.RIGHT })], shading }),
                    new TableCell({ children: [new Paragraph(new Date(tx.transactionDate).toLocaleDateString())], shading }),
                ];
                
                if (isReportSorted) {
                    cells.splice(1, 0, new TableCell({ children: [new Paragraph({ text: (idx + 1).toString(), alignment: AlignmentType.CENTER })], shading }));
                }

                return new TableRow({ children: cells });
            });

            const totalRow = new TableRow({
                children: [
                    new TableCell({ 
                        children: [new Paragraph({ text: `GRAND TOTAL: ${formatCurrency(totalAmount)}`, bold: true, alignment: AlignmentType.CENTER })], 
                        columnSpan: isReportSorted ? 7 : 6,
                        verticalAlign: VerticalAlign.CENTER
                    }),
                ],
            });

            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [tableHeader, ...dataRows, new TableRow({ children: [new TableCell({ children: [], border: { top: { style: "none" }, bottom: { style: "none" }, left: { style: "none" }, right: { style: "none" } } })] }), totalRow],
            });

            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ text: `${eventName} Moi Collection Report`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                        new Paragraph({ text: `Event Date: ${eventDate}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                        table,
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAsFunction(blob, `Moi_Report_${new Date().toISOString().slice(0,10)}.docx`);
        } else {
            // FALLBACK: Native HTML-to-Word approach (No libraries needed)
            console.warn("Using fallback HTML-to-Word generation...");
            
            let totalAmount = 0;
            let tableHtml = `
                <table border="1" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
                    <thead>
                        <tr style="background-color: #3F51B5; color: #FFFFFF;">
                            <th>S.No</th>
                            ${isReportSorted ? '<th>Tem Id</th>' : ''}
                            <th>Event ID</th>
                            <th>Contributor Name</th>
                            <th>Village</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            allReportsData.forEach((tx, idx) => {
                totalAmount += tx.amount;
                const rowBg = idx % 2 === 1 ? 'background-color: #F5F5FC;' : '';
                tableHtml += `
                    <tr style="${rowBg}">
                        <td align="center">${tx.serialNumber}</td>
                        ${isReportSorted ? `<td align="center">${idx + 1}</td>` : ''}
                        <td align="center">${tx.eventId}</td>
                        <td>${tx.contributorName}</td>
                        <td>${tx.village}</td>
                        <td align="right">${formatCurrency(tx.amount)}</td>
                        <td>${new Date(tx.transactionDate).toLocaleDateString()}</td>
                    </tr>
                `;
            });

            tableHtml += `
                    <tr style="height: 30px;"><td colspan="${isReportSorted ? 7 : 6}" style="border: none;"></td></tr>
                    <tr style="font-weight: bold;">
                        <td colspan="${isReportSorted ? 7 : 6}" align="center" style="padding: 10px;">GRAND TOTAL: ${formatCurrency(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>
            `;

            const documentHtml = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'></head>
                <body>
                    <h1 style="text-align: center;">${eventName} Moi Collection Report</h1>
                    <p style="text-align: center;">Event Date: ${eventDate}</p>
                    ${tableHtml}
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff', documentHtml], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Moi_Report_${new Date().toISOString().slice(0,10)}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (err) {
        console.error("Word Export failed:", err);
        alert("Failed to generate Word document. Error: " + err.message);
    } finally {
        btnExportWord.innerHTML = '<i class="fa-solid fa-file-word"></i> Download Word';
        btnExportWord.disabled = false;
    }
});

// Export Overall Word Report
const btnExportOverallWord = document.getElementById('btnExportOverallWord');
if (btnExportOverallWord) {
    btnExportOverallWord.addEventListener('click', async () => {
        if (!currentEventId) {
            return alert("Please select an event first!");
        }

        btnExportOverallWord.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';
        btnExportOverallWord.disabled = true;

        try {
            const res = await fetch(`${API_URL}/reports/overall/word?eventId=${currentEventId}`);
            if (!res.ok) {
                throw new Error("Failed to generate overall report");
            }

            const blob = await res.blob();
            const dateStr = new Date().toISOString().slice(0, 10);
            saveAs(blob, `Overall_Report_${currentEventId}_${dateStr}.docx`);
            
        } catch (err) {
            console.error("Overall Word Export failed:", err);
            alert("Failed to download overall report. Error: " + err.message);
        } finally {
            btnExportOverallWord.innerHTML = '<i class="fa-solid fa-download"></i> Download Overall Word Report';
            btnExportOverallWord.disabled = false;
        }
    });
}

// Load Villages Autocomplete
async function loadVillages() {
    try {
        const res = await fetch(`${API_URL}/moi/villages`);
        if (!res.ok) return;
        const villages = await res.json();
        
        const dataList = document.getElementById('villageList');
        dataList.innerHTML = '';
        villages.forEach(v => {
            const option = document.createElement('option');
            option.value = v;
            dataList.appendChild(option);
        });
    } catch(err) {
        console.error("Failed to load villages:", err);
    }
}

// Load Events
async function loadEvents() {
    try {
        const res = await fetch(`${API_URL}/events`);
        const events = await res.json();
        const totalEventsCountEl = document.getElementById('totalEventsCount');
        
        eventSelector.innerHTML = '<option value="" disabled selected>Select an Event</option>';
        if(totalEventsCountEl) totalEventsCountEl.innerText = events.length;
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            const date = new Date(event.eventDate).toLocaleDateString();
            option.textContent = `${event.name} (${date})`;
            eventSelector.appendChild(option);
        });

        if(currentEventId) {
            eventSelector.value = currentEventId;
            selectEvent(currentEventId);
        }

    } catch(err) {
        console.error("Failed to load events:", err);
    }
}

// Event Selector Change
eventSelector.addEventListener('change', (e) => {
    selectEvent(e.target.value);
});

function selectEvent(eventId) {
    currentEventId = eventId;
    selectEventPrompt.style.display = 'none';
    viewsContainer.style.display = 'block';
    
    // Auto-switch to Events View to prompt data entry
    document.getElementById('nav-events').click();
    
    loadTransactions(eventId);
}

// Load Transactions
async function loadTransactions(eventId) {
    try {
        const res = await fetch(`${API_URL}/moi/event/${eventId}`);
        cachedTransactions = await res.json();
        updateTableAndStats();
    } catch(err) {
        console.error("Failed to load transactions:", err);
    }
}

function updateTableAndStats(highlightId = null) {
    transactionsTableBody.innerHTML = '';
    
    // 1. Calculate stats from ALL transactions
    let totalAmount = 0;
    const uniqueContributors = new Set();
    cachedTransactions.forEach(tx => {
        totalAmount += tx.amount;
        uniqueContributors.add(tx.contributorName);
    });

    // Update Stats UI
    if(totalContributorsEl) totalContributorsEl.innerText = uniqueContributors.size;
    if(totalAmountEl) totalAmountEl.innerText = formatCurrency(totalAmount);
    if(recentCountEl) recentCountEl.innerText = cachedTransactions.length;
    
    // Mismatched Data calculation (Total Transactions - Unique Contributors)
    const mismatchedData = cachedTransactions.length - uniqueContributors.size;
    const mismatchedCountEl = document.getElementById('mismatchedCount');
    if(mismatchedCountEl) mismatchedCountEl.innerText = mismatchedData;

    if(cachedTransactions.length === 0) {
        emptyState.style.display = 'block';
        document.querySelector('.data-table').style.display = 'none';
        document.getElementById('duplicateWarning').style.display = 'none';
        return;
    }

    // 2. Determine Display List
    let displayList = [...cachedTransactions];
    
    // Sort base: date desc
    displayList.sort((a,b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    // Apply Filter if searching
    const filter = eventSearchInput ? eventSearchInput.value.toLowerCase() : "";
    if (filter) {
        displayList = displayList.filter(tx => 
            tx.contributorName.toLowerCase().includes(filter) || 
            tx.village.toLowerCase().includes(filter)
        );
    } else if (highlightId) {
        // Move highlighted duplicate to top
        const idx = displayList.findIndex(tx => tx.transactionId === highlightId);
        if (idx > -1) {
            const [item] = displayList.splice(idx, 1);
            displayList.unshift(item);
        }
    }

    // STRICT LIMIT TO RECENT 6
    displayList = displayList.slice(0, 6);

    // 3. Render
    if(displayList.length === 0) {
        emptyState.style.display = 'block';
        document.querySelector('.data-table').style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        document.querySelector('.data-table').style.display = 'table';

        displayList.forEach((tx) => {
            const tr = document.createElement('tr');
            const date = new Date(tx.transactionDate).toLocaleDateString();
            
            if (highlightId && tx.transactionId === highlightId) {
                tr.classList.add('highlight-row');
            }
            
            tr.innerHTML = `
                <td><span class="badge">${tx.serialNumber}</span></td>
                <td style="font-weight: 500">${tx.contributorName}</td>
                <td>${tx.village}</td>
                <td class="amt-cell">${formatCurrency(tx.amount)}</td>
                <td>${date}</td>
                <td style="white-space: nowrap;">
                    <button class="btn btn-edit" title="Edit" onclick="editTransaction(${tx.transactionId})" style="padding: 6px; background: none; color: var(--primary-color); border: none; cursor: pointer;"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn btn-delete" title="Delete" onclick="deleteTransaction(${tx.transactionId})" style="padding: 6px; background: none; color: var(--danger); border: none; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            transactionsTableBody.appendChild(tr);
        });
    }
}

// Edit Mode Logic
window.editTransaction = function(txId) {
    const tx = cachedTransactions.find(t => t.transactionId === txId);
    if (!tx) return;

    editingTransactionId.value = tx.transactionId;
    contributorNameEl.value = tx.contributorName;
    villageEl.value = tx.village;
    amountEl.value = tx.amount;

    // Switch form to "Update" mode
    formTitle.innerHTML = `<i class="fa-solid fa-pen"></i> Update Transaction`;
    submitMoiBtn.innerHTML = `<i class="fa-solid fa-check"></i> Update`;
    cancelEditBtn.style.display = 'inline-block';
    
    // Jump to form
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}

cancelEditBtn.addEventListener('click', () => {
    resetForm();
});

window.deleteTransaction = async function(txId) {
    if(!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        const res = await fetch(`${API_URL}/moi/${txId}`, { method: 'DELETE' });
        if(res.ok) {
            showToast("Transaction deleted.");
            loadTransactions(currentEventId);
            // If the reports view is currently visible, refresh it too
            if (document.getElementById('reportsView').style.display === 'block') {
                loadAllReports();
            }
        } else {
            alert('Failed to delete transaction');
        }
    } catch (err) {
        console.error(err);
    }
}

function resetForm() {
    recordMoiForm.reset();
    editingTransactionId.value = '';
    formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Record New Moi`;
    submitMoiBtn.innerHTML = `<i class="fa-solid fa-save"></i> Save Transaction`;
    cancelEditBtn.style.display = 'none';
    document.getElementById('duplicateWarning').style.display = 'none';
}

// Duplicate Check Logic
function checkDuplicate() {
    const name = contributorNameEl.value.trim().toLowerCase();
    const village = villageEl.value.trim().toLowerCase();
    const currentId = editingTransactionId.value;
    const warningEl = document.getElementById('duplicateWarning');

    if (!name || !village) {
        warningEl.style.display = 'none';
        updateTableAndStats();
        return;
    }

    // Check if this name and village combo exists in cached transactions
    const duplicateRecord = cachedTransactions.find(tx => 
        tx.contributorName.toLowerCase() === name && 
        tx.village.toLowerCase() === village &&
        String(tx.transactionId) !== String(currentId)
    );

    if (duplicateRecord) {
        warningEl.style.display = 'flex';
        updateTableAndStats(duplicateRecord.transactionId);
        warningEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        warningEl.style.display = 'none';
        updateTableAndStats();
    }
}

contributorNameEl.addEventListener('input', checkDuplicate);
villageEl.addEventListener('input', checkDuplicate);

// Record/Update Moi Transaction
recordMoiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!currentEventId) return;

    const payload = {
        eventId: currentEventId,
        contributorName: contributorNameEl.value,
        village: villageEl.value,
        amount: parseFloat(amountEl.value)
    };

    const isEdit = editingTransactionId.value !== '';
    const url = isEdit ? `${API_URL}/moi/${editingTransactionId.value}` : `${API_URL}/moi`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            resetForm();
            showToast(isEdit ? "Transaction updated successfully!" : "Moi recorded successfully!");
            // Focus back on the Contributor Name field so the user can continuously enter more transactions
            if (!isEdit) {
                contributorNameEl.focus();
            }
            // Reload current event data and villages
            loadTransactions(currentEventId);
            loadVillages();
        } else {
            alert('Failed to save transaction');
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error');
    }
});

// Create Event
createEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('eventName').value,
        eventDate: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value
    };

    try {
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            const newEvent = await res.json();
            createEventForm.reset();
            createEventModal.style.display = 'none';
            currentEventId = newEvent.id;
            loadEvents();
            showToast("Event created gracefully!");
        } else {
            alert('Failed to create event');
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error');
    }
});

// Modal Logic
btnCreateEventModal.addEventListener('click', () => {
    createEventModal.style.display = 'flex';
});

closeEventModal.addEventListener('click', () => {
    createEventModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === createEventModal) {
        createEventModal.style.display = 'none';
    }
});

// Toast Logic
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Gold Entry Logic
const goldEntryForm = document.getElementById('goldEntryForm');
if(goldEntryForm) {
    goldEntryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentEventId) {
            alert("Please select an event first!");
            return;
        }

        const btn = document.getElementById('saveGoldBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        const requestData = {
            eventId: currentEventId,
            contributorName: document.getElementById('goldContributorName').value,
            village: document.getElementById('goldVillage').value,
            goldDetails: document.getElementById('goldDetails').value
        };

        const editId = document.getElementById('editingGoldId').value;
        const url = editId ? `${API_URL}/gold/${editId}` : `${API_URL}/gold`;
        const method = editId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (res.ok) {
                showToast(editId ? "Gold Entry updated successfully!" : "Gold Entry saved successfully!");
                cancelGoldEdit();
                loadRecentGoldEntries();
                loadVillages(); 
                if(document.getElementById('goldReportsView').style.display !== 'none') {
                    loadAllGoldReports();
                }
            } else {
                alert("Failed to save gold entry.");
            }
        } catch (err) {
            console.error("Gold Entry error:", err);
            alert("Error connecting to server.");
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    });
}

async function loadRecentGoldEntries() {
    const tableBody = document.getElementById('goldEntriesTableBody');
    if(!tableBody || !currentEventId) return;

    try {
        const res = await fetch(`${API_URL}/gold/event/${currentEventId}/recent`);
        if(res.ok) {
            const entries = await res.json();
            tableBody.innerHTML = '';
            
            if(entries.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No gold entries for this event yet.</td></tr>';
                return;
            }

            entries.forEach(entry => {
                const tr = document.createElement('tr');
                const date = new Date(entry.entryDate).toLocaleDateString();
                tr.innerHTML = `
                    <td align="center"><strong>${entry.serialNumber}</strong></td>
                    <td>${entry.contributorName}</td>
                    <td>${entry.village}</td>
                    <td><span class="badge" style="background: #fef3c7; color: #92400e;">${entry.goldDetails}</span></td>
                    <td>${date}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Failed to load gold entries:", err);
    }
}


function editGoldEntry(id, name, village, gold) {
    document.getElementById('editingGoldId').value = id;
    document.getElementById('goldContributorName').value = name;
    document.getElementById('goldVillage').value = village;
    document.getElementById('goldDetails').value = gold;
    
    document.getElementById('goldFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Gold Entry';
    document.getElementById('saveGoldBtn').innerHTML = '<i class="fa-solid fa-check"></i> Update Gold Entry';
    document.getElementById('cancelGoldEditBtn').style.display = 'inline-block';
    
    // Switch to gold entry view
    document.getElementById('nav-gold-entry').click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelGoldEdit() {
    goldEntryForm.reset();
    document.getElementById('editingGoldId').value = "";
    document.getElementById('goldFormTitle').innerHTML = '<i class="fa-solid fa-coins"></i> Record Gold Entry';
    document.getElementById('saveGoldBtn').innerHTML = '<i class="fa-solid fa-save"></i> Save Gold';
    document.getElementById('cancelGoldEditBtn').style.display = 'none';
}

const cancelGoldEditBtn = document.getElementById('cancelGoldEditBtn');
if(cancelGoldEditBtn) {
    cancelGoldEditBtn.addEventListener('click', cancelGoldEdit);
}

async function deleteGoldEntry(id) {
    if(!confirm("Are you sure you want to delete this gold record?")) return;
    
    try {
        const res = await fetch(`${API_URL}/gold/${id}`, { method: 'DELETE' });
        if(res.ok) {
            showToast("Gold record deleted.");
            loadRecentGoldEntries();
            if(document.getElementById('goldReportsView').style.display !== 'none') {
                loadAllGoldReports();
            }
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
}

async function loadAllGoldReports() {
    const tableBody = document.getElementById('goldReportsTableBody');
    if(!tableBody || !currentEventId) return;

    try {
        const res = await fetch(`${API_URL}/gold/event/${currentEventId}`);
        if(res.ok) {
            allGoldReportsData = await res.json();
            tableBody.innerHTML = '';
            
            if(allGoldReportsData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No records found.</td></tr>';
                return;
            }

            allGoldReportsData.forEach(entry => {
                const tr = document.createElement('tr');
                const date = new Date(entry.entryDate).toLocaleDateString();
                tr.innerHTML = `
                    <td align="center"><strong>${entry.serialNumber}</strong></td>
                    <td>${entry.contributorName}</td>
                    <td>${entry.village}</td>
                    <td><span class="badge" style="background: #fef3c7; color: #92400e;">${entry.goldDetails}</span></td>
                    <td>${date}</td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn" style="padding: 5px 8px; font-size: 0.8rem; background: #f1f5f9; color: var(--primary-color);" 
                                onclick="editGoldEntry(${entry.id}, '${entry.contributorName}', '${entry.village}', '${entry.goldDetails}')">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                            <button class="btn" style="padding: 5px 8px; font-size: 0.8rem; background: #fff1f2; color: var(--danger);" 
                                onclick="deleteGoldEntry(${entry.id})">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Failed to load reports:", err);
    }
}

// Gold Word Export Logic
const btnExportGoldWord = document.getElementById('btnExportGoldWord');
if (btnExportGoldWord) {
    btnExportGoldWord.addEventListener('click', async () => {
        if (allGoldReportsData.length === 0) return alert("No gold data to export!");

        btnExportGoldWord.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';
        btnExportGoldWord.disabled = true;

        try {
            const fullText = eventSelector.options[eventSelector.selectedIndex].text;
            const match = fullText.match(/(.+) \((.+)\)/);
            let eventName = match ? match[1] : fullText;
            let eventDate = match ? match[2] : "";

            // Try with Library first
            const docxLib = window.docx;
            const saveAsFunction = window.saveAs;

            if (docxLib && saveAsFunction) {
                const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType, VerticalAlign } = docxLib;

                const createHeaderCell = (text) => new TableCell({
                    children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })],
                    shading: { fill: "3F51B5", type: ShadingType.SOLID, color: "FFFFFF" },
                    verticalAlign: VerticalAlign.CENTER
                });

                const tableHeader = new TableRow({
                    children: [
                        createHeaderCell("S.No"),
                        createHeaderCell("Contributor Name"),
                        createHeaderCell("Village"),
                        createHeaderCell("Gold Details"),
                        createHeaderCell("Date")
                    ],
                });

                const dataRows = allGoldReportsData.map((entry, idx) => {
                    const isOdd = idx % 2 === 1;
                    const shading = isOdd ? { fill: "F5F5FC", type: ShadingType.SOLID, color: "000000" } : undefined;

                    return new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: entry.serialNumber.toString(), alignment: AlignmentType.CENTER })], shading }),
                            new TableCell({ children: [new Paragraph(entry.contributorName)], shading }),
                            new TableCell({ children: [new Paragraph(entry.village)], shading }),
                            new TableCell({ children: [new Paragraph(entry.goldDetails)], shading }),
                            new TableCell({ children: [new Paragraph(new Date(entry.entryDate).toLocaleDateString())], shading }),
                        ]
                    });
                });

                const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [tableHeader, ...dataRows],
                });

                const doc = new Document({
                    sections: [{
                        children: [
                            new Paragraph({ text: `${eventName} Gold Collection Report`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                            new Paragraph({ text: `Event Date: ${eventDate}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                            table,
                        ],
                    }],
                });

                const blob = await Packer.toBlob(doc);
                saveAsFunction(blob, `Gold_Report_${new Date().toISOString().slice(0, 10)}.docx`);
            } else {
                // FALLBACK: Native HTML-to-Word approach
                let tableHtml = `
                    <table border="1" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
                        <thead>
                            <tr style="background-color: #3F51B5; color: #FFFFFF;">
                                <th>S.No</th>
                                <th>Contributor Name</th>
                                <th>Village</th>
                                <th>Gold Details</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                allGoldReportsData.forEach((entry, idx) => {
                    const rowBg = idx % 2 === 1 ? 'background-color: #F5F5FC;' : '';
                    tableHtml += `
                        <tr style="${rowBg}">
                            <td align="center">${entry.serialNumber}</td>
                            <td>${entry.contributorName}</td>
                            <td>${entry.village}</td>
                            <td align="center" style="color: #92400e;">${entry.goldDetails}</td>
                            <td>${new Date(entry.entryDate).toLocaleDateString()}</td>
                        </tr>
                    `;
                });

                tableHtml += `
                        </tbody>
                    </table>
                `;

                const documentHtml = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'></head>
                    <body>
                        <h1 style="text-align: center;">${eventName} Gold Collection Report</h1>
                        <p style="text-align: center;">Event Date: ${eventDate}</p>
                        ${tableHtml}
                    </body>
                    </html>
                `;

                const blob = new Blob(['\ufeff', documentHtml], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Gold_Report_${new Date().toISOString().slice(0, 10)}.doc`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (err) {
            console.error("Gold Word Export failed:", err);
            alert("Failed to generate Gold Word document. Error: " + err.message);
        } finally {
            btnExportGoldWord.innerHTML = '<i class="fa-solid fa-file-word"></i> Download Word';
            btnExportGoldWord.disabled = false;
        }
    });
}


// Gold Excel Export Logic
const btnExportGoldExcel = document.getElementById('btnExportGoldExcel');
if (btnExportGoldExcel) {
    btnExportGoldExcel.addEventListener('click', () => {
        if (allGoldReportsData.length === 0) return alert("No gold data to export!");

        // 1. Get Event Details
        const fullText = eventSelector.options[eventSelector.selectedIndex].text;
        const match = fullText.match(/(.+) \((.+)\)/);
        let eventNamePart = fullText;
        let eventDatePart = "";
        if (match) {
            eventNamePart = match[1];
            eventDatePart = match[2];
        }
        const headingText = `${eventNamePart} Gold Collection report ${eventDatePart}`;

        // 2. Prepare Detailed Data Rows
        const headerRow = ["S.No", "Contributor Name", "Village", "Gold Details", "Date"];

        const dataRows = allGoldReportsData.map((entry, idx) => {
            return [
                entry.serialNumber,
                entry.contributorName,
                entry.village,
                entry.goldDetails,
                new Date(entry.entryDate).toLocaleDateString()
            ];
        });

        // 3. Construct Sheet (Row 0: Title, Row 1: Empty, Row 2: Headers, Row 3+: Data)
        const finalDataArray = [
            [headingText],
            [],
            headerRow,
            ...dataRows
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(finalDataArray);

        // 4. Merge heading across all columns
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } }
        ];

        // 5. Dynamic Auto-Fit Columns Logic
        const colWidths = headerRow.map((_, i) => {
            let maxLength = headerRow[i].toString().length;
            dataRows.forEach(row => {
                const cellVal = row[i] ? row[i].toString() : "";
                if (cellVal.length > maxLength) {
                    maxLength = cellVal.length;
                }
            });
            return { wch: maxLength + 5 }; 
        });
        worksheet['!cols'] = colWidths;

        // 6. Styling
        for (let cellRef in worksheet) {
            if (cellRef[0] === '!') continue;
            
            const cell = worksheet[cellRef];
            if (!cell.s) cell.s = {};

            const rowIndex = parseInt(cellRef.replace(/[^0-9]/g, ''));

            cell.s.alignment = { vertical: "center", horizontal: "left" };
            cell.s.font = { name: "Arial", sz: 11 };

            // Alternating Table Rows
            const dataRowIndex = rowIndex - 3;
            if (rowIndex > 3 && dataRowIndex % 2 === 1) {
                cell.s.fill = { fgColor: { rgb: "F5F5FC" } }; 
            }

            // Header Row
            if (rowIndex === 3) {
                cell.s.fill = { fgColor: { rgb: "3F51B5" } }; 
                cell.s.font = { color: { rgb: "FFFFFF" }, bold: true, sz: 12 };
                cell.s.alignment = { horizontal: "center", vertical: "center" };
            }

            // Main Heading
            if (cellRef === 'A1') {
                cell.s.font = { bold: true, sz: 16, color: { rgb: "000000" } };
                cell.s.alignment = { horizontal: "center", vertical: "center" };
            }
            
            // Alignment for serial numbers
            if (cellRef.startsWith('A')) {
                cell.s.alignment.horizontal = "center";
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Gold Report");
        XLSX.writeFile(workbook, `Gold_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
    });
}

// Mismatched Data Viewing Logic
window.viewMismatchedData = function() {
    if (!currentEventId) return alert("Please select an event first!");
    
    // Hide all views
    document.querySelectorAll('.view-section').forEach(view => {
        view.style.display = 'none';
    });
    
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show mismatch view
    const mismatchView = document.getElementById('mismatchView');
    if(mismatchView) {
        mismatchView.style.display = 'block';
        document.getElementById('pageTitle').innerText = "Mismatched Records";
        document.getElementById('pageSubtitle').innerText = "Transactions from people who contributed more than once.";
        
        renderMismatchTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderMismatchTable() {
    const tableBody = document.getElementById('mismatchTableBody');
    if(!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Group transactions by Name + Village to find repeat contributors
    const groups = {};
    cachedTransactions.forEach(tx => {
        const key = `${tx.contributorName.trim().toLowerCase()}|${tx.village.trim().toLowerCase()}`;
        if(!groups[key]) groups[key] = [];
        groups[key].push(tx);
    });
    
    // Identify all transactions belonging to repeat contributors
    const duplicates = [];
    Object.values(groups).forEach(txs => {
        if(txs.length > 1) {
            duplicates.push(...txs);
        }
    });
    
    if(duplicates.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--text-muted);">No mismatched (duplicate) records found for this event.</td></tr>';
        return;
    }
    
    // Sort to group identical people together, then by date desc
    duplicates.sort((a, b) => {
        const keyA = `${a.contributorName}|${a.village}`;
        const keyB = `${b.contributorName}|${b.village}`;
        if (keyA !== keyB) return keyA.localeCompare(keyB);
        return new Date(b.transactionDate) - new Date(a.transactionDate);
    });
    
    duplicates.forEach(tx => {
        const tr = document.createElement('tr');
        const date = new Date(tx.transactionDate).toLocaleDateString();
        tr.innerHTML = `
            <td>${tx.serialNumber}</td>
            <td style="font-weight: 500">${tx.contributorName}</td>
            <td>${tx.village}</td>
            <td class="amt-cell" style="color: var(--primary-color); font-weight: 600;">${formatCurrency(tx.amount)}</td>
            <td>${date}</td>
        `;
        tableBody.appendChild(tr);
    });
}
