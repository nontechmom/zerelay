'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [message, setMessage] = useState('');
  const [webhookMessage, setWebhookMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUser(profile);
        setDisplayName(profile.display_name || '');
      }

      // Fetch integration status
      const statusResponse = await fetch('/api/onboarding', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setIntegrationStatus(statusData);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ display_name: displayName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage('✅ Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleReconfigureIntegration = () => {
    router.push('/onboarding');
  };

  const handleUpdateWebhookSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    setWebhookMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          step: 'store_signing_secret',
          signing_secret: webhookSecret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setWebhookMessage('✅ Webhook secret updated successfully!');
        setWebhookSecret('');
        
        // Refresh integration status
        const statusResponse = await fetch('/api/onboarding', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIntegrationStatus(statusData);
        }
        
        setTimeout(() => setWebhookMessage(''), 5000);
      } else {
        setWebhookMessage(`❌ ${data.error || 'Failed to update webhook secret'}`);
      }
    } catch (error) {
      setWebhookMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Note: Actual account deletion should be handled carefully
    // This is a placeholder for the UI
    setMessage('⚠️ Account deletion not implemented yet. Please contact support.');
    setShowDeleteConfirm(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.startsWith('✅') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : message.startsWith('❌')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Integration Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resend Integration</h2>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Current Status</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                API Key: <span className={integrationStatus?.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                  {integrationStatus?.hasApiKey ? '✓ Configured' : '✗ Not configured'}
                </span>
              </p>
              <p className="text-gray-600">
                Webhook: <span className={integrationStatus?.webhookActive ? 'text-green-600' : 'text-red-600'}>
                  {integrationStatus?.webhookActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </p>
              {integrationStatus?.webhookUrl && (
                <p className="text-gray-600 mt-2">
                  <span className="font-medium">Webhook URL:</span>
                  <br />
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block break-all">
                    {integrationStatus.webhookUrl}
                  </code>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Update Webhook Secret</h3>
              <p className="text-sm text-gray-600 mb-3">
                Update your webhook signing secret without going through the full onboarding again.
              </p>
              
              {webhookMessage && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${
                  webhookMessage.startsWith('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {webhookMessage}
                </div>
              )}

              <form onSubmit={handleUpdateWebhookSecret}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Signing Secret
                  </label>
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get this from your Resend dashboard webhook settings
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingWebhook || !webhookSecret}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {savingWebhook ? 'Updating...' : 'Update Webhook Secret'}
                </button>
              </form>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-800 mb-2">Full Reconfiguration</h3>
              <p className="text-sm text-gray-600 mb-3">
                Need to change your API key or start over? This will take you through the complete setup again.
              </p>
              <button
                onClick={handleReconfigureIntegration}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Reconfigure Integration
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
          
          {!showDeleteConfirm ? (
            <>
              <p className="text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </>
          ) : (
            <>
              <p className="text-red-600 font-semibold mb-4">
                Are you sure? This action cannot be undone!
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
