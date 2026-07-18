import 'package:flutter_riverpod/flutter_riverpod.dart';

// --- MODELS ---

class Workspace {
  final String id;
  final String name;
  final String description;

  Workspace({
    required this.id,
    required this.name,
    required this.description,
  });

  Workspace copyWith({String? name, String? description}) {
    return Workspace(
      id: id,
      name: name ?? this.name,
      description: description ?? this.description,
    );
  }
}

class UserProfile {
  final String id;
  final String name;
  final String email;
  final String resendApiKey;
  final String resendConnectionMethod;
  final String webhookToken;

  UserProfile({
    required this.id,
    required this.name,
    required this.email,
    this.resendApiKey = '',
    this.resendConnectionMethod = 'none',
    required this.webhookToken,
  });

  bool get isResendConnected => resendConnectionMethod != 'none' || resendApiKey.isNotEmpty;

  String get resendConnectionLabel {
    if (resendConnectionMethod == 'oauth') return 'Connected with Resend OAuth';
    if (resendApiKey.isNotEmpty) return 'Connected with API key fallback';
    return 'Not connected';
  }

  UserProfile copyWith({
    String? name,
    String? email,
    String? resendApiKey,
    String? resendConnectionMethod,
    String? webhookToken,
  }) {
    return UserProfile(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      resendApiKey: resendApiKey ?? this.resendApiKey,
      resendConnectionMethod: resendConnectionMethod ?? this.resendConnectionMethod,
      webhookToken: webhookToken ?? this.webhookToken,
    );
  }
}

class EmailMessage {
  final String id;
  final String sender;
  final String senderEmail;
  final DateTime timestamp;
  final String content;
  final List<String> attachments;

  EmailMessage({
    required this.id,
    required this.sender,
    required this.senderEmail,
    required this.timestamp,
    required this.content,
    required this.attachments,
  });
}

class InternalComment {
  final String id;
  final String author;
  final String text;
  final DateTime timestamp;

  InternalComment({
    required this.id,
    required this.author,
    required this.text,
    required this.timestamp,
  });
}

class Conversation {
  final String id;
  final String workspaceId;
  final String senderName;
  final String senderEmail;
  final String subject;
  final String bodyPreview;
  final List<EmailMessage> messages;
  final List<InternalComment> comments;
  final String? assignee;
  final String status; // Open, In Progress, Waiting, Resolved, Closed
  final String priority; // Low, Medium, High, Urgent
  final bool isUnread;
  final DateTime timestamp;

  Conversation({
    required this.id,
    required this.workspaceId,
    required this.senderName,
    required this.senderEmail,
    required this.subject,
    required this.bodyPreview,
    required this.messages,
    required this.comments,
    this.assignee,
    required this.status,
    required this.priority,
    required this.isUnread,
    required this.timestamp,
  });

  Conversation copyWith({
    List<EmailMessage>? messages,
    List<InternalComment>? comments,
    String? assignee,
    String? status,
    String? priority,
    bool? isUnread,
    DateTime? timestamp,
  }) {
    return Conversation(
      id: id,
      workspaceId: workspaceId,
      senderName: senderName,
      senderEmail: senderEmail,
      subject: subject,
      bodyPreview: bodyPreview,
      messages: messages ?? this.messages,
      comments: comments ?? this.comments,
      assignee: assignee == 'Unassigned' ? null : (assignee ?? this.assignee),
      status: status ?? this.status,
      priority: priority ?? this.priority,
      isUnread: isUnread ?? this.isUnread,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}

class OutboundEmail {
  final String id;
  final String workspaceId;
  final String to;
  final String subject;
  final String body;
  final String status; // Sent, Delivered, Opened, Clicked, Failed, Bounced
  final DateTime timestamp;

  OutboundEmail({
    required this.id,
    required this.workspaceId,
    required this.to,
    required this.subject,
    required this.body,
    required this.status,
    required this.timestamp,
  });
}

class Domain {
  final String id;
  final String workspaceId;
  final String name;
  final String status; // Verified, Pending, Failed
  final bool spfVerified;
  final bool dkimVerified;
  final bool dmarcVerified;
  final String txtRecord;
  final String mxRecord;

  Domain({
    required this.id,
    required this.workspaceId,
    required this.name,
    required this.status,
    this.spfVerified = false,
    this.dkimVerified = false,
    this.dmarcVerified = false,
    required this.txtRecord,
    required this.mxRecord,
  });

  Domain copyWith({
    String? status,
    bool? spfVerified,
    bool? dkimVerified,
    bool? dmarcVerified,
  }) {
    return Domain(
      id: id,
      workspaceId: workspaceId,
      name: name,
      status: status ?? this.status,
      spfVerified: spfVerified ?? this.spfVerified,
      dkimVerified: dkimVerified ?? this.dkimVerified,
      dmarcVerified: dmarcVerified ?? this.dmarcVerified,
      txtRecord: txtRecord,
      mxRecord: mxRecord,
    );
  }
}

class AuditLogEvent {
  final String id;
  final String workspaceId;
  final String description;
  final String actor;
  final DateTime timestamp;

  AuditLogEvent({
    required this.id,
    required this.workspaceId,
    required this.description,
    required this.actor,
    required this.timestamp,
  });
}

// --- STATE NOTIFIERS ---

class WorkspaceNotifier extends StateNotifier<List<Workspace>> {
  WorkspaceNotifier() : super([
    Workspace(id: 'ws_zeppelin', name: 'Zeppelin Labs', description: 'Primary engineering team workspace'),
    Workspace(id: 'ws_acme', name: 'Acme Corp', description: 'Marketing and customer support operations'),
  ]);

  void addWorkspace(String name, String desc) {
    final newWs = Workspace(
      id: 'ws_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      description: desc,
    );
    state = [...state, newWs];
  }
}

class ConversationNotifier extends StateNotifier<List<Conversation>> {
  ConversationNotifier() : super(_initialConversations);

  void markAsRead(String id) {
    state = [
      for (var conv in state)
        if (conv.id == id) conv.copyWith(isUnread: false) else conv
    ];
  }

  void assign(String id, String? assignee, String actor, Function(String) addLog) {
    state = [
      for (var conv in state)
        if (conv.id == id) () {
          final updated = conv.copyWith(assignee: assignee);
          final label = assignee == null || assignee == 'Unassigned' ? 'unassigned the conversation' : 'assigned the conversation to $assignee';
          addLog('$actor $label');
          return updated;
        }() else conv
    ];
  }

  void setStatus(String id, String status, String actor, Function(String) addLog) {
    state = [
      for (var conv in state)
        if (conv.id == id) () {
          final updated = conv.copyWith(status: status);
          addLog('$actor updated status to $status');
          return updated;
        }() else conv
    ];
  }

  void setPriority(String id, String priority, String actor, Function(String) addLog) {
    state = [
      for (var conv in state)
        if (conv.id == id) () {
          final updated = conv.copyWith(priority: priority);
          addLog('$actor set priority to $priority');
          return updated;
        }() else conv
    ];
  }

  void addComment(String id, String text, String author, Function(String) addLog) {
    state = [
      for (var conv in state)
        if (conv.id == id) () {
          final newComment = InternalComment(
            id: 'c_${DateTime.now().millisecondsSinceEpoch}',
            author: author,
            text: text,
            timestamp: DateTime.now(),
          );
          final updated = conv.copyWith(comments: [...conv.comments, newComment]);
          addLog('$author added an internal comment');
          return updated;
        }() else conv
    ];
  }

  void sendReply(String id, String text, String sender, Function(String) addLog, Function(String, String, String) logOutbound) {
    state = [
      for (var conv in state)
        if (conv.id == id) () {
          final newMsg = EmailMessage(
            id: 'm_${DateTime.now().millisecondsSinceEpoch}',
            sender: sender,
            senderEmail: 'support@zeppelinlabs.dev',
            timestamp: DateTime.now(),
            content: text,
            attachments: [],
          );
          final updated = conv.copyWith(
            messages: [...conv.messages, newMsg],
            timestamp: DateTime.now(),
            isUnread: false,
          );
          addLog('$sender sent a reply to ${conv.senderName}');
          logOutbound(conv.senderEmail, conv.subject, text);
          return updated;
        }() else conv
    ];
  }

  void receiveWebhook(Conversation newConv) {
    state = [newConv, ...state];
  }
}

class OutboundNotifier extends StateNotifier<List<OutboundEmail>> {
  OutboundNotifier() : super(_initialOutbounds);

  void sendOutbound(String workspaceId, String to, String subject, String body) {
    final newMail = OutboundEmail(
      id: 'out_${DateTime.now().millisecondsSinceEpoch}',
      workspaceId: workspaceId,
      to: to,
      subject: subject,
      body: body,
      status: 'Sent',
      timestamp: DateTime.now(),
    );
    state = [newMail, ...state];

    // Simulate delivery in steps
    Future.delayed(const Duration(seconds: 2), () {
      state = [
        for (var mail in state)
          if (mail.id == newMail.id)
            OutboundEmail(
              id: mail.id,
              workspaceId: mail.workspaceId,
              to: mail.to,
              subject: mail.subject,
              body: mail.body,
              status: 'Delivered',
              timestamp: mail.timestamp,
            )
          else
            mail
      ];
    });

    Future.delayed(const Duration(seconds: 4), () {
      state = [
        for (var mail in state)
          if (mail.id == newMail.id)
            OutboundEmail(
              id: mail.id,
              workspaceId: mail.workspaceId,
              to: mail.to,
              subject: mail.subject,
              body: mail.body,
              status: 'Opened',
              timestamp: mail.timestamp,
            )
          else
            mail
      ];
    });
  }
}

class DomainNotifier extends StateNotifier<List<Domain>> {
  DomainNotifier() : super(_initialDomains);

  void verify(String id, String actor, Function(String) addLog) {
    state = [
      for (var dom in state)
        if (dom.id == id) () {
          final updated = dom.copyWith(
            status: 'Verified',
            spfVerified: true,
            dkimVerified: true,
            dmarcVerified: true,
          );
          addLog('$actor verified domain ${dom.name}');
          return updated;
        }() else dom
    ];
  }

  void addDomain(String workspaceId, String name) {
    final newDom = Domain(
      id: 'dom_${DateTime.now().millisecondsSinceEpoch}',
      workspaceId: workspaceId,
      name: name,
      status: 'Pending',
      spfVerified: false,
      dkimVerified: false,
      dmarcVerified: false,
      txtRecord: 'resend-key=resend_spf_verification_token',
      mxRecord: 'feedback-smtp.us-east-1.amazonses.com',
    );
    state = [...state, newDom];
  }
}

class AuditLogNotifier extends StateNotifier<List<AuditLogEvent>> {
  AuditLogNotifier() : super(_initialLogs);

  void log(String workspaceId, String desc, String actor) {
    final newEvent = AuditLogEvent(
      id: 'log_${DateTime.now().millisecondsSinceEpoch}',
      workspaceId: workspaceId,
      description: desc,
      actor: actor,
      timestamp: DateTime.now(),
    );
    state = [newEvent, ...state];
  }
}

// --- PROVIDERS ---

final workspacesProvider = StateNotifierProvider<WorkspaceNotifier, List<Workspace>>((ref) {
  return WorkspaceNotifier();
});

final activeWorkspaceProvider = StateProvider<Workspace>((ref) {
  final list = ref.watch(workspacesProvider);
  return list.first;
});

final activeUserProvider = StateProvider<UserProfile>((ref) {
  return UserProfile(
    id: 'user_ahmed',
    name: 'Ahmed',
    email: 'ahmed@zeppelinlabs.dev',
    webhookToken: 'wh_user_ahmed',
  );
});

final conversationsProvider = StateNotifierProvider<ConversationNotifier, List<Conversation>>((ref) {
  return ConversationNotifier();
});

final outboundEmailsProvider = StateNotifierProvider<OutboundNotifier, List<OutboundEmail>>((ref) {
  return OutboundNotifier();
});

final domainsProvider = StateNotifierProvider<DomainNotifier, List<Domain>>((ref) {
  return DomainNotifier();
});

final auditLogProvider = StateNotifierProvider<AuditLogNotifier, List<AuditLogEvent>>((ref) {
  return AuditLogNotifier();
});

// --- INITIAL DUMMY DATA ---

final List<Conversation> _initialConversations = [
  Conversation(
    id: 'c1',
    workspaceId: 'ws_zeppelin',
    senderName: 'John Smith',
    senderEmail: 'john@acme.com',
    subject: 'Production API Failures & Outages',
    bodyPreview: 'Getting 500 errors consistently on POST /v1/send in US-West...',
    assignee: 'Ahmed',
    status: 'Open',
    priority: 'Urgent',
    isUnread: true,
    timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
    messages: [
      EmailMessage(
        id: 'm1_1',
        sender: 'John Smith',
        senderEmail: 'john@acme.com',
        timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
        content: 'Hi support team,\n\nWe are getting 500 Internal Server errors consistently when calling the POST /v1/send endpoint in our production environments in US-West-2. Can someone inspect our account limit or if there is an outage in that region?\n\nThis is impacting critical user onboarding emails right now.\n\nThanks,\nJohn Smith',
        attachments: ['api_log.txt', 'error_screengrab.png'],
      ),
    ],
    comments: [
      InternalComment(
        id: 'c1_1',
        author: 'Ahmed',
        text: 'Inspected Resend logs. It looks like their rate limit is capped at 100 req/s but they are hitting 250 req/s. We might need to ask them to upgrade or apply a temporary buffer.',
        timestamp: DateTime.now().subtract(const Duration(minutes: 3)),
      )
    ],
  ),
  Conversation(
    id: 'c2',
    workspaceId: 'ws_zeppelin',
    senderName: 'GitHub Enterprise',
    senderEmail: 'noreply@github.com',
    subject: '[Approved] PR #432: Add automated DKIM validation worker',
    bodyPreview: 'Sarah approved this pull request. All status checks passed...',
    assignee: 'Sarah',
    status: 'In Progress',
    priority: 'Medium',
    isUnread: false,
    timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
    messages: [
      EmailMessage(
        id: 'm2_1',
        sender: 'GitHub',
        senderEmail: 'noreply@github.com',
        timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
        content: 'PR #432 "Add automated DKIM validation worker" was approved by Sarah.\n\nAll status checks (Sentry build, Flutter analyzer) passed successfully. Merging is enabled.',
        attachments: [],
      ),
    ],
    comments: [],
  ),
  Conversation(
    id: 'c3',
    workspaceId: 'ws_zeppelin',
    senderName: 'Stripe Billings',
    senderEmail: 'billing@stripe.com',
    subject: 'Monthly billing cycle success receipt',
    bodyPreview: 'We charged your card ending in 4242 for Pro account workspace usage...',
    assignee: null,
    status: 'Resolved',
    priority: 'Low',
    isUnread: false,
    timestamp: DateTime.now().subtract(const Duration(hours: 3)),
    messages: [
      EmailMessage(
        id: 'm3_1',
        sender: 'Stripe',
        senderEmail: 'billing@stripe.com',
        timestamp: DateTime.now().subtract(const Duration(hours: 3)),
        content: 'Your transaction for \$29.00 was successful. The invoice details are attached below. Your workspace Zeppelin Labs is updated through the end of August.',
        attachments: ['invoice_39420.pdf'],
      ),
    ],
    comments: [],
  ),
  Conversation(
    id: 'c4',
    workspaceId: 'ws_acme',
    senderName: 'Customer Support Bot',
    senderEmail: 'bot@acme.com',
    subject: 'Alert: User signup drop-off alert in Acme Workspace',
    bodyPreview: 'Inbound email alerts are detecting a 15% drop-off in registration validation...',
    assignee: 'Ali',
    status: 'Waiting',
    priority: 'High',
    isUnread: true,
    timestamp: DateTime.now().subtract(const Duration(days: 1)),
    messages: [
      EmailMessage(
        id: 'm4_1',
        sender: 'Customer Support Bot',
        senderEmail: 'bot@acme.com',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        content: 'System Monitor alert:\n\nUser signup drop-off has crossed the threshold. Normal range: 5%. Current range: 18% in the last 6 hours.',
        attachments: [],
      ),
    ],
    comments: [],
  ),
];

final List<OutboundEmail> _initialOutbounds = [
  OutboundEmail(
    id: 'o1',
    workspaceId: 'ws_zeppelin',
    to: 'john@acme.com',
    subject: 'Re: Production API Failures & Outages',
    body: 'Hi John, we are checking this right now. Our engineering team is reviewing your rates...',
    status: 'Clicked',
    timestamp: DateTime.now().subtract(const Duration(minutes: 2)),
  ),
  OutboundEmail(
    id: 'o2',
    workspaceId: 'ws_zeppelin',
    to: 'devs@zeppelinlabs.dev',
    subject: 'System Alert: Sentry notification update',
    body: 'Alert triggered for workspace limit reached on inbound mail relay...',
    status: 'Delivered',
    timestamp: DateTime.now().subtract(const Duration(minutes: 40)),
  ),
  OutboundEmail(
    id: 'o3',
    workspaceId: 'ws_zeppelin',
    to: 'user_482@gmail.com',
    subject: 'Verify your Zeppelin workspace invitation link',
    body: 'Click here to verify and connect to your team workspace...',
    status: 'Bounced',
    timestamp: DateTime.now().subtract(const Duration(hours: 5)),
  )
];

final List<Domain> _initialDomains = [
  Domain(
    id: 'd1',
    workspaceId: 'ws_zeppelin',
    name: 'zeppelinlabs.dev',
    status: 'Verified',
    spfVerified: true,
    dkimVerified: true,
    dmarcVerified: true,
    txtRecord: 'resend-key=re_438209843920',
    mxRecord: 'feedback-smtp.us-east-1.amazonses.com',
  ),
  Domain(
    id: 'd2',
    workspaceId: 'ws_zeppelin',
    name: 'mail.zeppelindevs.com',
    status: 'Pending',
    spfVerified: false,
    dkimVerified: false,
    dmarcVerified: false,
    txtRecord: 'resend-key=re_748293749823',
    mxRecord: 'feedback-smtp.us-east-1.amazonses.com',
  ),
  Domain(
    id: 'd3',
    workspaceId: 'ws_acme',
    name: 'acme.org',
    status: 'Failed',
    spfVerified: false,
    dkimVerified: false,
    dmarcVerified: false,
    txtRecord: 'resend-key=re_938472938472',
    mxRecord: 'feedback-smtp.us-east-1.amazonses.com',
  )
];

final List<AuditLogEvent> _initialLogs = [
  AuditLogEvent(
    id: 'l1',
    workspaceId: 'ws_zeppelin',
    description: 'Ahmed assigned the conversation "Production API Failures & Outages" to Ahmed',
    actor: 'Ahmed',
    timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
  ),
  AuditLogEvent(
    id: 'l2',
    workspaceId: 'ws_zeppelin',
    description: 'Ahmed added an internal comment: "Inspected Resend logs..."',
    actor: 'Ahmed',
    timestamp: DateTime.now().subtract(const Duration(minutes: 3)),
  ),
  AuditLogEvent(
    id: 'l3',
    workspaceId: 'ws_zeppelin',
    description: 'Sarah updated DKIM records verification status for zeppelinlabs.dev',
    actor: 'Sarah',
    timestamp: DateTime.now().subtract(const Duration(hours: 1)),
  )
];
