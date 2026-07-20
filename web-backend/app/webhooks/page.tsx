'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface WebhookLog {
  id: string;
  action: string;
  metadata: {
    event_type: string;
    token_provided: boolean;
  };
  created_at: string;
}

export default function WebhookLogsPage() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchWebhooks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    console.log('[Webhooks Page] Fetching webhook logs for user:', session.user.id);

    // Fetch webhook logs from audit_logs
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, metadata, created_at')
      .eq('user_id', session.user.id)
      .eq('action', 'webhook.received')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Webhooks Page] Error fetching webhooks:', error);
    } else {
      console.log('[Webhooks Page] Fetched webhooks:', data?.length || 0);
      setWebhooks(data as WebhookLog[]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchWebhooks();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWebhooks();
    setRefreshing(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Webhook Logs</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {webhooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No webhook events yet</h3>
            <p className="text-gray-500">Webhook events from Resend will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {webhook.metadata?.event_type || 'unknown'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(webhook.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    Token provided: {webhook.metadata?.token_provided ? '✓ Yes' : '✗ No'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
