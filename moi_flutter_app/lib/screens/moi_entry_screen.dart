import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/moi_entry.dart';
import '../services/api_service.dart';
import '../services/pdf_service.dart';
import '../services/transliteration_service.dart';

class MoiEntryScreen extends StatefulWidget {
  const MoiEntryScreen({super.key});

  @override
  State<MoiEntryScreen> createState() => _MoiEntryScreenState();
}

class _MoiEntryScreenState extends State<MoiEntryScreen> {

  void _openAddEditModal([MoiEntryModel? existing]) {
    final nameCtrl = TextEditingController(text: existing?.contributorName ?? '');
    final villageCtrl = TextEditingController(text: existing?.village ?? '');
    final amountCtrl = TextEditingController(text: existing?.amount.toStringAsFixed(0) ?? '');
    final termCtrl = TextEditingController(text: existing?.giftTerm ?? '1st Time');
    final returnInfoCtrl = TextEditingController(text: existing?.prevReturnInfo ?? '');
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      existing == null ? 'Record Cash Gift (பண மொய்)' : 'Edit Entry',
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white60),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
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
                    labelText: 'Contributor Name (பெயர்)',
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
                  controller: amountCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Amount (தொகை ₹)',
                    labelStyle: TextStyle(color: Colors.white60),
                    filled: true,
                    fillColor: Colors.black26,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: returnInfoCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Prev Return (முந்தைய மொய் விபரம்)',
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
                      final eventId = provider.selectedEvent?.id ?? 0;

                      final entry = MoiEntryModel(
                        id: existing?.id ?? 0,
                        eventId: eventId,
                        serialNo: existing?.serialNo ?? (provider.moiEntries.length + 1),
                        contributorName: nameCtrl.text.trim(),
                        village: villageCtrl.text.trim(),
                        amount: amt,
                        giftTerm: termCtrl.text.trim(),
                        prevReturnInfo: returnInfoCtrl.text.trim(),
                        notes: notesCtrl.text.trim(),
                        createdAt: DateTime.now(),
                      );

                      bool success;
                      if (existing == null) {
                        success = await ApiService.createMoiEntry(entry);
                      } else {
                        success = await ApiService.updateMoiEntry(existing.id, entry);
                      }

                      if (mounted) {
                        Navigator.pop(ctx);
                        if (success) {
                          provider.fetchAllDataForSelectedEvent();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(existing == null ? 'Entry recorded!' : 'Entry updated!')),
                          );
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
    final entries = provider.filteredMoiEntries;

    final totalCash = entries.fold(0.0, (sum, e) => sum + e.amount);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            // Top Toolbar & Stats
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
                              'Moi Cash Gifts (பண மொய்)',
                              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Total: ₹ ${totalCash.toStringAsFixed(0)} (${entries.length} entries)',
                              style: const TextStyle(color: Color(0xFF34D399), fontSize: 12, fontWeight: FontWeight.w600),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.picture_as_pdf, color: Colors.amber),
                            onPressed: () {
                              PdfService.printMoiEntriesReport(
                                provider.selectedEvent?.name ?? 'Moi',
                                entries,
                              );
                            },
                            tooltip: 'Print PDF Report (3cm Binding Margin)',
                          ),
                          IconButton(
                            icon: Icon(
                              Icons.filter_list,
                              color: provider.isFilterExpanded ? Colors.purpleAccent : Colors.white70,
                            ),
                            onPressed: () => provider.toggleFilterExpanded(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    onChanged: (val) {
                      provider.setMoiSearchQuery(val);
                    },
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search name, village...',
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

            // Collapsible Filter Drawer with Collapse (சுருக்குக) Button
            if (provider.isFilterExpanded)
              Container(
                padding: const EdgeInsets.all(12),
                color: const Color(0xFF18153A),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Advanced Filters (வடிகட்டி)',
                          style: TextStyle(color: Color(0xFFA78BFA), fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        InkWell(
                          onTap: () => provider.setFilterExpanded(false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.red.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.red.withValues(alpha: 0.4)),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.keyboard_arrow_up, color: Colors.redAccent, size: 16),
                                SizedBox(width: 2),
                                Text('Collapse (சுருக்குக)', style: TextStyle(color: Colors.redAccent, fontSize: 11)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: provider.moiAmountOp,
                            dropdownColor: const Color(0xFF1E1B4B),
                            style: const TextStyle(color: Colors.white, fontSize: 12),
                            decoration: const InputDecoration(
                              labelText: 'Math Filter',
                              labelStyle: TextStyle(color: Colors.white54, fontSize: 11),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('All Amounts')),
                              DropdownMenuItem(value: '=', child: Text('= Equal to')),
                              DropdownMenuItem(value: '>', child: Text('> Greater than')),
                              DropdownMenuItem(value: '>=', child: Text('>= Greater/Equal')),
                              DropdownMenuItem(value: '<', child: Text('< Less than')),
                              DropdownMenuItem(value: '<=', child: Text('<= Less/Equal')),
                              DropdownMenuItem(value: '!=', child: Text('!= Not Equal')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                provider.setMoiAmountOp(val);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextButton.icon(
                            onPressed: () => provider.resetMoiFilters(),
                            icon: const Icon(Icons.refresh, size: 14, color: Colors.amber),
                            label: const Text('Reset', style: TextStyle(color: Colors.amber, fontSize: 12)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

            // Entries List
            Expanded(
              child: provider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : entries.isEmpty
                      ? const Center(child: Text('No entries found', style: TextStyle(color: Colors.white54)))
                      : ListView.builder(
                          itemCount: entries.length,
                          itemBuilder: (ctx, idx) {
                            final item = entries[idx];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              color: const Color(0xFF1E1B4B).withValues(alpha: 0.8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: Colors.purple.withValues(alpha: 0.3),
                                  child: Text('#${item.serialNo}', style: const TextStyle(color: Colors.white, fontSize: 11)),
                                ),
                                title: Text(
                                  item.contributorName,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                subtitle: Text(
                                  '${item.village} • ${item.giftTerm ?? "1st Time"}',
                                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                trailing: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        '₹ ${item.amount.toStringAsFixed(0)}',
                                        style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.edit, color: Colors.blueAccent, size: 18),
                                        onPressed: () => _openAddEditModal(item),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete, color: Colors.redAccent, size: 18),
                                        onPressed: () async {
                                          final ok = await ApiService.deleteMoiEntry(item.id);
                                          if (ok) {
                                            provider.fetchAllDataForSelectedEvent();
                                          }
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
