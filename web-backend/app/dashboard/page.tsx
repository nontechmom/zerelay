'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

        // Only redirect to onboarding if user hasn't completed it
        if (!data.onboardingCompletedAt && !data.hasApiKey) {
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
            <div className="bg-gray-50 p-4 rounded border border-gray-300">
              <code className="text-sm break-all text-blue-600">{status.webhookUrl}</code>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => alert('Send Test Email feature coming soon!')}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Test Email
            </button>
            <button 
              onClick={() => alert('Email History feature coming soon!')}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              View Email History
            </button>
            <button 
              onClick={() => router.push('/onboarding')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Manage API Keys
            </button>
            <button 
              onClick={async () => {
                await fetchStatus();
                alert('Status refreshed!');
              }}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
