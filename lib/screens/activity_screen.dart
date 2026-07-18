import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/state.dart';
import '../theme/theme.dart';

class ActivityScreen extends ConsumerWidget {
  const ActivityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeWs = ref.watch(activeWorkspaceProvider);
    final auditLogs = ref.watch(auditLogProvider).where((l) => l.workspaceId == activeWs.id).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Workspace Activity',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Audit logs of collaboration actions',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
          ],
        ),
      ),
      body: auditLogs.isEmpty
          ? _buildEmptyState(context)
          : ListView.builder(
              itemCount: auditLogs.length,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              itemBuilder: (context, index) {
                final log = auditLogs[index];
                final isLast = index == auditLogs.length - 1;
                return _buildTimelineItem(context, log, isLast);
              },
            ),
    );
  }

  Widget _buildTimelineItem(BuildContext context, AuditLogEvent log, bool isLast) {
    // Determine icon based on description contents
    IconData eventIcon = LucideIcons.info;
    Color iconColor = ZeTheme.secondary;

    if (log.description.contains('assigned')) {
      eventIcon = LucideIcons.userCheck;
      iconColor = ZeTheme.statusWaiting;
    } else if (log.description.contains('status')) {
      eventIcon = LucideIcons.settings;
      iconColor = ZeTheme.statusInProgress;
    } else if (log.description.contains('comment')) {
      eventIcon = LucideIcons.messageSquare;
      iconColor = ZeTheme.primary;
    } else if (log.description.contains('reply') || log.description.contains('Outbound')) {
      eventIcon = LucideIcons.send;
      iconColor = ZeTheme.statusOpen;
    } else if (log.description.contains('verified')) {
      eventIcon = LucideIcons.shieldCheck;
      iconColor = ZeTheme.statusResolved;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline indicator line + circle
          Column(
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.12),
                  shape: BoxShape.circle,
                  border: Border.all(color: iconColor.withOpacity(0.3), width: 1),
                ),
                child: Icon(eventIcon, size: 14, color: iconColor),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: Theme.of(context).dividerColor,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          // Content Card
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          log.actor,
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white70),
                        ),
                        Text(
                          _formatTime(log.timestamp),
                          style: GoogleFonts.outfit(fontSize: 10, color: Colors.white30),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      log.description,
                      style: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFFE2E8F0), height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.activity, size: 64, color: Colors.white24),
            const SizedBox(height: 16),
            Text(
              'No Workspace Activity',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Activity records will begin logging automatically as actions are taken on emails, assignments, comments and verified domains.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 13, color: (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : const Color(0xFF94A3B8)), height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${dt.day}/${dt.month}';
    }
  }
}
