import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/event.dart';
import '../models/moi_entry.dart';
import '../models/given_moi_entry.dart';
import '../models/gold_entry.dart';
import '../models/conflict_record.dart';

class ApiService {
  // Using explicit IPv4 127.0.0.1 for ADB reverse port 8080 compatibility on Android
  static String baseUrl = 'http://127.0.0.1:8080/api';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // --- Auth ---
  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'] ?? '';
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        await prefs.setString('username', username);
        return {'success': true, 'data': data};
      }
    } catch (e) {
      debugPrint('Login Error: $e');
    }

    return {'success': false, 'message': 'Invalid login credentials'};
  }

  // --- Events ---
  static Future<List<EventModel>> getEvents() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/events'), headers: await _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((e) => EventModel.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('GetEvents Error: $e');
    }
    return [];
  }

  // --- Moi Entries (Cash Gifts) ---
  static Future<List<MoiEntryModel>> getMoiEntries(int eventId) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/moi/event/$eventId'),
        headers: await _headers(),
      );

      if (response.statusCode != 200 || response.body.trim() == '[]') {
        response = await http.get(Uri.parse('$baseUrl/moi'), headers: await _headers());
      }

      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((e) => MoiEntryModel.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('GetMoiEntries Error: $e');
    }
    return [];
  }

  static Future<bool> createMoiEntry(MoiEntryModel entry) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/moi'),
        headers: await _headers(),
        body: jsonEncode(entry.toJson()),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> updateMoiEntry(int id, MoiEntryModel entry) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/moi/$id'),
        headers: await _headers(),
        body: jsonEncode(entry.toJson()),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> deleteMoiEntry(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/moi/$id'),
        headers: await _headers(),
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return false;
    }
  }

  // --- Given Moi Entries ---
  static Future<List<GivenMoiEntryModel>> getGivenMoiEntries() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/given-moi'), headers: await _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((e) => GivenMoiEntryModel.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> createGivenMoiEntry(GivenMoiEntryModel entry) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/given-moi'),
        headers: await _headers(),
        body: jsonEncode(entry.toJson()),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> updateGivenMoiEntry(int id, GivenMoiEntryModel entry) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/given-moi/$id'),
        headers: await _headers(),
        body: jsonEncode(entry.toJson()),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> deleteGivenMoiEntry(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/given-moi/$id'),
        headers: await _headers(),
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return false;
    }
  }

  // --- Gold Entries ---
  static Future<List<GoldEntryModel>> getGoldEntries(int eventId) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/gold/event/$eventId'),
        headers: await _headers(),
      );
      if (response.statusCode != 200 || response.body.trim() == '[]') {
        response = await http.get(Uri.parse('$baseUrl/gold'), headers: await _headers());
      }

      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((e) => GoldEntryModel.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> createGoldEntry(GoldEntryModel entry) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/gold'),
        headers: await _headers(),
        body: jsonEncode(entry.toJson()),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  // --- Conflict Audit Log ---
  static Future<List<ConflictRecordModel>> getConflictRecords() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/conflict'), headers: await _headers());
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((e) => ConflictRecordModel.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }
}
