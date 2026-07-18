import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/theme.dart';

// --- ZeRelay Scalable Brand Logo ---
class ZeLogo extends StatelessWidget {
  final double size;
  const ZeLogo({super.key, this.size = 48});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            ZeTheme.primary,
            Color(0xFF6366F1), // Bright Indigo
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: ZeTheme.primary.withOpacity(0.3),
            blurRadius: size * 0.25,
            offset: Offset(0, size * 0.08),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          LucideIcons.mail,
          color: Colors.white,
          size: size * 0.5,
        ),
      ),
    );
  }
}

// --- Illustration 1: Welcome & Inbox (Slide 1) ---
class WelcomeMailIllustration extends StatelessWidget {
  final double size;
  const WelcomeMailIllustration({super.key, this.size = 140});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Circular Background Splash (Lavender)
          Container(
            width: size * 0.85,
            height: size * 0.85,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFEEF2FF), // Very soft lavender/indigo splash
            ),
          ),
          // Sub-circles/Dots (Flat design cue)
          Positioned(
            top: size * 0.15,
            right: size * 0.15,
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(color: Color(0xFF818CF8), shape: BoxShape.circle),
            ),
          ),
          Positioned(
            bottom: size * 0.2,
            left: size * 0.1,
            child: Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(color: Color(0xFFC7D2FE), shape: BoxShape.circle),
            ),
          ),
          // Main flat graphic: Envelope Card
          Container(
            width: size * 0.55,
            height: size * 0.42,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(width: 12, height: 12, decoration: const BoxDecoration(color: ZeTheme.primary, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Container(width: 32, height: 6, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(3))),
                  ],
                ),
                const SizedBox(height: 8),
                Container(width: size * 0.38, height: 4, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 4),
                Container(width: size * 0.28, height: 4, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(2))),
              ],
            ),
          ),
          // Floating small notification dot badge
          Positioned(
            top: size * 0.22,
            left: size * 0.22,
            child: Container(
              padding: const EdgeInsets.all(5),
              decoration: const BoxDecoration(
                color: Color(0xFF4F46E5), // Indigo badge
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.bell, color: Colors.white, size: 10),
            ),
          ),
        ],
      ),
    );
  }
}

// --- Illustration 2: Team Connections & Collaboration (Slide 2) ---
class CollaborationConnectIllustration extends StatelessWidget {
  final double size;
  const CollaborationConnectIllustration({super.key, this.size = 140});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Circular Background Splash (Soft blue-teal)
          Container(
            width: size * 0.85,
            height: size * 0.85,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFECFDF5), // Soft mint green/teal splash
            ),
          ),
          // Vector Connecting Lines
          CustomPaint(
            size: Size(size * 0.8, size * 0.8),
            painter: LineConnectorPainter(),
          ),
          // User Avatar bubble 1
          Positioned(
            top: size * 0.12,
            left: size * 0.35,
            child: _buildAvatarCircle(LucideIcons.user, const Color(0xFF3B82F6), size * 0.24),
          ),
          // User Avatar bubble 2
          Positioned(
            bottom: size * 0.18,
            left: size * 0.12,
            child: _buildAvatarCircle(LucideIcons.userCheck, const Color(0xFF10B981), size * 0.24),
          ),
          // User Avatar bubble 3
          Positioned(
            bottom: size * 0.18,
            right: size * 0.12,
            child: _buildAvatarCircle(LucideIcons.users, const Color(0xFFF59E0B), size * 0.24),
          ),
          // Central floating chat bubble
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(LucideIcons.messageSquareCode, color: Color(0xFF4F46E5), size: 10),
                const SizedBox(width: 4),
                Text(
                  'Assign',
                  style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarCircle(IconData icon, Color color, double radius) {
    return Container(
      width: radius,
      height: radius,
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        shape: BoxShape.circle,
        border: Border.all(color: color.withOpacity(0.5), width: 1.5),
      ),
      child: Center(
        child: Icon(icon, color: color, size: radius * 0.5),
      ),
    );
  }
}

class LineConnectorPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    
    // Draw lines connecting the three corners (avatars)
    canvas.drawLine(Offset(size.width * 0.5, size.height * 0.25), Offset(size.width * 0.25, size.height * 0.7), paint);
    canvas.drawLine(Offset(size.width * 0.5, size.height * 0.25), Offset(size.width * 0.75, size.height * 0.7), paint);
    canvas.drawLine(Offset(size.width * 0.25, size.height * 0.7), Offset(size.width * 0.75, size.height * 0.7), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// --- Illustration 3: API Key Verification & Shield (Slide 3) ---
class APIKeyVerifyIllustration extends StatelessWidget {
  final double size;
  const APIKeyVerifyIllustration({super.key, this.size = 140});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Circular Background Splash (Soft blue-grey)
          Container(
            width: size * 0.85,
            height: size * 0.85,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFF1F5F9), // Soft slate background
            ),
          ),
          // Shield Graphic
          Positioned(
            top: size * 0.12,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF2FF),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFC7D2FE), width: 1.5),
              ),
              child: const Icon(
                LucideIcons.shieldCheck,
                color: Color(0xFF4F46E5),
                size: 28,
              ),
            ),
          ),
          // Input field visualization (dots + green checkmark)
          Positioned(
            bottom: size * 0.15,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    're_ ',
                    style: GoogleFonts.outfit(fontSize: 10, color: Colors.black45, fontWeight: FontWeight.bold),
                  ),
                  ...List.generate(
                    4,
                    (index) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 2.0),
                      width: 5,
                      height: 5,
                      decoration: const BoxDecoration(color: Color(0xFF4F46E5), shape: BoxShape.circle),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                    child: const Icon(LucideIcons.check, color: Colors.white, size: 8),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// --- Empty State Vector Illustration (Used in Inbox Screen) ---
class EmptyInboxIllustration extends StatelessWidget {
  final double size;
  const EmptyInboxIllustration({super.key, this.size = 140});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Circular Background Splash
          Container(
            width: size,
            height: size,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFEEF2FF),
            ),
          ),
          // Mail Box Icon
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              LucideIcons.inbox,
              color: Color(0xFF4F46E5),
              size: 32,
            ),
          ),
          // Checkmark floating badge overlay
          Positioned(
            bottom: size * 0.15,
            right: size * 0.15,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF10B981),
              ),
              child: const Icon(
                LucideIcons.check,
                color: Colors.white,
                size: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
