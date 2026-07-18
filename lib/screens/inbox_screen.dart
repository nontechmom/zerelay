import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/state.dart';
import '../theme/theme.dart';
import '../widgets/workspace_switcher.dart';
import '../widgets/custom_visuals.dart';

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'All'; // All, Unread, Assigned to me, Needs reply
  String _selectedPriority = 'All'; // All, Low, Medium, High, Urgent

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim().toLowerCase();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final activeWs = ref.watch(activeWorkspaceProvider);
    final activeUser = ref.watch(activeUserProvider);
    final allConversations = ref.watch(conversationsProvider);

    // Filter conversations based on Workspace, Search and Filters
    final filteredConversations = allConversations.where((conv) {
      // Must match workspace
      if (conv.workspaceId != activeWs.id) return false;

      // Filter: Unread
      if (_selectedFilter == 'Unread' && !conv.isUnread) return false;

      // Filter: Assigned to me (simulate user is 'Ahmed')
      if (_selectedFilter == 'Assigned to me' && conv.assignee != 'Ahmed') return false;

      // Filter: Needs reply (simulate Open & Urgent/High priority, or no comments)
      if (_selectedFilter == 'Needs reply' && (conv.status == 'Resolved' || conv.status == 'Closed')) return false;

      // Filter: Priority
      if (_selectedPriority != 'All' && conv.priority != _selectedPriority) return false;

      // Search Query
      if (_searchQuery.isNotEmpty) {
        final matchesSubject = conv.subject.toLowerCase().contains(_searchQuery);
        final matchesSender = conv.senderName.toLowerCase().contains(_searchQuery);
        final matchesBody = conv.bodyPreview.toLowerCase().contains(_searchQuery);
        if (!matchesSubject && !matchesSender && !matchesBody) return false;
      }

      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: GestureDetector(
          onTap: () => _showWorkspaceSwitcher(context),
          child: MouseRegion(
            cursor: SystemMouseCursors.click,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: ZeTheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(LucideIcons.mail, size: 18, color: ZeTheme.secondary),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Text(
                          activeWs.name,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: (Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A)),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.keyboard_arrow_down, size: 16, color: Colors.white70),
                      ],
                    ),
                    Text(
                      activeUser.isResendConnected
                          ? activeUser.resendConnectionLabel
                          : 'Resend connection missing',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        color: activeUser.isResendConnected ? ZeTheme.statusResolved : Colors.amber,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.plusCircle, color: ZeTheme.secondary),
            tooltip: 'Simulate Incoming Mail',
            onPressed: () => _simulateIncomingEmail(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Search Input
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: TextField(
              controller: _searchController,
              style: GoogleFonts.outfit(fontSize: 14, color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search inbox...',
                hintStyle: GoogleFonts.outfit(color: Colors.white38),
                prefixIcon: Icon(LucideIcons.search, size: 18, color: Colors.white38),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18, color: Colors.white38),
                        onPressed: () => _searchController.clear(),
                      )
                    : null,
                filled: true,
                fillColor: Theme.of(context).cardColor,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
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

          // Filters row
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildFilterChip('All'),
                _buildFilterChip('Unread'),
                _buildFilterChip('Assigned to me'),
                _buildFilterChip('Needs reply'),
                VerticalDivider(width: 20, color: Theme.of(context).dividerColor, thickness: 1, indent: 6, endIndent: 6),
                _buildPriorityChip('All'),
                _buildPriorityChip('Urgent'),
                _buildPriorityChip('High'),
                _buildPriorityChip('Medium'),
                _buildPriorityChip('Low'),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Email conversation List
          Expanded(
            child: filteredConversations.isEmpty
                ? _buildEmptyState()
                : ListView.separated(
                    itemCount: filteredConversations.length,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final conv = filteredConversations[index];
                      return _buildConversationCard(context, conv)
                          .animate(delay: (index * 50).ms)
                          .fadeIn(duration: 350.ms)
                          .slideX(begin: 0.1, end: 0, curve: Curves.easeOutCubic);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return Padding(
      padding: const EdgeInsets.only(right: 6.0),
      child: ChoiceChip(
        label: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.white60,
          ),
        ),
        selected: isSelected,
        onSelected: (val) {
          if (val) {
            setState(() {
              _selectedFilter = label;
            });
          }
        },
        selectedColor: ZeTheme.primary,
        backgroundColor: Theme.of(context).cardColor,
        checkmarkColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(color: isSelected ? ZeTheme.primary : Theme.of(context).dividerColor),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
      ),
    );
  }

  Widget _buildPriorityChip(String priority) {
    final isSelected = _selectedPriority == priority;
    Color chipBorderColor = Theme.of(context).dividerColor;
    if (isSelected) {
      switch (priority) {
        case 'Urgent': chipBorderColor = ZeTheme.priorityUrgent; break;
        case 'High': chipBorderColor = ZeTheme.priorityHigh; break;
        case 'Medium': chipBorderColor = ZeTheme.priorityMedium; break;
        case 'Low': chipBorderColor = ZeTheme.priorityLow; break;
        default: chipBorderColor = ZeTheme.secondary;
      }
    }
    
    return Padding(
      padding: const EdgeInsets.only(right: 6.0),
      child: ChoiceChip(
        label: Text(
          priority == 'All' ? 'Priority: All' : priority,
          style: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.white60,
          ),
        ),
        selected: isSelected,
        onSelected: (val) {
          if (val) {
            setState(() {
              _selectedPriority = priority;
            });
          }
        },
        selectedColor: chipBorderColor.withOpacity(0.8),
        backgroundColor: Theme.of(context).cardColor,
        checkmarkColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(color: isSelected ? chipBorderColor : Theme.of(context).dividerColor),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
      ),
    );
  }

  Widget _buildConversationCard(BuildContext context, Conversation conv) {
    // Determine priority border/light indicator
    Color priorityColor;
    switch (conv.priority) {
      case 'Urgent': priorityColor = ZeTheme.priorityUrgent; break;
      case 'High': priorityColor = ZeTheme.priorityHigh; break;
      case 'Medium': priorityColor = ZeTheme.priorityMedium; break;
      default: priorityColor = ZeTheme.priorityLow;
    }

    // Determine status color
    Color statusColor;
    switch (conv.status) {
      case 'Open': statusColor = ZeTheme.statusOpen; break;
      case 'In Progress': statusColor = ZeTheme.statusInProgress; break;
      case 'Waiting': statusColor = ZeTheme.statusWaiting; break;
      case 'Resolved': statusColor = ZeTheme.statusResolved; break;
      default: statusColor = ZeTheme.statusClosed;
    }

    // Formatting timestamp
    final timeStr = _formatTimestamp(conv.timestamp);

    return InkWell(
      onTap: () {
        ref.read(conversationsProvider.notifier).markAsRead(conv.id);
        context.push('/conversation/${conv.id}');
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: conv.isUnread ? (Theme.of(context).brightness == Brightness.dark ? ZeTheme.darkSurface : ZeTheme.lightSurface) : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: conv.isUnread ? ZeTheme.primary.withOpacity(0.4) : Theme.of(context).dividerColor,
            width: conv.isUnread ? 1.5 : 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Priority side border
                Container(
                  width: 5,
                  color: priorityColor,
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Row 1: Sender & Time & Unread dot
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                if (conv.isUnread) ...[
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: ZeTheme.secondary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                Text(
                                  conv.senderName,
                                  style: GoogleFonts.outfit(
                                    fontWeight: conv.isUnread ? FontWeight.bold : FontWeight.w600,
                                    fontSize: 15,
                                    color: conv.isUnread ? Colors.white : const Color(0xFFE2E8F0),
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              timeStr,
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                color: (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : const Color(0xFF94A3B8)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),

                        // Row 2: Subject
                        Text(
                          conv.subject,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontWeight: conv.isUnread ? FontWeight.bold : FontWeight.w500,
                            fontSize: 14,
                            color: conv.isUnread ? Colors.white : Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 6),

                        // Row 3: Body preview
                        Text(
                          conv.bodyPreview,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            color: (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : const Color(0xFF94A3B8)),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Row 4: Status / Priority / Assignee / Attachments
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                // Status chip
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: statusColor.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: statusColor.withOpacity(0.3), width: 1),
                                  ),
                                  child: Text(
                                    conv.status,
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: statusColor,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // Priority light
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: priorityColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          color: priorityColor,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        conv.priority,
                                        style: GoogleFonts.outfit(
                                          fontSize: 11,
                                          color: (Theme.of(context).brightness == Brightness.dark ? Colors.white70 : const Color(0xFF475569)),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                if (conv.messages.first.attachments.isNotEmpty) ...[
                                  const SizedBox(width: 12),
                                  Icon(LucideIcons.paperclip, size: 14, color: Colors.white38),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${conv.messages.first.attachments.length}',
                                    style: GoogleFonts.outfit(fontSize: 11, color: Colors.white38),
                                  ),
                                ],
                              ],
                            ),
                            
                            // Assignee avatar
                            Row(
                              children: [
                                Icon(
                                  LucideIcons.userCheck2, 
                                  size: 13, 
                                  color: conv.assignee != null ? ZeTheme.secondary : Colors.white24
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: conv.assignee != null 
                                        ? ZeTheme.secondary.withOpacity(0.15) 
                                        : Colors.white.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: conv.assignee != null 
                                          ? ZeTheme.secondary.withOpacity(0.3) 
                                          : Colors.white12
                                    ),
                                  ),
                                  child: Text(
                                    conv.assignee ?? 'Unassigned',
                                    style: GoogleFonts.outfit(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: conv.assignee != null ? ZeTheme.secondary : Colors.white38,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
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
            const EmptyInboxIllustration(size: 160)
                .animate()
                .scale(duration: 400.ms, curve: Curves.easeOutBack),
            const SizedBox(height: 24),
            Text(
              'All Caught Up!',
              style: GoogleFonts.outfit(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: (Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A)),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Stop reading JSON. Start reading emails. There are no matching emails in this workspace right now.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : const Color(0xFF94A3B8)),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showWorkspaceSwitcher(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => const WorkspaceSwitcher(),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h';
    } else {
      return '${dt.day}/${dt.month}';
    }
  }

  void _simulateIncomingEmail(BuildContext context) {
    final activeWs = ref.read(activeWorkspaceProvider);
    final subjectController = TextEditingController();
    final bodyController = TextEditingController();
    final senderController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Theme.of(context).dividerColor),
        ),
        title: Text(
          'Simulate Inbound Email',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: senderController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Sender Name',
                  labelStyle: TextStyle(color: Colors.white60),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: subjectController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Email Subject',
                  labelStyle: TextStyle(color: Colors.white60),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: bodyController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Email Body Content',
                  labelStyle: TextStyle(color: Colors.white60),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            onPressed: () => Navigator.pop(context),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: ZeTheme.primary),
            child: const Text('Deliver Webhook', style: TextStyle(color: Colors.white)),
            onPressed: () {
              final sender = senderController.text.trim().isNotEmpty ? senderController.text.trim() : 'Jane Doe';
              final subject = subjectController.text.trim().isNotEmpty ? subjectController.text.trim() : 'New Account Setup Support';
              final body = bodyController.text.trim().isNotEmpty ? bodyController.text.trim() : 'I am having troubles configuring DKIM for my subdomains...';
              
              final newConv = Conversation(
                id: 'c_${DateTime.now().millisecondsSinceEpoch}',
                workspaceId: activeWs.id,
                senderName: sender,
                senderEmail: '${sender.toLowerCase().replaceAll(' ', '')}@example.com',
                subject: subject,
                bodyPreview: body,
                assignee: null,
                status: 'Open',
                priority: 'High',
                isUnread: true,
                timestamp: DateTime.now(),
                messages: [
                  EmailMessage(
                    id: 'm_${DateTime.now().millisecondsSinceEpoch}',
                    sender: sender,
                    senderEmail: '${sender.toLowerCase().replaceAll(' ', '')}@example.com',
                    timestamp: DateTime.now(),
                    content: body,
                    attachments: [],
                  )
                ],
                comments: [],
              );

              // Add to state
              ref.read(conversationsProvider.notifier).receiveWebhook(newConv);
              ref.read(auditLogProvider.notifier).log(
                activeWs.id, 
                'Inbound webhook simulated: "$subject" received from $sender', 
                'System Webhook'
              );

              Navigator.pop(context);
              
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('New webhook received: "$subject" from $sender'),
                  backgroundColor: ZeTheme.statusOpen,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
