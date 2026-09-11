import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()),
      ],
      child: const MoiFlutterApp(),
    ),
  );
}

class MoiFlutterApp extends StatelessWidget {
  const MoiFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Moi Notebook (மொய் நோட்டு)',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primaryColor: const Color(0xFF7C3AED),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF7C3AED),
          secondary: Color(0xFFA78BFA),
          surface: Color(0xFF1E1B4B),
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
