import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { EMERGENCY_TYPE_OPTIONS } from '../config/emergencyTypes';
import { emergencyService } from '../services/emergencyService';
import { getApiErrorMessage } from '../utils/errors';

export function ReportEmergencyPage() {
  const navigate = useNavigate();
  const [emergencyTypeId, setEmergencyTypeId] = useState(EMERGENCY_TYPE_OPTIONS[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!emergencyTypeId) {
      setError('Emergency type IDs are not configured in environment variables.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await emergencyService.create({ emergencyTypeId, description, address });
      navigate(`/emergencies/${data.id}`);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Report emergency">
      <form onSubmit={(event) => void handleSubmit(event)} className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900">Report an emergency</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block space-y-1 text-sm">
          <span>Type</span>
          <select
            value={emergencyTypeId}
            onChange={(e) => setEmergencyTypeId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {EMERGENCY_TYPE_OPTIONS.map((option) => (
              <option key={option.name} value={option.id} disabled={!option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Description</span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Address</span>
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit report'}
        </button>
      </form>
    </AppLayout>
  );
}
