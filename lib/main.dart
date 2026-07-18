import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'theme/theme.dart';
import 'screens/onboarding_screen.dart';
import 'screens/inbox_screen.dart';
import 'screens/conversation_detail_screen.dart';
import 'screens/outbound_screen.dart';
import 'screens/domain_screen.dart';
import 'screens/activity_screen.dart';
import 'screens/settings_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

// Router Setup
final GoRouter _router = GoRouter(
  initialLocation: '/onboarding',
  routes: [
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => MainNavigationLayout(child: child),
      routes: [
        GoRoute(
          path: '/inbox',
          builder: (context, state) => const InboxScreen(),
        ),
        GoRoute(
          path: '/outbound',
          builder: (context, state) => const OutboundScreen(),
        ),
        GoRoute(
          path: '/domains',
          builder: (context, state) => const DomainScreen(),
        ),
        GoRoute(
          path: '/activity',
          builder: (context, state) => const ActivityScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/conversation/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return ConversationDetailScreen(id: id);
      },
    ),
  ],
);

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ZeRelay',
      theme: ZeTheme.lightTheme,
      darkTheme: ZeTheme.darkTheme,
      themeMode: ThemeMode.dark, // Dark theme default
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainNavigationLayout extends StatelessWidget {
  final Widget child;
  const MainNavigationLayout({super.key, required this.child});

  int _getSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/inbox')) return 0;
    if (location.startsWith('/outbound')) return 1;
    if (location.startsWith('/domains')) return 2;
    if (location.startsWith('/activity')) return 3;
    if (location.startsWith('/settings')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/inbox');
        break;
      case 1:
        context.go('/outbound');
        break;
      case 2:
        context.go('/domains');
        break;
      case 3:
        context.go('/activity');
        break;
      case 4:
        context.go('/settings');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _getSelectedIndex(context);

    final theme = Theme.of(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: theme.dividerColor, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: selectedIndex,
          onTap: (index) => _onItemTapped(index, context),
          backgroundColor: theme.brightness == Brightness.dark ? ZeTheme.darkBg : Colors.white,
          selectedItemColor: theme.primaryColor,
          unselectedItemColor: theme.brightness == Brightness.dark ? Colors.white30 : Colors.black38,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.inbox, size: 20),
              activeIcon: Icon(LucideIcons.inbox, size: 20, color: theme.primaryColor),
              label: 'Inbox',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.send, size: 20),
              activeIcon: Icon(LucideIcons.send, size: 20, color: theme.primaryColor),
              label: 'Outbound',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.globe, size: 20),
              activeIcon: Icon(LucideIcons.globe, size: 20, color: theme.primaryColor),
              label: 'Domains',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.activity, size: 20),
              activeIcon: Icon(LucideIcons.activity, size: 20, color: theme.primaryColor),
              label: 'Activity',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.settings, size: 20),
              activeIcon: Icon(LucideIcons.settings, size: 20, color: theme.primaryColor),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}
