using Microsoft.EntityFrameworkCore;
using NPOI.XWPF.UserModel;
using MoiBackend.Core.Interfaces;
using MoiBackend.Infrastructure.Data;

namespace MoiBackend.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly MoiDbContext _dbContext;

    private const string HeaderColor = "2B5797";   // Dark blue
    private const string AltRowColor = "EEF2FF";  // Light blue
    private const string TotalRowColor = "DBEAFE"; // Soft blue for total
    private const string White = "FFFFFF";

    public ReportService(MoiDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<byte[]> GenerateOverallWordReportAsync(long eventId)
    {
        var moiTransactions = await _dbContext.MoiTransactions
            .AsNoTracking()
            .Where(t => t.EventId == eventId)
            .Include(t => t.Contributor)
            .ToListAsync();

        var goldEntries = await _dbContext.GoldEntries
            .AsNoTracking()
            .Where(g => g.EventId == eventId)
            .Include(g => g.Contributor)
            .ToListAsync();

        // Sort both lists by village name (ascending, case-insensitive)
        moiTransactions = moiTransactions
            .OrderBy(tx => tx.Contributor?.Village ?? "", StringComparer.OrdinalIgnoreCase)
            .ToList();

        goldEntries = goldEntries
            .OrderBy(ge => ge.Contributor?.Village ?? "", StringComparer.OrdinalIgnoreCase)
            .ToList();

        using var doc = new XWPFDocument();

        // =====================================================
        // MOI COLLECTION REPORT
        // =====================================================
        AddSectionTitle(doc, "Moi Collection Report");

        if (moiTransactions.Count > 0)
        {
            string[] moiHeaders = { "S.No", "Name", "Village", "Amount (Rs)" };
            var moiTable = doc.CreateTable(1, moiHeaders.Length);
            moiTable.Width = 5000;
            StyleHeaderRow(moiTable.GetRow(0), moiHeaders);

            decimal grandTotal = 0;
            int sno = 1;
            foreach (var tx in moiTransactions)
            {
                grandTotal += tx.Amount;
                var row = moiTable.CreateRow();
                bool isAlt = (sno % 2 == 0);
                SetCellText(row.GetCell(0), (sno++).ToString(), isAlt, true);
                SetCellText(row.GetCell(1), tx.Contributor?.Name ?? "", isAlt, false);
                SetCellText(row.GetCell(2), tx.Contributor?.Village ?? "", isAlt, false);
                SetCellText(row.GetCell(3), "Rs. " + tx.Amount.ToString("0.00"), isAlt, true);
            }

            // Grand Total row
            var totalRow = moiTable.CreateRow();
            SetCellWithColor(totalRow.GetCell(0), "", TotalRowColor, false);
            SetCellWithColor(totalRow.GetCell(1), "", TotalRowColor, false);
            SetCellWithColor(totalRow.GetCell(2), "GRAND TOTAL :", TotalRowColor, true);
            SetCellWithColor(totalRow.GetCell(3), "Rs. " + grandTotal.ToString("0.00"), TotalRowColor, true);
        }
        else
        {
            AddNoteText(doc, "No Moi entries found for this event.");
        }

        // Page break
        var breakPara = doc.CreateParagraph();
        breakPara.CreateRun().AddBreak(BreakType.PAGE);

        // =====================================================
        // GOLD COLLECTION REPORT
        // =====================================================
        AddSectionTitle(doc, "Gold Collection Report");

        if (goldEntries.Count > 0)
        {
            string[] goldHeaders = { "S.No", "Name", "Village", "Gold Details" };
            var goldTable = doc.CreateTable(1, goldHeaders.Length);
            goldTable.Width = 5000;
            StyleHeaderRow(goldTable.GetRow(0), goldHeaders);

            int sno2 = 1;
            foreach (var ge in goldEntries)
            {
                var row = goldTable.CreateRow();
                bool isAlt = (sno2 % 2 == 0);
                SetCellText(row.GetCell(0), (sno2++).ToString(), isAlt, true);
                SetCellText(row.GetCell(1), ge.Contributor?.Name ?? "", isAlt, false);
                SetCellText(row.GetCell(2), ge.Contributor?.Village ?? "", isAlt, false);
                SetCellText(row.GetCell(3), ge.GoldDetails, isAlt, false);
            }
        }
        else
        {
            AddNoteText(doc, "No Gold entries found for this event.");
        }

        using var ms = new MemoryStream();
        doc.Write(ms);
        return ms.ToArray();
    }

    private static void AddSectionTitle(XWPFDocument doc, string titleText)
    {
        var para = doc.CreateParagraph();
        para.Alignment = ParagraphAlignment.CENTER;
        para.SpacingBefore = 200;
        para.SpacingAfter = 200;
        var run = para.CreateRun();
        run.SetText(titleText);
        run.IsBold = true;
        run.FontSize = 16;
        run.SetColor(HeaderColor);
        run.FontFamily = "Calibri";
    }

    private static void AddNoteText(XWPFDocument doc, string note)
    {
        var para = doc.CreateParagraph();
        var run = para.CreateRun();
        run.SetText(note);
        run.IsItalic = true;
        run.SetColor("888888");
        run.FontFamily = "Calibri";
    }

    private static void StyleHeaderRow(XWPFTableRow headerRow, string[] headers)
    {
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = headerRow.GetCell(i);
            cell.SetColor(HeaderColor);
            var para = cell.Paragraphs[0];
            para.Alignment = ParagraphAlignment.CENTER;
            ClearRuns(para);
            var run = para.CreateRun();
            run.SetText(headers[i]);
            run.IsBold = true;
            run.SetColor(White);
            run.FontSize = 11;
            run.FontFamily = "Calibri";
        }
    }

    private static void SetCellText(XWPFTableCell cell, string text, bool isAlt, bool centered)
    {
        if (isAlt)
        {
            cell.SetColor(AltRowColor);
        }
        var para = cell.Paragraphs[0];
        para.Alignment = centered ? ParagraphAlignment.CENTER : ParagraphAlignment.LEFT;
        ClearRuns(para);
        var run = para.CreateRun();
        run.SetText(text ?? "");
        run.FontSize = 10;
        run.FontFamily = "Calibri";
    }

    private static void SetCellWithColor(XWPFTableCell cell, string text, string color, bool centered)
    {
        cell.SetColor(color);
        var para = cell.Paragraphs[0];
        para.Alignment = centered ? ParagraphAlignment.CENTER : ParagraphAlignment.LEFT;
        ClearRuns(para);
        var run = para.CreateRun();
        run.SetText(text ?? "");
        run.IsBold = true;
        run.FontSize = 11;
        run.FontFamily = "Calibri";
    }

    private static void ClearRuns(XWPFParagraph para)
    {
        for (int r = para.Runs.Count - 1; r >= 0; r--)
        {
            para.RemoveRun(r);
        }
    }
}
