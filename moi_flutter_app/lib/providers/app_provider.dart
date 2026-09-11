import 'package:flutter/material.dart';
import '../models/event.dart';
import '../models/moi_entry.dart';
import '../models/given_moi_entry.dart';
import '../models/gold_entry.dart';
import '../models/conflict_record.dart';
import '../services/api_service.dart';

class AppProvider extends ChangeNotifier {
  List<EventModel> events = [];
  EventModel? selectedEvent;

  List<MoiEntryModel> moiEntries = [];
  List<GivenMoiEntryModel> givenMoiEntries = [];
  List<GoldEntryModel> goldEntries = [];
  List<ConflictRecordModel> conflictRecords = [];

  bool isLoading = false;
  bool isFilterExpanded = false;

  // Filter criteria for Cash Gifts
  String moiSearchQuery = '';
  String moiVillageFilter = 'all';
  String moiAmountOp = 'all'; // all, =, >, >=, <, <=, !=, between
  double? moiAmountVal;
  double? moiMinAmount;
  double? moiMaxAmount;

  void toggleFilterExpanded() {
    isFilterExpanded = !isFilterExpanded;
    notifyListeners();
  }

  void setFilterExpanded(bool val) {
    isFilterExpanded = val;
    notifyListeners();
  }

  void setMoiSearchQuery(String val) {
    moiSearchQuery = val;
    notifyListeners();
  }

  void setMoiAmountOp(String val) {
    moiAmountOp = val;
    notifyListeners();
  }

  void resetMoiFilters() {
    moiSearchQuery = '';
    moiVillageFilter = 'all';
    moiAmountOp = 'all';
    moiAmountVal = null;
    moiMinAmount = null;
    moiMaxAmount = null;
    notifyListeners();
  }

  Future<void> fetchEvents() async {
    isLoading = true;
    notifyListeners();

    events = await ApiService.getEvents();
    if (events.isNotEmpty && selectedEvent == null) {
      selectedEvent = events.firstWhere((e) => e.id == 2, orElse: () => events.first);
    }

    await fetchAllDataForSelectedEvent();
  }

  void selectEvent(EventModel event) {
    selectedEvent = event;
    notifyListeners();
    fetchAllDataForSelectedEvent();
  }

  Future<void> fetchAllDataForSelectedEvent() async {
    isLoading = true;
    notifyListeners();

    final eventId = selectedEvent?.id ?? 0;
    moiEntries = await ApiService.getMoiEntries(eventId);
    givenMoiEntries = await ApiService.getGivenMoiEntries();
    goldEntries = await ApiService.getGoldEntries(eventId);
    conflictRecords = await ApiService.getConflictRecords();

    isLoading = false;
    notifyListeners();
  }

  // Filtered Cash Gifts
  List<MoiEntryModel> get filteredMoiEntries {
    return moiEntries.where((e) {
      if (moiSearchQuery.isNotEmpty) {
        final q = moiSearchQuery.toLowerCase();
        final nameMatch = e.contributorName.toLowerCase().contains(q);
        final vilMatch = e.village.toLowerCase().contains(q);
        if (!nameMatch && !vilMatch) return false;
      }

      if (moiVillageFilter != 'all' && e.village != moiVillageFilter) {
        return false;
      }

      if (moiAmountOp != 'all') {
        if (moiAmountOp == '=' && moiAmountVal != null && e.amount != moiAmountVal) return false;
        if (moiAmountOp == '>' && moiAmountVal != null && e.amount <= moiAmountVal!) return false;
        if (moiAmountOp == '>=' && moiAmountVal != null && e.amount < moiAmountVal!) return false;
        if (moiAmountOp == '<' && moiAmountVal != null && e.amount >= moiAmountVal!) return false;
        if (moiAmountOp == '<=' && moiAmountVal != null && e.amount > moiAmountVal!) return false;
        if (moiAmountOp == '!=' && moiAmountVal != null && e.amount == moiAmountVal) return false;
        if (moiAmountOp == 'between') {
          if (moiMinAmount != null && e.amount < moiMinAmount!) return false;
          if (moiMaxAmount != null && e.amount > moiMaxAmount!) return false;
        }
      }

      return true;
    }).toList();
  }
}
