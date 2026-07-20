'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

interface InboxMessage {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  text_body: string | null;
  html_body: string | null;
  event_type: string;
  is_read: boolean;
  received_at: string;
  mailbox: {
    id: string;
    email_address: string;
    display_name: string | null;
  } | null;
}

function InboxContent() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const fetchMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const mailboxId = searchParams.get('mailbox_id');
    const params = new URLSearchParams();
    
    if (mailboxId) params.append('mailbox_id', mailboxId);
    if (filter !== 'all') params.append('is_read', filter === 'read' ? 'true' : 'false');

    const response = await fetch(`/api/inbox?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages);
      setUnreadCount(data.unreadCount);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const handleMarkAsRead = async (messageId: string, currentReadState: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/inbox/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_read: !currentReadState }),
      });

      if (response.ok) {
        fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, is_read: !currentReadState });
        }
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/inbox/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
        fetchMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSelectMessage = async (message: InboxMessage) => {
    setSelectedMessage(message);
    
    // Mark as read when opened
    if (!message.is_read) {
      handleMarkAsRead(message.id, false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
            {unreadCount > 0 && (
              <span className="ml-3 px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Read
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
            <p className="text-gray-500">Received emails will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List */}
            <div className="lg:col-span-1 space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedMessage?.id === message.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : message.is_read
                      ? 'bg-white border border-gray-200 hover:bg-gray-50'
                      : 'bg-white border-2 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!message.is_read ? 'font-bold' : 'font-medium'}`}>
                        {message.from_name || message.from_email}
                      </p>
                      {message.mailbox && (
                        <p className="text-xs text-gray-500 truncate">
                          To: {message.mailbox.email_address}
                        </p>
                      )}
                    </div>
                    {!message.is_read && (
                      <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate mb-1">
                    {message.subject || '(No subject)'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.received_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedMessage.subject || '(No subject)'}
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkAsRead(selectedMessage.id, selectedMessage.is_read)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          {selectedMessage.is_read ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="border-b pb-4 mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">From:</span> {selectedMessage.from_name || selectedMessage.from_email}
                        {selectedMessage.from_name && (
                          <span className="text-gray-500"> &lt;{selectedMessage.from_email}&gt;</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">To:</span> {selectedMessage.mailbox?.email_address || selectedMessage.to_email}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Date:</span> {new Date(selectedMessage.received_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Event: {selectedMessage.event_type}
                      </p>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    {selectedMessage.html_body ? (
                      <div
                        className="border rounded p-4 bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: selectedMessage.html_body }}
                      />
                    ) : selectedMessage.text_body ? (
                      <div className="whitespace-pre-wrap border rounded p-4 bg-gray-50">
                        {selectedMessage.text_body}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">(No content)</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-gray-500">Select a message to view</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}
