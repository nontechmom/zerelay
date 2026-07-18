import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/state.dart';
import '../theme/theme.dart';
import '../widgets/custom_visuals.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  static const String _backendBaseUrl = String.fromEnvironment(
    'BACKEND_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  String _webhookEndpoint(String token) {
    final baseUrl = _backendBaseUrl.endsWith('/') ? _backendBaseUrl.substring(0, _backendBaseUrl.length - 1) : _backendBaseUrl;
    return '$baseUrl/api/resend/webhooks/$token';
  }

  final List<Map<String, String>> _slides = [
    {
      'title': 'Stop reading JSON.',
      'subtitle': 'Start reading emails.',
      'description': 'ZeRelay transforms inbound webhook payloads into a gorgeous, readable mobile inbox optimized for developers and SaaS teams.',
    },
    {
      'title': 'Email Workspace.',
      'subtitle': 'Built for collaboration.',
      'description': 'Assign conversations, leave internal team comments, track statuses, and reply directly using Resend\'s powerful mail APIs.',
    },
    {
      'title': 'Connect with Resend.',
      'subtitle': 'Mobile-safe access.',
      'description': 'Use Resend OAuth when available so ZeRelay can access domains, outbound history, and inbound webhooks without shipping secrets in the app.',
    }
  ];

  Widget _getIllustration(int page) {
    switch (page) {
      case 0:
        return const WelcomeMailIllustration();
      case 1:
        return const CollaborationConnectIllustration();
      case 2:
      default:
        return const APIKeyVerifyIllustration();
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeUser = ref.watch(activeUserProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0E7490), // Teal presentation background
      body: SafeArea(
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 350, maxHeight: 620),
            margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B), // Dark slate-800 card screen
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: const Color(0xFF334155), width: 1.5), // Slate-700 border
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.24),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                // Top Header Logo & Name
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const ZeLogo(size: 28),
                    const SizedBox(width: 8),
                    Text(
                      'ZeRelay',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                        letterSpacing: -0.5,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Illustration view area
                Expanded(
                  flex: 4,
                  child: Center(
                    child: _getIllustration(_currentPage)
                        .animate(key: ValueKey(_currentPage))
                        .scale(duration: 400.ms, curve: Curves.easeOutBack),
                  ),
                ),
                const SizedBox(height: 12),

                // Slide contents (Title & body)
                Expanded(
                  flex: 5,
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (idx) {
                      setState(() {
                        _currentPage = idx;
                      });
                    },
                    itemCount: _slides.length,
                    itemBuilder: (context, index) {
                      final slide = _slides[index];
                      return SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              slide['title']!,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.outfit(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.8,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              slide['subtitle']!,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF818CF8), // Light indigo accent
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8.0),
                              child: Text(
                                slide['description']!,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  color: const Color(0xFF94A3B8), // Slate-400 muted text
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Interactive elements & forms
                if (_currentPage == 2) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.verified_user, color: Color(0xFF818CF8), size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'OAuth keeps Resend credentials on the backend. API-key entry is now a backend-only fallback for local testing.',
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              color: const Color(0xFF94A3B8),
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(duration: 200.ms),
                  const SizedBox(height: 12),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Webhook configuration',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Set this endpoint in Resend so inbound mail reaches ZeRelay.',
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            color: const Color(0xFF94A3B8),
                            height: 1.35,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: Text(
                            _webhookEndpoint(activeUser.webhookToken),
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              color: const Color(0xFF818CF8),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Build with BACKEND_BASE_URL to show your deployed webhook host.',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(duration: 250.ms),
                  const SizedBox(height: 12),
                ],

                // Dot page indicator
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    _slides.length,
                    (index) => AnimatedContainer(
                      duration: 300.ms,
                      margin: const EdgeInsets.symmetric(horizontal: 4.0),
                      width: _currentPage == index ? 20.0 : 8.0,
                      height: 8.0,
                      decoration: BoxDecoration(
                        color: _currentPage == index ? const Color(0xFF818CF8) : const Color(0xFF334155),
                        borderRadius: BorderRadius.circular(4.0),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Button control row
                if (_currentPage < 2)
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        _pageController.nextPage(
                          duration: 300.ms,
                          curve: Curves.easeInOut,
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5), // Indigo primary
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Next',
                            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_forward, size: 16),
                        ],
                      ),
                    ),
                  )
                else
                  Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () {
                            ref.read(activeUserProvider.notifier).state = activeUser.copyWith(
                              resendConnectionMethod: 'oauth',
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Resend OAuth connection marked for this prototype.'),
                                backgroundColor: ZeTheme.statusResolved,
                              ),
                            );
                            context.go('/inbox');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4F46E5),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                          ),
                          child: Text(
                            'Connect with Resend'
                            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          context.go('/inbox');
                        },
                        child: Text(
                          'Skip for now',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF94A3B8), // Slate-400
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
