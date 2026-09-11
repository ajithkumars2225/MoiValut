class GoldEntryModel {
  final int id;
  final int eventId;
  final String contributorName;
  final String village;
  final String goldDetails;
  final double grams;
  final String? notes;
  final DateTime createdAt;

  GoldEntryModel({
    required this.id,
    required this.eventId,
    required this.contributorName,
    required this.village,
    required this.goldDetails,
    required this.grams,
    this.notes,
    required this.createdAt,
  });

  double get sovereigns => grams / 8.0;

  factory GoldEntryModel.fromJson(Map<String, dynamic> json) {
    return GoldEntryModel(
      id: json['id'] ?? 0,
      eventId: json['eventId'] ?? 0,
      contributorName: json['contributorName'] ?? json['contributor_name'] ?? '',
      village: json['village'] ?? '',
      goldDetails: json['goldDetails'] ?? json['gold_details'] ?? '',
      grams: (json['grams'] is num) ? (json['grams'] as num).toDouble() : 0.0,
      notes: json['notes'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'contributorName': contributorName,
      'village': village,
      'goldDetails': goldDetails,
      'grams': grams,
      'notes': notes,
    };
  }
}
