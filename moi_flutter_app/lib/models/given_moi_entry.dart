class GivenMoiEntryModel {
  final int id;
  final String recipientName;
  final String village;
  final String occasion;
  final double amount;
  final DateTime givenDate;
  final String? notes;

  GivenMoiEntryModel({
    required this.id,
    required this.recipientName,
    required this.village,
    required this.occasion,
    required this.amount,
    required this.givenDate,
    this.notes,
  });

  factory GivenMoiEntryModel.fromJson(Map<String, dynamic> json) {
    return GivenMoiEntryModel(
      id: json['id'] ?? 0,
      recipientName: json['recipientName'] ?? json['recipient_name'] ?? json['name'] ?? '',
      village: json['village'] ?? '',
      occasion: json['occasion'] ?? '',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      givenDate: json['givenDate'] != null
          ? DateTime.tryParse(json['givenDate']) ?? DateTime.now()
          : DateTime.now(),
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'recipientName': recipientName,
      'village': village,
      'occasion': occasion,
      'amount': amount,
      'givenDate': givenDate.toIso8601String(),
      'notes': notes,
    };
  }
}
