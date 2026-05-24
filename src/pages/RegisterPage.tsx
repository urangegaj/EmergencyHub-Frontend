import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { DEFAULT_CITY_ID } from '../config/emergencyTypes';
import { getApiErrorMessage } from '../utils/errors';
import type { Department } from '../types';

type RegisterMode = 'Citizen' | 'Responder';

export function RegisterPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<RegisterMode>('Citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Fire');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!DEFAULT_CITY_ID) {
      setError('VITE_DEFAULT_CITY_ID is not configured.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authService.register({
        email,
        password,
        role: mode,
        firstName,
        lastName,
        cityId: DEFAULT_CITY_ID,
        phone: phone || undefined,
        department: mode === 'Responder' ? department : undefined,
      });
      navigate('/login', { state: { message: 'Registration successful. Please sign in.' } });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-100 via-red-50 to-slate-100">
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 py-6 text-center text-white shadow">
        <div className="mx-auto flex max-w-md items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-red-700">
            EH
          </span>
          <span className="text-xl font-semibold">EmergencyHub</span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-slate-900">Register</h1>
        <div className="flex gap-2">
          {(['Citizen', 'Responder'] as RegisterMode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                mode === value ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-300'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block space-y-1 text-sm">
          <span>First name</span>
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Last name</span>
          <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Phone (optional)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        {mode === 'Responder' && (
          <label className="block space-y-1 text-sm">
            <span>Department</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="Fire">Fire</option>
              <option value="Police">Police</option>
              <option value="Medical">Medical</option>
            </select>
          </label>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-red-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}
