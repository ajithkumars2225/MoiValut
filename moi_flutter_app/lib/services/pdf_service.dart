import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/moi_entry.dart';
import '../models/given_moi_entry.dart';

class PdfService {
  /// Generates A4 PDF with exact 30mm (3cm) left margin for book binding
  static Future<void> printMoiEntriesReport(
    String eventName,
    List<MoiEntryModel> entries,
  ) async {
    final doc = pw.Document();

    final totalAmount = entries.fold(0.0, (sum, e) => sum + e.amount);

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4.copyWith(
          marginLeft: 30 * PdfPageFormat.mm, // 3 cm Left Binding Gutter Margin
          marginRight: 10 * PdfPageFormat.mm,
          marginTop: 10 * PdfPageFormat.mm,
          marginBottom: 10 * PdfPageFormat.mm,
        ),
        build: (pw.Context context) => [
          pw.Header(
            level: 0,
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  '$eventName - Cash Gifts Ledger Report',
                  style: pw.TextStyle(
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.purple800,
                  ),
                ),
                pw.Text(
                  'Total: Rs. ${totalAmount.toStringAsFixed(0)} (${entries.length} entries)',
                  style: pw.TextStyle(
                    fontSize: 12,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.green800,
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 10),
          pw.Table.fromTextArray(
            headers: ['S.No', 'Name (பெயர்)', 'Village (ஊர்)', 'Amount (₹)', 'Term', 'Notes'],
            data: entries.map((e) => [
              e.serialNo.toString(),
              e.contributorName,
              e.village,
              'Rs. ${e.amount.toStringAsFixed(0)}',
              e.giftTerm ?? '-',
              e.notes ?? '-',
            ]).toList(),
            headerStyle: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.white,
              fontSize: 10,
            ),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.purple700),
            rowDecoration: const pw.BoxDecoration(
              border: pw.Border(bottom: pw.BorderSide(color: PdfColors.grey300, width: 0.5)),
            ),
            cellAlignment: pw.Alignment.centerLeft,
            cellStyle: const pw.TextStyle(fontSize: 9),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: '${eventName}_Cash_Gifts_Report.pdf',
    );
  }

  static Future<void> printGivenMoiReport(List<GivenMoiEntryModel> entries) async {
    final doc = pw.Document();

    final totalGiven = entries.fold(0.0, (sum, e) => sum + e.amount);

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4.copyWith(
          marginLeft: 30 * PdfPageFormat.mm, // 3 cm Left Binding Gutter Margin
          marginRight: 10 * PdfPageFormat.mm,
          marginTop: 10 * PdfPageFormat.mm,
          marginBottom: 10 * PdfPageFormat.mm,
        ),
        build: (pw.Context context) => [
          pw.Header(
            level: 0,
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'Given Moi Ledger Report (எழுதிய மொய்)',
                  style: pw.TextStyle(
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.purple800,
                  ),
                ),
                pw.Text(
                  'Total Given: Rs. ${totalGiven.toStringAsFixed(0)}',
                  style: pw.TextStyle(
                    fontSize: 12,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.purple900,
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 10),
          pw.Table.fromTextArray(
            headers: ['#', 'Recipient Name', 'Village', 'Occasion', 'Amount (₹)', 'Date'],
            data: entries.asMap().entries.map((item) {
              final idx = item.key + 1;
              final e = item.value;
              return [
                idx.toString(),
                e.recipientName,
                e.village,
                e.occasion,
                'Rs. ${e.amount.toStringAsFixed(0)}',
                e.givenDate.toIso8601String().substring(0, 10),
              ];
            }).toList(),
            headerStyle: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.white,
              fontSize: 10,
            ),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.purple700),
            rowDecoration: const pw.BoxDecoration(
              border: pw.Border(bottom: pw.BorderSide(color: PdfColors.grey300, width: 0.5)),
            ),
            cellAlignment: pw.Alignment.centerLeft,
            cellStyle: const pw.TextStyle(fontSize: 9),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'Given_Moi_Ledger_Report.pdf',
    );
  }
}
