import React, { useState, useEffect } from 'react';
import { api, type User } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const list = await api.getUsers();
      setUsers(list);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setShowAddForm(false);
      setEditingUserId(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.createUser({
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        role,
        password,
        pin: pin.trim() || undefined,
      });

      setSuccessMsg(`User "${username}" created successfully!`);
      setUsername('');
      setDisplayName('');
      setPassword('');
      setPin('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user.');
    }
  };

  const handleUpdateUser = async (id: string) => {
    setErrorMsg(null);
    try {
      await api.updateUser(id, {
        displayName: displayName.trim(),
        role,
        password: password.trim() || undefined,
        pin: pin.trim() || undefined,
      });

      setSuccessMsg('User updated successfully!');
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
      try {
        await api.deleteUser(id);
        fetchUsers();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Cashier & Staff Accounts</h3>
              <p className="text-xs text-slate-400">Manage cashier till accounts and manager login PINs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add User Button & Form */}
          {!showAddForm && !editingUserId ? (
            <div className="flex justify-between items-center pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Staff ({users.length})
              </span>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setUsername('');
                  setDisplayName('');
                  setPassword('');
                  setPin('');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Cashier / User
              </button>
            </div>
          ) : showAddForm ? (
            /* Create Form */
            <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">New Staff Member</h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username (login id)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. maria"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Maria Gonzalez"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">4-Digit PIN (Fast Login)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 5678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="cashier">Cashier (POS Register &amp; Stock Lookups)</option>
                    <option value="admin">Manager / Admin (Full Access to Financials &amp; Settings)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          ) : null}

          {/* Users List Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Quick PIN</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Loading staff accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No staff accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isCurrent = u.id === currentUser?.id;
                    const isEditing = editingUserId === u.id;

                  if (isEditing) {
                    return (
                      <tr key={u.id} className="bg-emerald-50/30">
                        <td className="py-3 px-4" colSpan={4}>
                          <div className="space-y-3">
                            <p className="font-bold text-slate-800">Edit User: {u.username}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] text-slate-600 mb-1">Display Name</label>
                                <input
                                  type="text"
                                  value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-600 mb-1">New PIN (Optional)</label>
                                <input
                                  type="text"
                                  value={pin}
                                  onChange={(e) => setPin(e.target.value)}
                                  placeholder="Leave blank to keep current"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[11px] text-slate-600 mb-1">New Password (Optional)</label>
                                <input
                                  type="password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Leave blank to keep current"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateUser(u.id)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {u.displayName} {isCurrent && <span className="text-[10px] text-emerald-600 font-normal">(You)</span>}
                            </p>
                            <p className="font-mono text-slate-400 text-[11px]">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {u.pin ? <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">{u.pin}</span> : '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setDisplayName(u.displayName);
                              setRole(u.role);
                              setPassword('');
                              setPin(u.pin || '');
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.displayName)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
