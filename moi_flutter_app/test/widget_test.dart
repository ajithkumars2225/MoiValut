import 'package:flutter_test/flutter_test.dart';
import 'package:moi_flutter_app/main.dart';

void main() {
  testWidgets('App loads test', (WidgetTester tester) async {
    await tester.pumpWidget(const MoiFlutterApp());
    expect(find.text('Moi Notebook Ledger'), findsOneWidget);
  });
}
