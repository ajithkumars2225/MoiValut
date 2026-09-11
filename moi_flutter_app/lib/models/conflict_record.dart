class ConflictRecordModel {
  final int id;
  final String recipientName;
  final String? village;
  final double givenAmount;
  final double returnAmount;
  final String conflictStatus;
  final String? conflictNote;
  final DateTime checkedAt;

  ConflictRecordModel({
    required this.id,
    required this.recipientName,
    this.village,
    required this.givenAmount,
    required this.returnAmount,
    required this.conflictStatus,
    this.conflictNote,
    required this.checkedAt,
  });

  double get difference => (returnAmount - givenAmount).abs();

  factory ConflictRecordModel.fromJson(Map<String, dynamic> json) {
    return ConflictRecordModel(
      id: json['id'] ?? 0,
      recipientName: json['recipientName'] ?? json['recipient_name'] ?? '',
      village: json['village'],
      givenAmount: (json['givenAmount'] is num) ? (json['givenAmount'] as num).toDouble() : 0.0,
      returnAmount: (json['returnAmount'] is num) ? (json['returnAmount'] as num).toDouble() : 0.0,
      conflictStatus: json['conflictStatus'] ?? json['conflict_status'] ?? 'NoPreviousRecord',
      conflictNote: json['conflictNote'] ?? json['conflict_note'],
      checkedAt: json['checkedAt'] != null ? DateTime.tryParse(json['checkedAt']) ?? DateTime.now() : DateTime.now(),
    );
  }
}
