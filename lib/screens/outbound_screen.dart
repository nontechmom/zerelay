import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/state.dart';
import '../theme/theme.dart';

class OutboundScreen extends ConsumerStatefulWidget {
  const OutboundScreen({super.key});

  @override
  ConsumerState<OutboundScreen> createState() => _OutboundScreenState();
}

class _OutboundScreenState extends ConsumerState<OutboundScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final activeWs = ref.watch(activeWorkspaceProvider);
    final outboundEmails = ref.watch(outboundEmailsProvider);

    final filteredEmails = outboundEmails.where((email) {
      if (email.workspaceId != activeWs.id) return false;
      if (_searchQuery.isNotEmpty) {
        final matchTo = email.to.toLowerCase().contains(_searchQuery);
        final matchSubject = email.subject.toLowerCase().contains(_searchQuery);
        if (!matchTo && !matchSubject) return false;
      }
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Outbound Analytics',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Sent via Resend Send API',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.send, size: 20, color: ZeTheme.secondary),
            onPressed: () => _showComposeOutboundDialog(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Search input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              controller: _searchController,
              style: TextStyle(color: (Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A)), fontSize: 14),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim().toLowerCase();
                });
              },
              decoration: InputDecoration(
                hintText: 'Search sent mails by recipient or subject...',
                hintStyle: GoogleFonts.outfit(color: Colors.white38),
                prefixIcon: Icon(LucideIcons.search, size: 18, color: Colors.white38),
                filled: true,
                fillColor: Theme.of(context).cardColor,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Theme.of(context).dividerColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Theme.of(context).dividerColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: ZeTheme.primary, width: 1.2),
                ),
              ),
            ),
          ),

          // Delivered / Open / Bounce Metric Summary Cards
          _buildMetricsSummary(filteredEmails),

          const SizedBox(height: 12),

          // Sent mail list
          Expanded(
            child: filteredEmails.isEmpty
                ? _buildEmptyState()
                : ListView.separated(
                    itemCount: filteredEmails.length,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final email = filteredEmails[index];
                      return _buildOutboundCard(email);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsSummary(List<OutboundEmail> list) {
    int total = list.length;
    int delivered = list.where((e) => e.status == 'Delivered' || e.status == 'Opened' || e.status == 'Clicked').length;
    int opened = list.where((e) => e.status == 'Opened' || e.status == 'Clicked').length;
    int bounced = list.where((e) => e.status == 'Bounced' || e.status == 'Failed').length;

    double delRate = total > 0 ? (delivered / total) * 100 : 0.0;
    double openRate = total > 0 ? (opened / total) * 100 : 0.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        children: [
          _buildMetricCard('Delivered', '${delRate.toStringAsFixed(1)}%', ZeTheme.statusResolved),
          const SizedBox(width: 8),
          _buildMetricCard('Open Rate', '${openRate.toStringAsFixed(1)}%', ZeTheme.secondary),
          const SizedBox(width: 8),
          _buildMetricCard('Bounces', '$bounced', bounced > 0 ? ZeTheme.priorityUrgent : Colors.white60),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38)),
            const SizedBox(height: 4),
            Text(value, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildOutboundCard(OutboundEmail email) {
    Color statusColor;
    IconData statusIcon;

    switch (email.status) {
      case 'Opened':
        statusColor = ZeTheme.secondary;
        statusIcon = LucideIcons.bookOpen;
        break;
      case 'Clicked':
        statusColor = Colors.pinkAccent;
        statusIcon = LucideIcons.mousePointer;
        break;
      case 'Delivered':
        statusColor = ZeTheme.statusResolved;
        statusIcon = LucideIcons.checkCheck;
        break;
      case 'Sent':
        statusColor = ZeTheme.statusOpen;
        statusIcon = LucideIcons.check;
        break;
      case 'Bounced':
      case 'Failed':
        statusColor = ZeTheme.priorityUrgent;
        statusIcon = LucideIcons.xCircle;
        break;
      default:
        statusColor = Colors.white54;
        statusIcon = LucideIcons.helpCircle;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 16),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  email.to,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                ),
                const SizedBox(height: 2),
                Text(
                  email.subject,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(fontSize: 13, color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                email.status,
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11, color: statusColor),
              ),
              const SizedBox(height: 2),
              Text(
                _formatTime(email.timestamp),
                style: GoogleFonts.outfit(fontSize: 11, color: Colors.white38),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.send, size: 64, color: Colors.white24),
            const SizedBox(height: 16),
            Text(
              'No Sent Emails',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Outbound history is loaded automatically as your applications and team members send emails through the Resend API.',
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
    if (diff.inHours < 24) {
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } else {
      return '${dt.day}/${dt.month}';
    }
  }

  void _showComposeOutboundDialog(BuildContext context) {
    final toController = TextEditingController();
    final subjectController = TextEditingController();
    final bodyController = TextEditingController();
    final activeWs = ref.read(activeWorkspaceProvider);

    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 24,
          right: 24,
          top: 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Send Outbound Email (Mock API)',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: toController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Recipient Email',
                labelStyle: TextStyle(color: Colors.white60),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: subjectController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Subject',
                labelStyle: TextStyle(color: Colors.white60),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: bodyController,
              maxLines: 4,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Body Text',
                labelStyle: TextStyle(color: Colors.white60),
              ),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: ZeTheme.primary),
                onPressed: () {
                  final to = toController.text.trim();
                  final sub = subjectController.text.trim();
                  final bod = bodyController.text.trim();

                  if (to.isNotEmpty && sub.isNotEmpty) {
                    ref.read(outboundEmailsProvider.notifier).sendOutbound(
                      activeWs.id,
                      to,
                      sub,
                      bod,
                    );
                    ref.read(auditLogProvider.notifier).log(
                      activeWs.id,
                      'Outbound email triggered via API to $to: "$sub"',
                      'Ahmed'
                    );

                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Transmitting mock Resend payload...'),
                        backgroundColor: ZeTheme.statusInProgress,
                      ),
                    );
                  }
                },
                child: Text('Transmit API', style: GoogleFonts.outfit(color: (Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A)), fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
