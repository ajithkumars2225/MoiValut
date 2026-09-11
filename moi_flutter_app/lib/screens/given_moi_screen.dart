import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/given_moi_entry.dart';
import '../services/api_service.dart';
import '../services/pdf_service.dart';
import '../services/transliteration_service.dart';

class GivenMoiScreen extends StatefulWidget {
  const GivenMoiScreen({super.key});

  @override
  State<GivenMoiScreen> createState() => _GivenMoiScreenState();
}

class _GivenMoiScreenState extends State<GivenMoiScreen> {
  String _searchQuery = '';

  void _openAddEditModal([GivenMoiEntryModel? existing]) {
    final nameCtrl = TextEditingController(text: existing?.recipientName ?? '');
    final villageCtrl = TextEditingController(text: existing?.village ?? '');
    final occasionCtrl = TextEditingController(text: existing?.occasion ?? 'Marriage');
    final amountCtrl = TextEditingController(text: existing?.amount.toStringAsFixed(0) ?? '');
    final notesCtrl = TextEditingController(text: existing?.notes ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1B4B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            top: 20,
            left: 20,
            right: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  existing == null ? 'Record Given Gift (எழுதிய மொய்)' : 'Edit Given Gift',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const Divider(color: Colors.white12),
                const SizedBox(height: 10),
                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white),
                  onChanged: (val) {
                    final converted = TransliterationService.transliterateWord(val);
                    if (converted != val) {
                      nameCtrl.value = TextEditingValue(
                        text: converted,
                        selection: TextSelection.collapsed(offset: converted.length),
                      );
                    }
                  },
                  decoration: const InputDecoration(
                    labelText: 'Recipient Name (பெயர்)',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Colors.black26,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: villageCtrl,
                  style: const TextStyle(color: Colors.white),
                  onChanged: (val) {
                    final converted = TransliterationService.transliterateWord(val);
                    if (converted != val) {
                      villageCtrl.value = TextEditingValue(
                        text: converted,
                        selection: TextSelection.collapsed(offset: converted.length),
                      );
                    }
                  },
                  decoration: const InputDecoration(
                    labelText: 'Village (ஊர்)',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Colors.black26,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: occasionCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Occasion (நிகழ்ச்சி)',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Colors.black26,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Given Amount (தொகை ₹)',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Colors.black26,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Notes (குறிப்பு)',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Colors.black26,
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7C3AED)),
                    onPressed: () async {
                      final provider = context.read<AppProvider>();
                      final amt = double.tryParse(amountCtrl.text) ?? 0.0;

                      final entry = GivenMoiEntryModel(
                        id: existing?.id ?? 0,
                        recipientName: nameCtrl.text.trim(),
                        village: villageCtrl.text.trim(),
                        occasion: occasionCtrl.text.trim(),
                        amount: amt,
                        givenDate: existing?.givenDate ?? DateTime.now(),
                        notes: notesCtrl.text.trim(),
                      );

                      bool success;
                      if (existing == null) {
                        success = await ApiService.createGivenMoiEntry(entry);
                      } else {
                        success = await ApiService.updateGivenMoiEntry(existing.id, entry);
                      }

                      if (mounted) {
                        Navigator.pop(ctx);
                        if (success) {
                          provider.fetchAllDataForSelectedEvent();
                        }
                      }
                    },
                    child: Text(existing == null ? 'Save Entry (சேமி)' : 'Update Entry', style: const TextStyle(color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final entries = provider.givenMoiEntries.where((e) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return e.recipientName.toLowerCase().contains(q) || e.village.toLowerCase().contains(q);
    }).toList();

    final totalGiven = entries.fold(0.0, (sum, e) => sum + e.amount);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              color: const Color(0xFF1E1B4B),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Given Moi Ledger (எழுதிய மொய்)',
                              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                            Text(
                              'Total Given: ₹ ${totalGiven.toStringAsFixed(0)} (${entries.length} entries)',
                              style: const TextStyle(color: Color(0xFFA78BFA), fontSize: 12, fontWeight: FontWeight.w600),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.picture_as_pdf, color: Colors.amber),
                        onPressed: () {
                          PdfService.printGivenMoiReport(entries);
                        },
                        tooltip: 'Print PDF (3cm Binding Margin)',
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search recipient, village...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      prefixIcon: const Icon(Icons.search, color: Colors.white38, size: 18),
                      filled: true,
                      fillColor: Colors.black26,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: entries.length,
                itemBuilder: (ctx, idx) {
                  final item = entries[idx];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    color: const Color(0xFF1E1B4B).withValues(alpha: 0.8),
                    child: ListTile(
                      title: Text(
                        item.recipientName,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        '${item.village} • ${item.occasion}',
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('₹ ${item.amount.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFFA78BFA), fontWeight: FontWeight.bold, fontSize: 15)),
                            IconButton(
                              icon: const Icon(Icons.edit, color: Colors.blueAccent, size: 18),
                              onPressed: () => _openAddEditModal(item),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.redAccent, size: 18),
                              onPressed: () async {
                                final ok = await ApiService.deleteGivenMoiEntry(item.id);
                                if (ok) provider.fetchAllDataForSelectedEvent();
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF7C3AED),
        onPressed: () => _openAddEditModal(),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
