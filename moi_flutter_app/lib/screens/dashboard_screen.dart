import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/event.dart';
import 'moi_entry_screen.dart';
import 'given_moi_screen.dart';
import 'gold_entry_screen.dart';
import 'conflict_records_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  final List<Widget> _pages = const [
    MoiEntryScreen(),
    GivenMoiScreen(),
    GoldEntryScreen(),
    ConflictRecordsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<AppProvider>();
      if (provider.events.isEmpty || provider.selectedEvent == null) {
        provider.fetchEvents();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E1B4B),
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.menu_book, color: Color(0xFFA78BFA), size: 22),
            const SizedBox(width: 8),
            Expanded(
              child: DropdownButtonHideUnderline(
                child: DropdownButton<EventModel>(
                  value: provider.selectedEvent,
                  dropdownColor: const Color(0xFF1E1B4B),
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  icon: const Icon(Icons.arrow_drop_down, color: Color(0xFFA78BFA)),
                  items: provider.events.map((e) {
                    return DropdownMenuItem<EventModel>(
                      value: e,
                      child: Text(e.name, overflow: TextOverflow.ellipsis),
                    );
                  }).toList(),
                  onChanged: (evt) {
                    if (evt != null) {
                      provider.selectEvent(evt);
                    }
                  },
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: () => provider.fetchAllDataForSelectedEvent(),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
          ),
        ],
      ),
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (idx) => setState(() => _selectedIndex = idx),
        backgroundColor: const Color(0xFF1E1B4B),
        selectedItemColor: const Color(0xFFA78BFA),
        unselectedItemColor: Colors.white38,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet),
            label: 'Cash Gifts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_book),
            label: 'Given Moi',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.stars),
            label: 'Gold Gifts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.compare_arrows),
            label: 'Conflicts',
          ),
        ],
      ),
    );
  }
}
