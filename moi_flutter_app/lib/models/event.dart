class EventModel {
  final int id;
  final String name;
  final String? description;
  final DateTime? eventDate;
  final bool isClosed;
  final DateTime createdAt;

  EventModel({
    required this.id,
    required this.name,
    this.description,
    this.eventDate,
    this.isClosed = false,
    required this.createdAt,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      eventDate: json['eventDate'] != null ? DateTime.tryParse(json['eventDate']) : null,
      isClosed: json['isClosed'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'eventDate': eventDate?.toIso8601String(),
      'isClosed': isClosed,
    };
  }
}
