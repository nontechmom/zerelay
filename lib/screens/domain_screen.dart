import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import '../providers/state.dart';
import '../theme/theme.dart';

class DomainScreen extends ConsumerStatefulWidget {
  const DomainScreen({super.key});

  @override
  ConsumerState<DomainScreen> createState() => _DomainScreenState();
}

class _DomainScreenState extends ConsumerState<DomainScreen> {
  Domain? _selectedDomain;

  @override
  Widget build(BuildContext context) {
    final activeWs = ref.watch(activeWorkspaceProvider);
    final domains = ref.watch(domainsProvider).where((d) => d.workspaceId == activeWs.id).toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Domain Verification',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Configure sender infrastructure',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.plusCircle, size: 20, color: ZeTheme.secondary),
            tooltip: 'Add Sending Domain',
            onPressed: () => _showAddDomainDialog(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: domains.isEmpty
          ? _buildEmptyState()
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Sender Domains',
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white70),
                ),
                const SizedBox(height: 10),
                ...domains.map((dom) => _buildDomainRow(dom)),
                if (_selectedDomain != null && domains.any((d) => d.id == _selectedDomain!.id)) ...[
                  const SizedBox(height: 24),
                  Divider(color: Theme.of(context).dividerColor),
                  const SizedBox(height: 12),
                  // Render detail layout for the selected domain
                  _buildDomainDetails(domains.firstWhere((d) => d.id == _selectedDomain!.id)),
                ]
              ],
            ),
    );
  }

  Widget _buildDomainRow(Domain dom) {
    final isSelected = _selectedDomain?.id == dom.id;
    Color statusColor;
    IconData statusIcon;

    switch (dom.status) {
      case 'Verified':
        statusColor = ZeTheme.statusResolved;
        statusIcon = LucideIcons.checkCircle2;
        break;
      case 'Failed':
        statusColor = ZeTheme.priorityUrgent;
        statusIcon = LucideIcons.xCircle;
        break;
      default:
        statusColor = ZeTheme.statusInProgress;
        statusIcon = LucideIcons.helpCircle;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedDomain = dom;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected ? ZeTheme.primary.withOpacity(0.08) : Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? ZeTheme.primary : Theme.of(context).dividerColor,
              width: 1.2,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(LucideIcons.globe, color: isSelected ? ZeTheme.secondary : Colors.white60, size: 18),
                  const SizedBox(width: 12),
                  Text(
                    dom.name,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                  ),
                ],
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      children: [
                        Icon(statusIcon, color: statusColor, size: 12),
                        const SizedBox(width: 6),
                        Text(
                          dom.status,
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right, size: 16, color: Colors.white30),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDomainDetails(Domain dom) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'DNS Configuration: ${dom.name}',
              style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: ZeTheme.secondary),
            ),
            if (dom.status != 'Verified')
              ElevatedButton.icon(
                icon: Icon(LucideIcons.refreshCw, size: 12, color: Colors.white),
                label: Text('Verify Now', style: GoogleFonts.outfit(fontSize: 12, color: (Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A)), fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: ZeTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                onPressed: () => _triggerDomainVerification(dom),
              ),
          ],
        ),
        const SizedBox(height: 16),
        _buildRecordCard('SPF Record (TXT)', 'v=spf1 include:amazonses.com ~all', dom.spfVerified),
        const SizedBox(height: 10),
        _buildRecordCard('DKIM Record (TXT)', dom.txtRecord, dom.dkimVerified),
        const SizedBox(height: 10),
        _buildRecordCard('MX Record (MX)', '10 ${dom.mxRecord}', dom.status == 'Verified'),
        const SizedBox(height: 10),
        _buildRecordCard('DMARC Record (TXT)', 'v=DMARC1; p=none; rua=mailto:dmarc@${dom.name}', dom.dmarcVerified),
      ],
    );
  }

  Widget _buildRecordCard(String type, String value, bool isVerified) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            children: [
              Text(
                type,
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white70),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isVerified ? ZeTheme.statusResolved.withOpacity(0.12) : Theme.of(context).dividerColor,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  isVerified ? 'Verified' : 'Missing',
                  style: GoogleFonts.outfit(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: isVerified ? ZeTheme.statusResolved : Colors.white30,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.02),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                  ),
                  child: Text(
                    value,
                    style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              IconButton(
                icon: Icon(LucideIcons.copy, size: 16, color: Colors.white60),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: value));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Copied record value to clipboard'),
                      duration: Duration(seconds: 1),
                    ),
                  );
                },
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
            Icon(LucideIcons.globe, size: 64, color: Colors.white24),
            const SizedBox(height: 16),
            Text(
              'No Domains Configured',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Add a domain that you own to authenticate sender records and activate inbound routing.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 13, color: (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : const Color(0xFF94A3B8)), height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  void _triggerDomainVerification(Domain dom) {
    final activeWs = ref.read(activeWorkspaceProvider);
    
    ref.read(domainsProvider.notifier).verify(
      dom.id,
      'Ahmed',
      (desc) => ref.read(auditLogProvider.notifier).log(activeWs.id, desc, 'Ahmed')
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Successfully authenticated DNS records for ${dom.name}!'),
        backgroundColor: ZeTheme.statusResolved,
      ),
    );
  }

  void _showAddDomainDialog(BuildContext context) {
    final domainController = TextEditingController();
    final activeWs = ref.read(activeWorkspaceProvider);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Theme.of(context).dividerColor),
        ),
        title: Text(
          'Add Sender Domain',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Enter the root domain or subdomain you want to send emails from via Resend.',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: domainController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'domain.com or mail.domain.com',
                labelStyle: TextStyle(color: Colors.white60),
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
            child: const Text('Create', style: TextStyle(color: Colors.white)),
            onPressed: () {
              final domainName = domainController.text.trim();
              if (domainName.isNotEmpty) {
                ref.read(domainsProvider.notifier).addDomain(activeWs.id, domainName);
                ref.read(auditLogProvider.notifier).log(
                  activeWs.id,
                  'Domain "$domainName" added, pending DNS configuration',
                  'Ahmed'
                );

                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Added $domainName to pending list'),
                    backgroundColor: ZeTheme.statusOpen,
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
