class MoiEntryModel {
  final int id;
  final int eventId;
  final int serialNo;
  final String contributorName;
  final String village;
  final double amount;
  final String? giftTerm;
  final String? prevReturnInfo;
  final double? returnAmount;
  final String? notes;
  final DateTime createdAt;

  MoiEntryModel({
    required this.id,
    required this.eventId,
    required this.serialNo,
    required this.contributorName,
    required this.village,
    required this.amount,
    this.giftTerm,
    this.prevReturnInfo,
    this.returnAmount,
    this.notes,
    required this.createdAt,
  });

  factory MoiEntryModel.fromJson(Map<String, dynamic> json) {
    return MoiEntryModel(
      id: json['transactionId'] ?? json['id'] ?? 0,
      eventId: json['eventId'] ?? 0,
      serialNo: json['serialNumber'] ?? json['serialNo'] ?? json['serial_no'] ?? 0,
      contributorName: json['contributorName'] ?? json['contributor_name'] ?? json['name'] ?? '',
      village: json['village'] ?? '',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      giftTerm: json['giftTerm'] ?? json['gift_term'],
      prevReturnInfo: json['prevReturnInfo'] ?? json['prev_return_info'],
      returnAmount: json['returnAmount'] != null ? (json['returnAmount'] as num).toDouble() : null,
      notes: json['notes'],
      createdAt: json['transactionDate'] != null
          ? DateTime.tryParse(json['transactionDate']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'serialNo': serialNo,
      'contributorName': contributorName,
      'village': village,
      'amount': amount,
      'giftTerm': giftTerm,
      'prevReturnInfo': prevReturnInfo,
      'returnAmount': returnAmount,
      'notes': notes,
    };
  }
}
