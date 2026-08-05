package com.moi.service;

import com.moi.model.GoldEntry;
import com.moi.model.MoiTransaction;
import com.moi.repository.GoldEntryRepository;
import com.moi.repository.MoiTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final MoiTransactionRepository moiTransactionRepository;
    private final GoldEntryRepository goldEntryRepository;

    // Colors (hex strings for high-level POI API)
    private static final String HEADER_COLOR = "2B5797";   // Dark blue
    private static final String ALT_ROW_COLOR = "EEF2FF";  // Light blue
    private static final String TOTAL_ROW_COLOR = "DBEAFE"; // Soft blue for total
    private static final String WHITE = "FFFFFF";

    @Transactional(readOnly = true)
    public byte[] generateOverallWordReport(Long eventId) throws IOException {
        List<MoiTransaction> moiTransactions = moiTransactionRepository.findByEventId(eventId);
        List<GoldEntry> goldEntries = goldEntryRepository.findByEventId(eventId);

        // Sort both lists by village name (ascending, case-insensitive)
        moiTransactions.sort(Comparator.comparing(
                tx -> tx.getContributor().getVillage(), String.CASE_INSENSITIVE_ORDER));
        goldEntries.sort(Comparator.comparing(
                ge -> ge.getContributor().getVillage(), String.CASE_INSENSITIVE_ORDER));

        try (XWPFDocument document = new XWPFDocument()) {

            // =====================================================
            // MOI COLLECTION REPORT
            // =====================================================
            addSectionTitle(document, "Moi Collection Report");

            if (!moiTransactions.isEmpty()) {
                String[] moiHeaders = {"S.No", "Name", "Village", "Amount (Rs)"};
                XWPFTable moiTable = document.createTable(1, moiHeaders.length);
                moiTable.setWidth("100%");
                styleHeaderRow(moiTable.getRow(0), moiHeaders);

                BigDecimal grandTotal = BigDecimal.ZERO;
                int sno = 1;
                for (MoiTransaction tx : moiTransactions) {
                    grandTotal = grandTotal.add(tx.getAmount());
                    XWPFTableRow row = moiTable.createRow();
                    boolean isAlt = (sno % 2 == 0);
                    setCellText(row.getCell(0), String.valueOf(sno++), isAlt, true);
                    setCellText(row.getCell(1), tx.getContributor().getName(), isAlt, false);
                    setCellText(row.getCell(2), tx.getContributor().getVillage(), isAlt, false);
                    setCellText(row.getCell(3), "Rs. " + grandTotal.toString(), isAlt, true);
                }

                // Grand Total row
                XWPFTableRow totalRow = moiTable.createRow();
                setCellWithColor(totalRow.getCell(0), "", TOTAL_ROW_COLOR, false);
                setCellWithColor(totalRow.getCell(1), "", TOTAL_ROW_COLOR, false);
                setCellWithColor(totalRow.getCell(2), "GRAND TOTAL :", TOTAL_ROW_COLOR, true);
                setCellWithColor(totalRow.getCell(3), "Rs. " + grandTotal.toString(), TOTAL_ROW_COLOR, true);

            } else {
                addNoteText(document, "No Moi entries found for this event.");
            }

            // Page break
            document.createParagraph().createRun().addBreak(BreakType.PAGE);

            // =====================================================
            // GOLD COLLECTION REPORT
            // =====================================================
            addSectionTitle(document, "Gold Collection Report");

            if (!goldEntries.isEmpty()) {
                String[] goldHeaders = {"S.No", "Name", "Village", "Gold Details"};
                XWPFTable goldTable = document.createTable(1, goldHeaders.length);
                goldTable.setWidth("100%");
                styleHeaderRow(goldTable.getRow(0), goldHeaders);

                int sno2 = 1;
                for (GoldEntry ge : goldEntries) {
                    XWPFTableRow row = goldTable.createRow();
                    boolean isAlt = (sno2 % 2 == 0);
                    setCellText(row.getCell(0), String.valueOf(sno2++), isAlt, true);
                    setCellText(row.getCell(1), ge.getContributor().getName(), isAlt, false);
                    setCellText(row.getCell(2), ge.getContributor().getVillage(), isAlt, false);
                    setCellText(row.getCell(3), ge.getGoldDetails(), isAlt, false);
                }
            } else {
                addNoteText(document, "No Gold entries found for this event.");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.write(out);
            return out.toByteArray();
        }
    }

    // ─── Helper: Big section title ──────────────────────────────────────────
    private void addSectionTitle(XWPFDocument document, String titleText) {
        XWPFParagraph para = document.createParagraph();
        para.setAlignment(ParagraphAlignment.CENTER);
        para.setSpacingBefore(200);
        para.setSpacingAfter(200);
        XWPFRun run = para.createRun();
        run.setText(titleText);
        run.setBold(true);
        run.setFontSize(16);
        run.setColor(HEADER_COLOR);
        run.setFontFamily("Calibri");
    }

    // ─── Helper: Italic grey note ───────────────────────────────────────────
    private void addNoteText(XWPFDocument document, String note) {
        XWPFParagraph para = document.createParagraph();
        XWPFRun run = para.createRun();
        run.setText(note);
        run.setItalic(true);
        run.setColor("888888");
        run.setFontFamily("Calibri");
    }

    // ─── Helper: Style header row (blue background + white bold text) ────────
    private void styleHeaderRow(XWPFTableRow headerRow, String[] headers) {
        for (int i = 0; i < headers.length; i++) {
            XWPFTableCell cell = headerRow.getCell(i);
            cell.setColor(HEADER_COLOR);
            XWPFParagraph para = cell.getParagraphs().get(0);
            para.setAlignment(ParagraphAlignment.CENTER);
            clearRuns(para);
            XWPFRun run = para.createRun();
            run.setText(headers[i]);
            run.setBold(true);
            run.setColor(WHITE);
            run.setFontSize(11);
            run.setFontFamily("Calibri");
        }
    }

    // ─── Helper: Cell with alternating background ───────────────────────────
    private void setCellText(XWPFTableCell cell, String text, boolean isAlt, boolean centered) {
        if (isAlt) {
            cell.setColor(ALT_ROW_COLOR);
        }
        XWPFParagraph para = cell.getParagraphs().get(0);
        para.setAlignment(centered ? ParagraphAlignment.CENTER : ParagraphAlignment.LEFT);
        clearRuns(para);
        XWPFRun run = para.createRun();
        run.setText(text == null ? "" : text);
        run.setFontSize(10);
        run.setFontFamily("Calibri");
    }

    // ─── Helper: Cell with a specific background color and bold text ─────────
    private void setCellWithColor(XWPFTableCell cell, String text, String color, boolean centered) {
        cell.setColor(color);
        XWPFParagraph para = cell.getParagraphs().get(0);
        para.setAlignment(centered ? ParagraphAlignment.CENTER : ParagraphAlignment.LEFT);
        clearRuns(para);
        XWPFRun run = para.createRun();
        run.setText(text == null ? "" : text);
        run.setBold(true);
        run.setFontSize(11);
        run.setFontFamily("Calibri");
    }

    // ─── Helper: Remove all runs from a paragraph ────────────────────────────
    private void clearRuns(XWPFParagraph para) {
        for (int r = para.getRuns().size() - 1; r >= 0; r--) {
            para.removeRun(r);
        }
    }
}
