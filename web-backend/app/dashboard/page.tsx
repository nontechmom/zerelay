'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const fetchStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch('/api/onboarding', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Onboarding status fetched:', data);
      setStatus(data);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingEmail(true);
    setEmailMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setEmailMessage('Not authenticated');
        return;
      }

      const response = await fetch('/api/resend/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: user?.email || 'test@example.com',
          subject: 'Test Email from ZeRelay Dashboard',
          html: `
            <h1>Test Email Successful!</h1>
            <p>This is a test email sent from your ZeRelay dashboard.</p>
            <p>If you're receiving this, your integration is working perfectly! 🎉</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
            <p style="color: #999; font-size: 11px;">Note: This email is sent from onboarding@resend.dev. After adding your verified domain in Resend, you can send from your own domain.</p>
          `,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailMessage(`✅ Test email sent successfully! Email ID: ${data.id || 'N/A'}`);
      } else {
        setEmailMessage(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setEmailMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      
      // Fetch onboarding status
      const response = await fetch('/api/onboarding', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Onboarding status fetched:', data);
        setStatus(data);

        // Only redirect to onboarding if user has NEVER completed it
        // Check if onboardingCompletedAt is null (never completed)
        if (!data.onboardingCompletedAt) {
          router.push('/onboarding');
          return;
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ZeRelay Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's an overview of your ZeRelay integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Status Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">API Key Status</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {status?.hasApiKey ? '✓' : '✗'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {status?.hasApiKey ? 'Connected' : 'Not connected'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Webhook Status</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {status?.webhookActive ? '✓' : '✗'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {status?.webhookActive ? 'Active' : 'Inactive'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Integration</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {status?.onboardingComplete ? '✓' : '⚠️'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {status?.onboardingComplete ? 'Complete' : 'Incomplete'}
            </p>
          </div>
        </div>

        {/* Webhook URL */}
        {status?.webhookUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Webhook URL</h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-300 flex items-center justify-between">
              <code className="text-sm break-all text-blue-600 flex-1">{status.webhookUrl}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(status.webhookUrl);
                  alert('Webhook URL copied to clipboard!');
                }}
                className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Email Test Message */}
        {emailMessage && (
          <div className={`mb-8 p-4 rounded-lg ${emailMessage.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {emailMessage}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/inbox')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              Inbox
            </button>

            <button 
              onClick={() => router.push('/send')}
              disabled={!status?.hasApiKey}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Email
            </button>
            
            <button 
              onClick={handleSendTestEmail}
              disabled={sendingEmail || !status?.hasApiKey}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {sendingEmail ? 'Sending...' : 'Test Email'}
            </button>

            <button 
              onClick={() => router.push('/domains')}
              className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Domains
            </button>

            <button 
              onClick={() => router.push('/mailboxes')}
              className="px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
              Mailboxes
            </button>
            
            <button 
              onClick={() => router.push('/emails')}
              disabled={!status?.hasApiKey}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Sent History
            </button>
            
            <button 
              onClick={() => router.push('/webhooks')}
              disabled={!status?.webhookActive}
              className="px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Webhook Logs
            </button>
            
            <button 
              onClick={() => router.push('/settings')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            
            <button 
              onClick={() => router.push('/onboarding')}
              className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reconfigure
            </button>
          </div>
        </div>

        {/* Recent Activity / Audit Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-sm text-gray-600">
            <p>✅ Integration completed at: {status?.onboardingCompletedAt ? new Date(status.onboardingCompletedAt).toLocaleString() : 'N/A'}</p>
            <p>✅ API Key configured at: {status?.apiKeyConfiguredAt ? new Date(status.apiKeyConfiguredAt).toLocaleString() : 'N/A'}</p>
            <p>✅ Webhook configured at: {status?.webhookConfiguredAt ? new Date(status.webhookConfiguredAt).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
