import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ZeTheme {
  static const Color darkBg = Color(0xFF0F172A); // Slate-900
  static const Color darkCard = Color(0xFF1E293B); // Slate-800
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkBorder = Color(0xFF334155); // Slate-700
  
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightCard = Colors.white;
  static const Color lightSurface = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);

  // Accents
  static const Color primary = Color(0xFF4F46E5); // Indigo
  static const Color secondary = Color(0xFF0E7490); // Teal-cyan
  static const Color accent = Color(0xFFEC4899); // Pink
  
  // Status Colors
  static const Color statusOpen = Color(0xFF3B82F6); // Blue
  static const Color statusInProgress = Color(0xFFF59E0B); // Amber
  static const Color statusWaiting = Color(0xFF8B5CF6); // Purple
  static const Color statusResolved = Color(0xFF10B981); // Emerald
  static const Color statusClosed = Color(0xFF64748B); // Slate

  // Priority Colors
  static const Color priorityLow = Color(0xFF64748B);
  static const Color priorityMedium = Color(0xFF3B82F6);
  static const Color priorityHigh = Color(0xFFF59E0B);
  static const Color priorityUrgent = Color(0xFFEF4444);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      primaryColor: primary,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: secondary,
        tertiary: accent,
        background: darkBg,
        surface: darkCard,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        error: Colors.redAccent,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22, color: Colors.white),
        titleMedium: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 18, color: Colors.white),
        bodyLarge: GoogleFonts.outfit(fontSize: 16, color: const Color(0xFFE2E8F0)),
        bodyMedium: GoogleFonts.outfit(fontSize: 14, color: Colors.white70),
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: darkBorder, width: 1),
        ),
      ),
      dividerColor: darkBorder,
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: Colors.white),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBg,
      primaryColor: primary,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: secondary,
        tertiary: accent,
        background: lightBg,
        surface: lightCard,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        error: Colors.red,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme).copyWith(
        titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22, color: Colors.black87),
        titleMedium: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 18, color: Colors.black87),
        bodyLarge: GoogleFonts.outfit(fontSize: 16, color: Colors.black87),
        bodyMedium: GoogleFonts.outfit(fontSize: 14, color: Colors.black54),
      ),
      cardTheme: CardThemeData(
        color: lightCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightBorder, width: 1),
        ),
      ),
      dividerColor: lightBorder,
      appBarTheme: const AppBarTheme(
        backgroundColor: lightBg,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: Colors.black87),
      ),
    );
  }

  // Theme-aware color and text helpers
  static Color cardBg(BuildContext context) => Theme.of(context).cardTheme.color ?? lightCard;
  static Color border(BuildContext context) => Theme.of(context).dividerColor;
  static Color surface(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? darkSurface : lightSurface;
  static Color textPrimary(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A);
  static Color textSecondary(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? Colors.white70 : const Color(0xFF475569);
  static Color textMuted(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? Colors.white38 : const Color(0xFF94A3B8);
  static Color textDimmish(BuildContext context) => Theme.of(context).brightness == Brightness.dark ? Colors.white60 : const Color(0xFF64748B);
}
