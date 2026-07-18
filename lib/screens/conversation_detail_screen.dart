import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../providers/state.dart';
import '../theme/theme.dart';

class ConversationDetailScreen extends ConsumerStatefulWidget {
  final String id;
  const ConversationDetailScreen({super.key, required this.id});

  @override
  ConsumerState<ConversationDetailScreen> createState() => _ConversationDetailScreenState();
}

class _ConversationDetailScreenState extends ConsumerState<ConversationDetailScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _commentController = TextEditingController();
  final TextEditingController _replyController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final conversations = ref.watch(conversationsProvider);
    final activeWs = ref.watch(activeWorkspaceProvider);

    // Find the conversation by id
    final convIndex = conversations.indexWhere((c) => c.id == widget.id);
    if (convIndex == -1) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
              const SizedBox(height: 16),
              const Text('Conversation not found.'),
              TextButton(
                onPressed: () => context.go('/inbox'),
                child: const Text('Back to Inbox'),
              )
            ],
          ),
        ),
      );
    }

    final conv = conversations[convIndex];

    // Status / Priority colors
    Color statusColor;
    switch (conv.status) {
      case 'Open': statusColor = ZeTheme.statusOpen; break;
      case 'In Progress': statusColor = ZeTheme.statusInProgress; break;
      case 'Waiting': statusColor = ZeTheme.statusWaiting; break;
      case 'Resolved': statusColor = ZeTheme.statusResolved; break;
      default: statusColor = ZeTheme.statusClosed;
    }

    Color priorityColor;
    switch (conv.priority) {
      case 'Urgent': priorityColor = ZeTheme.priorityUrgent; break;
      case 'High': priorityColor = ZeTheme.priorityHigh; break;
      case 'Medium': priorityColor = ZeTheme.priorityMedium; break;
      default: priorityColor = ZeTheme.priorityLow;
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              conv.senderName,
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Text(
              conv.senderEmail,
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.archive, size: 20, color: Colors.white60),
            onPressed: () {
              ref.read(conversationsProvider.notifier).setStatus(conv.id, 'Closed', 'Ahmed', (desc) {
                ref.read(auditLogProvider.notifier).log(activeWs.id, desc, 'Ahmed');
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Conversation archived / closed')),
              );
              Navigator.pop(context);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Info ribbon (Subject & Meta details)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              border: Border(
                bottom: BorderSide(color: Theme.of(context).dividerColor, width: 1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  conv.subject,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: (Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A)),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        // Status selector button
                        _buildDropdownSelector(
                          context: context,
                          label: conv.status,
                          color: statusColor,
                          icon: LucideIcons.circleDot,
                          onPressed: () => _showStatusSelector(context, conv),
                        ),
                        const SizedBox(width: 8),
                        
                        // Priority selector button
                        _buildDropdownSelector(
                          context: context,
                          label: conv.priority,
                          color: priorityColor,
                          icon: LucideIcons.alertTriangle,
                          onPressed: () => _showPrioritySelector(context, conv),
                        ),
                      ],
                    ),
                    
                    // Assignee selector button
                    _buildDropdownSelector(
                      context: context,
                      label: conv.assignee ?? 'Assign',
                      color: conv.assignee != null ? ZeTheme.secondary : Colors.white24,
                      icon: LucideIcons.user,
                      onPressed: () => _showAssigneeSelector(context, conv),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Main Thread (Messages + Comments)
          Expanded(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              children: [
                // List of items, combined messages and comments sorted by date
                ..._buildThreadItems(conv),
              ],
            ),
          ),

          // Sticky bottom action bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              border: Border(
                top: BorderSide(color: Theme.of(context).dividerColor, width: 1.5),
              ),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  // Internal Comment Button
                  Expanded(
                    child: TextButton.icon(
                      icon: Icon(LucideIcons.messageSquare, size: 18, color: ZeTheme.primary),
                      label: Text(
                        'Comment',
                        style: GoogleFonts.outfit(color: (Theme.of(context).brightness == Brightness.dark ? Colors.white70 : const Color(0xFF475569)), fontWeight: FontWeight.bold),
                      ),
                      onPressed: () => _showCommentInput(context, conv),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: ZeTheme.primary.withOpacity(0.08),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Reply email Button
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: Icon(LucideIcons.reply, size: 18, color: Colors.white),
                      label: Text(
                        'Reply',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                      ),
                      onPressed: () => _showReplyDialog(context, conv),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: ZeTheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownSelector({
    required BuildContext context,
    required String label,
    required Color color,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            border: Border.all(color: color.withOpacity(0.3), width: 1.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 13, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.arrow_drop_down, size: 14, color: color),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildThreadItems(Conversation conv) {
    List<Widget> items = [];
    
    // Sort items chronologically (Messages + Comments)
    final messages = conv.messages;
    final comments = conv.comments;
    
    // We map each to a model structure containing date and component
    final List<Map<String, dynamic>> timeline = [];
    for (var msg in messages) {
      timeline.add({
        'type': 'message',
        'date': msg.timestamp,
        'widget': _buildMessageBubble(msg),
      });
    }
    for (var com in comments) {
      timeline.add({
        'type': 'comment',
        'date': com.timestamp,
        'widget': _buildCommentBubble(com),
      });
    }

    timeline.sort((a, b) => (a['date'] as DateTime).compareTo(b['date'] as DateTime));

    for (var step in timeline) {
      items.add(step['widget'] as Widget);
      items.add(const SizedBox(height: 16));
    }
    
    return items;
  }

  Widget _buildMessageBubble(EmailMessage msg) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header info
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: ZeTheme.primary.withOpacity(0.2),
                      child: Text(
                        msg.sender[0].toUpperCase(),
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: ZeTheme.secondary, fontSize: 14),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          msg.sender,
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          msg.senderEmail,
                          style: GoogleFonts.outfit(fontSize: 11, color: Colors.white38),
                        ),
                      ],
                    ),
                  ],
                ),
                Text(
                  _formatTime(msg.timestamp),
                  style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: Theme.of(context).dividerColor),
          // Content
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              msg.content,
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: const Color(0xFFE2E8F0),
                height: 1.5,
              ),
            ),
          ),

          // Attachments
          if (msg.attachments.isNotEmpty) ...[
            Divider(height: 1, color: Theme.of(context).dividerColor),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.paperclip, size: 14, color: ZeTheme.secondary),
                      const SizedBox(width: 6),
                      Text(
                        'Attachments (${msg.attachments.length})',
                        style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: msg.attachments.map((filename) => _buildAttachmentChip(filename)).toList(),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAttachmentChip(String filename) {
    return ActionChip(
      avatar: Icon(LucideIcons.fileText, size: 14, color: Colors.white54),
      label: Text(
        filename,
        style: GoogleFonts.outfit(fontSize: 12, color: Colors.white70),
      ),
      backgroundColor: Colors.white.withOpacity(0.04),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Theme.of(context).dividerColor),
      ),
      onPressed: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(LucideIcons.downloadCloud, color: Colors.white),
                const SizedBox(width: 12),
                Text('Opening attachment "$filename"...'),
              ],
            ),
            backgroundColor: ZeTheme.statusInProgress,
          ),
        );
      },
    );
  }

  Widget _buildCommentBubble(InternalComment com) {
    return Align(
      alignment: Alignment.centerRight,
      child: FractionallySizedBox(
        widthFactor: 0.85,
        child: Container(
          decoration: BoxDecoration(
            color: ZeTheme.primary.withOpacity(0.08),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              topRight: Radius.circular(16),
              bottomLeft: Radius.circular(16),
              bottomRight: Radius.circular(4),
            ),
            border: Border.all(color: ZeTheme.primary.withOpacity(0.25), width: 1),
          ),
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.lock, size: 10, color: ZeTheme.primary),
                      const SizedBox(width: 6),
                      Text(
                        '${com.author} (Internal Note)',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: ZeTheme.primary,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    _formatTime(com.timestamp),
                    style: GoogleFonts.outfit(fontSize: 10, color: Colors.white38),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                com.text,
                style: GoogleFonts.outfit(
                  fontSize: 13.5,
                  color: const Color(0xDDFFFFFF),
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  // --- COLLABORATION ACTIONS ---

  void _showStatusSelector(BuildContext context, Conversation conv) {
    final activeWs = ref.read(activeWorkspaceProvider);
    final statuses = ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Update Status', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...statuses.map((status) => ListTile(
              leading: Icon(
                LucideIcons.circleDot, 
                color: status == conv.status ? ZeTheme.secondary : Colors.white38
              ),
              title: Text(status, style: GoogleFonts.outfit(color: Colors.white)),
              trailing: status == conv.status ? const Icon(Icons.check, color: ZeTheme.secondary) : null,
              onTap: () {
                ref.read(conversationsProvider.notifier).setStatus(conv.id, status, 'Ahmed', (desc) {
                  ref.read(auditLogProvider.notifier).log(activeWs.id, desc, 'Ahmed');
                });
                Navigator.pop(context);
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showPrioritySelector(BuildContext context, Conversation conv) {
    final activeWs = ref.read(activeWorkspaceProvider);
    final priorities = ['Low', 'Medium', 'High', 'Urgent'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Set Priority', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...priorities.map((priority) => ListTile(
              leading: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: priority == 'Low' 
                      ? ZeTheme.priorityLow 
                      : (priority == 'Medium' ? ZeTheme.priorityMedium : (priority == 'High' ? ZeTheme.priorityHigh : ZeTheme.priorityUrgent)),
                ),
              ),
              title: Text(priority, style: GoogleFonts.outfit(color: Colors.white)),
              trailing: priority == conv.priority ? const Icon(Icons.check, color: ZeTheme.secondary) : null,
              onTap: () {
                ref.read(conversationsProvider.notifier).setPriority(conv.id, priority, 'Ahmed', (desc) {
                  ref.read(auditLogProvider.notifier).log(activeWs.id, desc, 'Ahmed');
                });
                Navigator.pop(context);
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showAssigneeSelector(BuildContext context, Conversation conv) {
    final activeWs = ref.read(activeWorkspaceProvider);
    final team = ['Ahmed', 'Sarah', 'Ali', 'Unassigned'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Assign Workspace Ticket', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...team.map((member) => ListTile(
              leading: CircleAvatar(
                radius: 14,
                backgroundColor: member == 'Unassigned' ? Colors.white12 : ZeTheme.primary.withOpacity(0.2),
                child: Text(
                  member == 'Unassigned' ? '?' : member[0], 
                  style: TextStyle(color: member == 'Unassigned' ? Colors.white60 : ZeTheme.secondary, fontSize: 12)
                ),
              ),
              title: Text(member, style: GoogleFonts.outfit(color: Colors.white)),
              trailing: (member == 'Unassigned' && conv.assignee == null) || (member == conv.assignee)
                  ? const Icon(Icons.check, color: ZeTheme.secondary)
                  : null,
              onTap: () {
                ref.read(conversationsProvider.notifier).assign(conv.id, member, 'Ahmed', (desc) {
                  ref.read(auditLogProvider.notifier).log(activeWs.id, desc, 'Ahmed');
                });
                Navigator.pop(context);
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showCommentInput(BuildContext context, Conversation conv) {
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
            Row(
              children: [
                Icon(LucideIcons.lock, size: 14, color: ZeTheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Write Internal Comment',
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Comments are internal to workspace team members and are never sent to the customer.',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _commentController,
              maxLines: 3,
              autofocus: true,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Discuss rate limits, draft review, notes...',
                hintStyle: GoogleFonts.outfit(color: (Theme.of(context).brightness == Brightness.dark ? Colors.white24 : const Color(0xFFCBD5E1)), fontSize: 14),
                filled: true,
                fillColor: Colors.white.withOpacity(0.02),
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
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: ZeTheme.primary),
                onPressed: () {
                  final text = _commentController.text.trim();
                  if (text.isNotEmpty) {
                    ref.read(conversationsProvider.notifier).addComment(
                      conv.id, 
                      text, 
                      'Ahmed', 
                      (desc) => ref.read(auditLogProvider.notifier).log(activeWs.id, desc, 'Ahmed')
                    );
                    _commentController.clear();
                    Navigator.pop(context);
                    
                    // Auto-scroll list to bottom after short delay
                    Future.delayed(const Duration(milliseconds: 200), () {
                      _scrollController.animateTo(
                        _scrollController.position.maxScrollExtent,
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOut,
                      );
                    });
                  }
                },
                child: Text('Post Note', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showReplyDialog(BuildContext context, Conversation conv) {
    final activeWs = ref.read(activeWorkspaceProvider);
    _replyController.clear();

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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.reply, size: 16, color: ZeTheme.secondary),
                    const SizedBox(width: 8),
                    Text(
                      'Compose Reply',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: ZeTheme.secondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'via Resend Send API',
                    style: GoogleFonts.outfit(fontSize: 10, color: ZeTheme.secondary, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'To: ${conv.senderName} <${conv.senderEmail}>\nFrom: support@${activeWs.id == 'ws_zeppelin' ? 'zeppelinlabs.dev' : 'acme.org'}',
              style: GoogleFonts.outfit(fontSize: 12, color: (Theme.of(context).brightness == Brightness.dark ? Colors.white54 : const Color(0xFF64748B)), height: 1.4),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _replyController,
              maxLines: 6,
              autofocus: true,
              style: TextStyle(color: (Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A)), fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Write your email response here...',
                hintStyle: GoogleFonts.outfit(color: (Theme.of(context).brightness == Brightness.dark ? Colors.white24 : const Color(0xFFCBD5E1)), fontSize: 14),
                filled: true,
                fillColor: Colors.white.withOpacity(0.02),
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
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Resend OAuth connection verified.'
                  style: GoogleFonts.outfit(fontSize: 11, color: ZeTheme.statusResolved),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: ZeTheme.primary),
                  onPressed: () {
                    final text = _replyController.text.trim();
                    if (text.isNotEmpty) {
                      // Perform State modifications
                      ref.read(conversationsProvider.notifier).sendReply(
                        conv.id,
                        text,
                        'Ahmed',
                        (desc) => ref.read(auditLogProvider.notifier).log(activeWs.id, desc, 'Ahmed'),
                        (to, subject, body) => ref.read(outboundEmailsProvider.notifier).sendOutbound(activeWs.id, to, subject, body),
                      );
                      
                      Navigator.pop(context);
                      
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Reply transmitted via Resend API successfully!'),
                          backgroundColor: ZeTheme.statusResolved,
                        ),
                      );

                      // Auto-scroll list to bottom after short delay
                      Future.delayed(const Duration(milliseconds: 200), () {
                        _scrollController.animateTo(
                          _scrollController.position.maxScrollExtent,
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOut,
                        );
                      });
                    }
                  },
                  child: Row(
                    children: [
                      Text('Send Email', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(width: 6),
                      Icon(LucideIcons.send, size: 14, color: Colors.white),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
