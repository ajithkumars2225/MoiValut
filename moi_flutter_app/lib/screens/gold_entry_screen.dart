import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/gold_entry.dart';
import '../services/api_service.dart';
import '../widgets/kpi_card.dart';

class GoldEntryScreen extends StatefulWidget {
  const GoldEntryScreen({super.key});

  @override
  State<GoldEntryScreen> createState() => _GoldEntryScreenState();
}

class _GoldEntryScreenState extends State<GoldEntryScreen> {
  void _openAddModal() {
    final nameCtrl = TextEditingController();
    final villageCtrl = TextEditingController();
    final detailsCtrl = TextEditingController();
    final gramsCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

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
                const Text('Record Gold Gift (பொன்/நகை சேர்க்கை)', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const Divider(color: Colors.white12),
                const SizedBox(height: 10),
                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Contributor Name (பெயர்)', labelStyle: TextStyle(color: Colors.white60), filled: true, fillColor: Colors.black26),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: villageCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Village (ஊர்)', labelStyle: TextStyle(color: Colors.white60), filled: true, fillColor: Colors.black26),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: detailsCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Gold Item Details (எ.கா. 1 பவுன் சங்கிலி)', labelStyle: TextStyle(color: Colors.white60), filled: true, fillColor: Colors.black26),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: gramsCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Weight in Grams (எடை கிராம்)', labelStyle: TextStyle(color: Colors.white60), filled: true, fillColor: Colors.black26),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.amber[700]),
                    onPressed: () async {
                      final provider = context.read<AppProvider>();
                      final entry = GoldEntryModel(
                        id: 0,
                        eventId: provider.selectedEvent?.id ?? 0,
                        contributorName: nameCtrl.text.trim(),
                        village: villageCtrl.text.trim(),
                        goldDetails: detailsCtrl.text.trim(),
                        grams: double.tryParse(gramsCtrl.text) ?? 0.0,
                        notes: notesCtrl.text.trim(),
                        createdAt: DateTime.now(),
                      );
                      final ok = await ApiService.createGoldEntry(entry);
                      if (mounted) {
                        Navigator.pop(ctx);
                        if (ok) provider.fetchAllDataForSelectedEvent();
                      }
                    },
                    child: const Text('Save Gold Gift (சேமி)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
    final entries = provider.goldEntries;

    final totalGrams = entries.fold(0.0, (sum, e) => sum + e.grams);
    final totalSovereigns = totalGrams / 8.0;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: KpiCard(
                      title: 'Total Items',
                      value: '${entries.length}',
                      subtitle: 'Recorded gold items',
                      icon: Icons.monetization_on,
                      accentColor: Colors.amber,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: KpiCard(
                      title: 'Total Weight',
                      value: '${totalGrams.toStringAsFixed(1)} g',
                      subtitle: '~ ${totalSovereigns.toStringAsFixed(2)} Savaram',
                      icon: Icons.workspace_premium,
                      accentColor: const Color(0xFFFBBF24),
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
                      leading: const CircleAvatar(
                        backgroundColor: Colors.amber,
                        child: Icon(Icons.star, color: Colors.black, size: 20),
                      ),
                      title: Text(
                        item.contributorName,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        '${item.village} • ${item.goldDetails}',
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          '${item.grams} g\n(~${item.sovereigns.toStringAsFixed(2)} பவுன்)',
                          textAlign: TextAlign.right,
                          style: const TextStyle(color: Colors.amberAccent, fontWeight: FontWeight.bold, fontSize: 12),
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
        backgroundColor: Colors.amber[700],
        onPressed: _openAddModal,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
