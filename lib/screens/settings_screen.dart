import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/state.dart';
import '../theme/theme.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final List<Map<String, String>> _mockMembers = [
    {'name': 'Ahmed', 'role': 'Owner / Admin', 'email': 'ahmed@zeppelinlabs.dev'},
    {'name': 'Sarah', 'role': 'Developer / Engineer', 'email': 'sarah@zeppelinlabs.dev'},
    {'name': 'Ali', 'role': 'Support Lead', 'email': 'ali@zeppelinlabs.dev'},
  ];

  @override
  Widget build(BuildContext context) {
    final activeWs = ref.watch(activeWorkspaceProvider);
    final activeUser = ref.watch(activeUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Workspace Settings',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Section 1: User Credential & Workspace Context
          _buildSectionHeader('Your Resend Credential'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'User: ${activeUser.name}',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  activeUser.email,
                  style: GoogleFonts.outfit(fontSize: 12, color: Colors.white30),
                ),
                const SizedBox(height: 2),
                Text(
                  'Workspace: ${activeWs.name}',
                  style: GoogleFonts.outfit(fontSize: 12, color: Colors.white30),
                ),
                const SizedBox(height: 16),
                Text(
                  'Resend Connection'
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.white70),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.02),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white.withOpacity(0.04)),
                        ),
                        child: Text(
                          activeUser.resendConnectionLabel,
                          style: GoogleFonts.outfit(
                            color: activeUser.isResendConnected ? Colors.white60 : Colors.amber,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(LucideIcons.edit2, size: 18, color: ZeTheme.secondary),
                      onPressed: () => _showEditKeyDialog(context, activeUser, activeWs.id),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Section 2: Team Members (Phase 1 Unlimited Members)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSectionHeader('Team Workspace Members'),
              TextButton.icon(
                icon: Icon(LucideIcons.plus, size: 14, color: ZeTheme.secondary),
                label: Text('Invite', style: GoogleFonts.outfit(fontSize: 12, color: ZeTheme.secondary, fontWeight: FontWeight.bold)),
                onPressed: () => _showInviteMemberDialog(context),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _mockMembers.length,
              separatorBuilder: (context, index) => Divider(height: 1, color: Theme.of(context).dividerColor),
              itemBuilder: (context, index) {
                final member = _mockMembers[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: ZeTheme.primary.withOpacity(0.2),
                    radius: 16,
                    child: Text(
                      member['name']![0],
                      style: GoogleFonts.outfit(color: ZeTheme.secondary, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                  title: Text(
                    member['name']!,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                  ),
                  subtitle: Text(
                    member['email']!,
                    style: GoogleFonts.outfit(fontSize: 11, color: Colors.white30),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Theme.of(context).dividerColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      member['role']!,
                      style: GoogleFonts.outfit(fontSize: 10, color: (Theme.of(context).brightness == Brightness.dark ? Colors.white54 : const Color(0xFF64748B)), fontWeight: FontWeight.w600),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 24),

          // Section 3: App Controls
          _buildSectionHeader('App Configuration'),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: Icon(LucideIcons.palette, color: (Theme.of(context).brightness == Brightness.dark ? Colors.white60 : const Color(0xFF64748B)), size: 20),
                  title: Text('Visual Theme', style: GoogleFonts.outfit(fontSize: 14, color: Colors.white)),
                  trailing: Text(
                    'Dark Mode Only',
                    style: GoogleFonts.outfit(fontSize: 12, color: ZeTheme.secondary, fontWeight: FontWeight.bold),
                  ),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Visual theme is default premium Dark Mode for best aesthetics.'),
                      ),
                    );
                  },
                ),
                Divider(height: 1, color: Theme.of(context).dividerColor),
                ListTile(
                  leading: Icon(LucideIcons.logOut, color: Colors.redAccent, size: 20),
                  title: Text('Reset App Session', style: GoogleFonts.outfit(fontSize: 14, color: Colors.redAccent)),
                  onTap: () {
                    // Navigate back to onboarding
                    context.go('/onboarding');
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4.0),
      child: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: (Theme.of(context).brightness == Brightness.dark ? Colors.white70 : const Color(0xFF475569)),
        ),
      ),
    );
  }

  void _showEditKeyDialog(BuildContext context, UserProfile user, String workspaceId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Theme.of(context).dividerColor),
        ),
        title: Text(
          'Connect Resend'
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Use Resend OAuth for mobile-safe access. The backend stores the OAuth grant and proxies Resend API calls; raw API keys are only a local/MVP fallback.',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            onPressed: () => Navigator.pop(context),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: ZeTheme.primary),
            child: const Text('Connect OAuth', style: TextStyle(color: Colors.white)),
            onPressed: () {
              ref.read(activeUserProvider.notifier).state = user.copyWith(resendConnectionMethod: 'oauth');

              ref.read(auditLogProvider.notifier).log(
                workspaceId,
                'Resend OAuth connection updated',
                user.name,
              );

              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Resend OAuth connection marked for this prototype.'),
                  backgroundColor: ZeTheme.statusResolved,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showInviteMemberDialog(BuildContext context) {
    final emailController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Theme.of(context).dividerColor),
        ),
        title: Text(
          'Invite Team Member',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Invite collaborators to your shared email workspace. They will be added automatically to the group.',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: emailController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Member Email',
                labelStyle: TextStyle(color: Colors.white60),
                hintText: 'engineer@company.com',
                hintStyle: TextStyle(color: Colors.white24),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            onPressed: () => Navigator.pop(context),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: ZeTheme.primary),
            child: const Text('Send Invite', style: TextStyle(color: Colors.white)),
            onPressed: () {
              final email = emailController.text.trim();
              if (email.isNotEmpty) {
                final active = ref.read(activeWorkspaceProvider);
                setState(() {
                  _mockMembers.add({
                    'name': email.split('@')[0],
                    'role': 'Developer',
                    'email': email,
                  });
                });
                
                ref.read(auditLogProvider.notifier).log(
                  active.id,
                  'Invited team collaborator: $email',
                  'Ahmed'
                );

                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Collaborator invite transmitted to $email'),
                    backgroundColor: ZeTheme.statusResolved,
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
