'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';

interface MailboxUser {
  id: string;
  user_id: string;
  role: string;
  can_send: boolean;
  can_read: boolean;
  created_at: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function MailboxUsersPage() {
  const params = useParams();
  const mailboxId = params?.id as string;
  const [mailbox, setMailbox] = useState<any>(null);
  const [users, setUsers] = useState<MailboxUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [canSend, setCanSend] = useState(true);
  const [canRead, setCanRead] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const fetchMailbox = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const response = await fetch(`/api/mailboxes/${mailboxId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setMailbox(data.mailbox);
    }
  };

  const fetchUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(`/api/mailboxes/${mailboxId}/users`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setUsers(data.users);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMailbox();
    fetchUsers();
  }, [mailboxId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mailboxes/${mailboxId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_email: newUserEmail,
          can_send: canSend,
          can_read: canRead,
          role: 'member',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ User added successfully!');
        setNewUserEmail('');
        setCanSend(true);
        setCanRead(true);
        fetchUsers();
      } else {
        setMessage(`❌ ${data.error || 'Failed to add user'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mailboxes/${mailboxId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setMessage('✅ User removed successfully!');
        fetchUsers();
      } else {
        const data = await response.json();
        setMessage(`❌ ${data.error || 'Failed to remove user'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTogglePermission = async (userId: string, field: 'can_send' | 'can_read', currentValue: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mailboxes/${mailboxId}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          [field]: !currentValue,
        }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(`Failed to update permission: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBack = () => {
    router.push('/mailboxes');
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Mailbox Access</h1>
              {mailbox && (
                <p className="text-sm text-gray-600">{mailbox.email_address}</p>
              )}
            </div>
          </div>
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

        {/* Add User Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add User to Mailbox</h2>
          <form onSubmit={handleAddUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  User must already be registered in ZeRelay
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={canRead}
                      onChange={(e) => setCanRead(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Can Read</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={canSend}
                      onChange={(e) => setCanSend(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Can Send</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={addingUser}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {addingUser ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">
              Users with Access ({users.length})
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No users have been granted access to this mailbox yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Can Read
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Can Send
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Added On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((mailboxUser) => (
                    <tr key={mailboxUser.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {mailboxUser.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          mailboxUser.user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {mailboxUser.user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePermission(mailboxUser.user_id, 'can_read', mailboxUser.can_read)}
                          className={`px-3 py-1 text-xs rounded ${
                            mailboxUser.can_read
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {mailboxUser.can_read ? '✓ Yes' : '✗ No'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePermission(mailboxUser.user_id, 'can_send', mailboxUser.can_send)}
                          className={`px-3 py-1 text-xs rounded ${
                            mailboxUser.can_send
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {mailboxUser.can_send ? '✓ Yes' : '✗ No'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(mailboxUser.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveUser(mailboxUser.user_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">How Mailbox Access Works</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• <strong>Admin users</strong> can see all mailboxes and all emails</li>
            <li>• <strong>Mailbox owner</strong> (creator) has full access to their mailboxes</li>
            <li>• <strong>Added users</strong> can only see emails from mailboxes they're granted access to</li>
            <li>• <strong>Can Read</strong>: User can view emails in this mailbox</li>
            <li>• <strong>Can Send</strong>: User can send emails from this mailbox address</li>
            <li>• Users must be registered in ZeRelay before you can add them</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
