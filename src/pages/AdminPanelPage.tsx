import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../components/AppLayout';
import { adminService } from '../services/adminService';
import { getApiErrorMessage } from '../utils/errors';
import type { AdminUser, Department, Role } from '../types';

export function AdminPanelPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (roleFilter) params.role = roleFilter;
      if (departmentFilter) params.department = departmentFilter;
      const { data } = await adminService.listUsers(params);
      setUsers(data.users);
      setTotalCount(data.totalCount);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, departmentFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await adminService.deleteUser(userId);
      await loadUsers();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  return (
    <AppLayout title="Admin panel">
      <div className="space-y-6">
        <CreateUserForm onCreated={loadUsers} />

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="">All roles</option>
              <option value="Citizen">Citizen</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Responder">Responder</option>
              <option value="Admin">Admin</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="">All departments</option>
              <option value="Fire">Fire</option>
              <option value="Police">Police</option>
              <option value="Medical">Medical</option>
            </select>
          </div>

          {error && <p className="mb-3 text-red-600">{error}</p>}
          {loading && <p className="text-slate-600">Loading users...</p>}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      {user.firstName} {user.lastName}
                      {!user.isActive && (
                        <span className="ml-2 text-xs text-red-600">(inactive)</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4">{user.role}</td>
                    <td className="py-2 pr-4">{user.department ?? '—'}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="text-red-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoleUser(user)}
                          className="text-red-700 hover:underline"
                        >
                          Role
                        </button>
                        {user.isActive && (
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(user.userId)}
                            className="text-red-700 hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={loadUsers} />
      )}
      {roleUser && (
        <AssignRoleModal user={roleUser} onClose={() => setRoleUser(null)} onSaved={loadUsers} />
      )}
    </AppLayout>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Citizen');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Fire');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await adminService.createUser({
        email,
        password,
        role,
        firstName,
        lastName,
        phone: phone || undefined,
        department: role === 'Responder' ? department : undefined,
      });
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      await onCreated();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Create user</h2>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <input required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="Citizen">Citizen</option>
          <option value="Dispatcher">Dispatcher</option>
          <option value="Responder">Responder</option>
          <option value="Admin">Admin</option>
        </select>
        {role === 'Responder' && (
          <select value={department} onChange={(e) => setDepartment(e.target.value as Department)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="Fire">Fire</option>
            <option value="Police">Police</option>
            <option value="Medical">Medical</option>
          </select>
        )}
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm text-white">
        Create user
      </button>
    </form>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [department, setDepartment] = useState<Department>((user.department as Department) ?? 'Fire');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await adminService.updateUser(user.userId, {
        firstName,
        lastName,
        phone: phone || undefined,
        department: user.role === 'Responder' ? department : undefined,
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <Modal title="Edit user" onClose={onClose}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        {user.role === 'Responder' && (
          <select value={department} onChange={(e) => setDepartment(e.target.value as Department)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="Fire">Fire</option>
            <option value="Police">Police</option>
            <option value="Medical">Medical</option>
          </select>
        )}
        <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm text-white">
          Save
        </button>
      </form>
    </Modal>
  );
}

function AssignRoleModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [role, setRole] = useState(user.role as Role);
  const [department, setDepartment] = useState<Department>((user.department as Department) ?? 'Fire');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await adminService.assignRole(
        user.userId,
        role,
        role === 'Responder' ? department : undefined,
      );
      await onSaved();
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <Modal title="Change role" onClose={onClose}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="Citizen">Citizen</option>
          <option value="Dispatcher">Dispatcher</option>
          <option value="Responder">Responder</option>
          <option value="Admin">Admin</option>
        </select>
        {role === 'Responder' && (
          <select value={department} onChange={(e) => setDepartment(e.target.value as Department)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="Fire">Fire</option>
            <option value="Police">Police</option>
            <option value="Medical">Medical</option>
          </select>
        )}
        <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm text-white">
          Update role
        </button>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-500">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
