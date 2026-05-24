import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../utils/errors';
import { getRoleLandingPath } from '../utils/routing';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(from ?? getRoleLandingPath(user.role), { replace: true });
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
        <p className="mt-2 text-sm text-red-100">City emergency response platform</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
        >
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          {(location.state as { message?: string } | null)?.message && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {(location.state as { message: string }).message}
            </p>
          )}
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-red-600 py-2.5 font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-slate-600">
            No account?{' '}
            <Link to="/register" className="font-medium text-red-700 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
