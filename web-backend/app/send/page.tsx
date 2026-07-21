'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SendEmailPage() {
  const [from, setFrom] = useState('onboarding@resend.dev');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchMailboxes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch user's mailboxes
      const { data: userMailboxes } = await supabase
        .from('mailboxes')
        .select('id, email_address, display_name, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      setMailboxes(userMailboxes || []);
      
      // If mailboxes exist, set the first one as default
      if (userMailboxes && userMailboxes.length > 0) {
        setFrom(userMailboxes[0].email_address);
      }
      
      setLoading(false);
    };

    fetchMailboxes();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage('❌ Not authenticated');
        return;
      }

      const response = await fetch('/api/resend/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Email sent successfully! ID: ${data.id || 'N/A'}`);
        // Clear form
        setTo('');
        setSubject('');
        setHtml('');
      } else {
        setMessage(`❌ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Send Email</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.startsWith('✅') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSend}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From <span className="text-red-500">*</span>
              </label>
              {mailboxes.length > 0 ? (
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {mailboxes.map((mailbox) => (
                    <option key={mailbox.id} value={mailbox.email_address}>
                      {mailbox.email_address}
                      {mailbox.display_name && ` (${mailbox.display_name})`}
                    </option>
                  ))}
                  <option value="onboarding@resend.dev">
                    onboarding@resend.dev (Fallback)
                  </option>
                </select>
              ) : (
                <>
                  <input
                    type="email"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Using onboarding@resend.dev. Add a verified domain and create a mailbox to send from your own email.
                  </p>
                </>
              )}
              {mailboxes.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Select from your configured mailboxes
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="<h1>Hello World</h1><p>Your email content here...</p>"
                required
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                HTML email content
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {sending ? 'Sending...' : 'Send Email'}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Template Examples */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quick HTML Templates</h3>
          <div className="space-y-2 text-sm">
            <button
              onClick={() => setHtml('<h1>Welcome!</h1><p>Thank you for signing up.</p>')}
              className="block text-blue-600 hover:underline"
            >
              → Simple Welcome Email
            </button>
            <button
              onClick={() => setHtml('<div style="font-family: Arial, sans-serif;"><h2>Newsletter</h2><p>Here\'s what\'s new this week...</p><hr><p style="color: #666; font-size: 12px;">Unsubscribe</p></div>')}
              className="block text-blue-600 hover:underline"
            >
              → Newsletter Template
            </button>
            <button
              onClick={() => setHtml('<div style="background: #f4f4f4; padding: 20px;"><div style="background: white; padding: 30px; border-radius: 8px;"><h1 style="color: #333;">Notification</h1><p>You have a new message.</p><a href="#" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Message</a></div></div>')}
              className="block text-blue-600 hover:underline"
            >
              → Notification with Button
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
