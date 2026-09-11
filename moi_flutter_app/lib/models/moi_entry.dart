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
    final rawId = json['transactionId'] ?? json['id'];
    final rawSerial = json['serialNumber'] ?? json['serialNo'] ?? json['serial_no'];
    final rawAmt = json['amount'];
    final rawReturnAmt = json['returnAmount'];

    return MoiEntryModel(
      id: rawId is num ? rawId.toInt() : 0,
      eventId: json['eventId'] is num ? (json['eventId'] as num).toInt() : 0,
      serialNo: rawSerial is num ? rawSerial.toInt() : 0,
      contributorName: json['contributorName']?.toString() ?? json['contributor_name']?.toString() ?? json['name']?.toString() ?? '',
      village: json['village']?.toString() ?? '',
      amount: rawAmt is num ? rawAmt.toDouble() : 0.0,
      giftTerm: json['giftTerm']?.toString() ?? json['gift_term']?.toString(),
      prevReturnInfo: json['prevReturnInfo']?.toString() ?? json['prev_return_info']?.toString(),
      returnAmount: rawReturnAmt is num ? rawReturnAmt.toDouble() : null,
      notes: json['notes']?.toString(),
      createdAt: json['transactionDate'] != null
          ? DateTime.tryParse(json['transactionDate'].toString()) ?? DateTime.now()
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
