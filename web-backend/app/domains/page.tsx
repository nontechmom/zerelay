'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Domain {
  id: string;
  domain_name: string;
  resend_domain_id: string | null;
  status: 'pending' | 'verified' | 'failed';
  verified_at: string | null;
  created_at: string;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [resendDomainId, setResendDomainId] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const fetchDomains = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // Fetch domains from our database
    const response = await fetch('/api/domains', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setDomains(data.domains);
    } else {
      const errorData = await response.json();
      console.error('Error fetching domains:', errorData);
      setMessage(`❌ Failed to fetch domains: ${errorData.error || 'Unknown error'}`);
    }

    setLoading(false);
  };

  const handleSyncFromResend = async () => {
    setMessage('🔄 Syncing domains from Resend...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch domains from Resend API
      const resendResponse = await fetch('/api/resend/domains', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!resendResponse.ok) {
        setMessage('❌ Failed to fetch domains from Resend');
        return;
      }

      const resendData = await resendResponse.json();
      const resendDomains = resendData.data || [];

      if (resendDomains.length === 0) {
        setMessage('ℹ️ No domains found in your Resend account');
        return;
      }

      // Sync each domain to our database
      let syncedCount = 0;
      for (const resendDomain of resendDomains) {
        const domainResponse = await fetch('/api/domains', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            domain_name: resendDomain.name,
            resend_domain_id: resendDomain.id,
          }),
        });

        if (domainResponse.ok) {
          syncedCount++;
          
          // If domain is verified in Resend, mark it as verified in our DB
          if (resendDomain.status === 'verified') {
            const data = await domainResponse.json();
            await fetch(`/api/domains/${data.domain.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ status: 'verified' }),
            });
          }
        }
      }

      setMessage(`✅ Synced ${syncedCount} domain${syncedCount !== 1 ? 's' : ''} from Resend`);
      fetchDomains();
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(`❌ Error syncing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          domain_name: domainName,
          resend_domain_id: resendDomainId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Domain added successfully!');
        setDomainName('');
        setResendDomainId('');
        setShowAddForm(false);
        fetchDomains();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${data.error || 'Failed to add domain'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (domainId: string, status: 'verified' | 'failed') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setMessage(`✅ Domain status updated to ${status}`);
        fetchDomains();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating domain:', error);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setMessage('✅ Domain deleted');
        fetchDomains();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Domain Management</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncFromResend}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🔄 Sync from Resend
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Domain
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.startsWith('✅') || message.startsWith('🔄')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : message.startsWith('ℹ️')
              ? 'bg-blue-50 border border-blue-200 text-blue-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📌 How to add domains</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>First, add and verify your domain in your <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline font-medium">Resend Dashboard</a></li>
            <li>Then click the <strong>"🔄 Sync from Resend"</strong> button above to import your verified domains</li>
            <li>Or manually add a domain using the <strong>"+ Add Domain"</strong> button</li>
          </ol>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Add New Domain</h2>
            <form onSubmit={handleAddDomain}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resend Domain ID (optional)
                </label>
                <input
                  type="text"
                  value={resendDomainId}
                  onChange={(e) => setResendDomainId(e.target.value)}
                  placeholder="Optional - if already verified in Resend"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {adding ? 'Adding...' : 'Add Domain'}
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

        {domains.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-500 mb-4">Add a domain to start receiving emails</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Domain
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {domains.map((domain) => (
              <div key={domain.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{domain.domain_name}</h3>
                    {domain.resend_domain_id && (
                      <p className="text-sm text-gray-500">ID: {domain.resend_domain_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      domain.status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : domain.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {domain.status}
                    </span>
                  </div>
                </div>

                {domain.verified_at && (
                  <p className="text-sm text-gray-600 mb-4">
                    Verified: {new Date(domain.verified_at).toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2">
                  {domain.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(domain.id, 'verified')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Mark as Verified
                    </button>
                  )}
                  {domain.status !== 'verified' && (
                    <button
                      onClick={() => handleUpdateStatus(domain.id, 'verified')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/mailboxes?domain_id=${domain.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Manage Mailboxes
                  </button>
                  <button
                    onClick={() => handleDeleteDomain(domain.id)}
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
