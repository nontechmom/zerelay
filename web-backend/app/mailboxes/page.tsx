'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

interface Mailbox {
  id: string;
  email_address: string;
  local_part: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  domain: {
    id: string;
    domain_name: string;
    status: string;
  };
}

interface Domain {
  id: string;
  domain_name: string;
  status: string;
}

function MailboxesContent() {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [localPart, setLocalPart] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // Fetch mailboxes
    const mailboxResponse = await fetch('/api/mailboxes', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (mailboxResponse.ok) {
      const data = await mailboxResponse.json();
      setMailboxes(data.mailboxes);
    }

    // Fetch domains
    const domainResponse = await fetch('/api/domains', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (domainResponse.ok) {
      const data = await domainResponse.json();
      setDomains(data.domains);
      
      // Pre-select domain from URL if provided
      const domainIdFromUrl = searchParams.get('domain_id');
      if (domainIdFromUrl && data.domains.some((d: Domain) => d.id === domainIdFromUrl)) {
        setSelectedDomainId(domainIdFromUrl);
      } else if (data.domains.length > 0) {
        setSelectedDomainId(data.domains[0].id);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/mailboxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          domain_id: selectedDomainId,
          local_part: localPart,
          display_name: displayName || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Mailbox created: ${data.mailbox.email_address}`);
        setLocalPart('');
        setDisplayName('');
        setShowAddForm(false);
        fetchData();
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ ${data.error || 'Failed to create mailbox'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (mailboxId: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mailboxes/${mailboxId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        setMessage(`✅ Mailbox ${!isActive ? 'activated' : 'deactivated'}`);
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling mailbox:', error);
    }
  };

  const handleDeleteMailbox = async (mailboxId: string) => {
    if (!confirm('Are you sure you want to delete this mailbox?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mailboxes/${mailboxId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setMessage('✅ Mailbox deleted');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting mailbox:', error);
    }
  };

  const handleBack = () => {
    router.push('/domains');
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
            <h1 className="text-2xl font-bold text-gray-900">Mailbox Management</h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={domains.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            + Add Mailbox
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.startsWith('✅')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {domains.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">No domains configured</h3>
            <p className="text-yellow-700 mb-4">You need to add a domain before creating mailboxes.</p>
            <button
              onClick={() => router.push('/domains')}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Go to Domains
            </button>
          </div>
        )}

        {showAddForm && domains.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Mailbox</h2>
            <form onSubmit={handleAddMailbox}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domain_name} ({domain.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local Part <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localPart}
                    onChange={(e) => setLocalPart(e.target.value)}
                    placeholder="support"
                    required
                    pattern="[a-zA-Z0-9._-]+"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">@</span>
                  <span className="text-gray-700 font-medium">
                    {domains.find((d) => d.id === selectedDomainId)?.domain_name || 'domain.com'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Only letters, numbers, dots, hyphens, and underscores allowed
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Support Team"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {adding ? 'Creating...' : 'Create Mailbox'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {mailboxes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mailboxes yet</h3>
            <p className="text-gray-500 mb-4">Create mailboxes to receive emails</p>
            {domains.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Mailbox
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {mailboxes.map((mailbox) => (
              <div key={mailbox.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{mailbox.email_address}</h3>
                    {mailbox.display_name && (
                      <p className="text-sm text-gray-600">{mailbox.display_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Domain: {mailbox.domain.domain_name} ({mailbox.domain.status})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      mailbox.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mailbox.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Created: {new Date(mailbox.created_at).toLocaleString()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/inbox?mailbox_id=${mailbox.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    View Inbox
                  </button>
                  <button
                    onClick={() => handleToggleActive(mailbox.id, mailbox.is_active)}
                    className={`px-4 py-2 text-white text-sm rounded ${
                      mailbox.is_active
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {mailbox.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteMailbox(mailbox.id)}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MailboxesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <MailboxesContent />
    </Suspense>
  );
}
