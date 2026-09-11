import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class ConflictRecordsScreen extends StatelessWidget {
  const ConflictRecordsScreen({super.key});

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case 'Matched':
        bg = Colors.green.withValues(alpha: 0.2);
        fg = const Color(0xFF34D399);
        label = '✅ Matched';
        break;
      case 'Short':
        bg = Colors.amber.withValues(alpha: 0.2);
        fg = const Color(0xFFFBBF24);
        label = '⚠️ Short';
        break;
      case 'Excess':
        bg = const Color(0xFFF43F5E).withValues(alpha: 0.2);
        fg = const Color(0xFFF43F5E);
        label = '🔺 Excess';
        break;
      default:
        bg = Colors.grey.withValues(alpha: 0.2);
        fg = Colors.white70;
        label = '❓ No Record';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: fg.withValues(alpha: 0.4)),
      ),
      child: Text(label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final records = provider.conflictRecords;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              color: const Color(0xFF1E1B4B),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.purpleAccent),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Conflict Records (மொய் முரண்பாடுகள்)',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: records.isEmpty
                  ? const Center(child: Text('No conflict audit records', style: TextStyle(color: Colors.white54)))
                  : ListView.builder(
                      itemCount: records.length,
                      itemBuilder: (ctx, idx) {
                        final item = records[idx];
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
                              'Given: ₹ ${item.givenAmount.toStringAsFixed(0)} | Returned: ₹ ${item.returnAmount.toStringAsFixed(0)}',
                              style: const TextStyle(color: Colors.white60, fontSize: 12),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: _buildStatusBadge(item.conflictStatus),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
