import type { Department } from '../types';

interface AssignEmergencyModalProps {
  emergencyLabel: string;
  selectedDepartments: Department[];
  onToggleDepartment: (dept: Department, checked: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
  assigning: boolean;
}

const DEPARTMENTS: Department[] = ['Fire', 'Police', 'Medical'];

export function AssignEmergencyModal({
  emergencyLabel,
  selectedDepartments,
  onToggleDepartment,
  onConfirm,
  onClose,
  assigning,
}: AssignEmergencyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Assign departments</h3>
        <p className="mt-1 text-sm text-slate-600">{emergencyLabel}</p>
        <div className="mt-4 space-y-2">
          {DEPARTMENTS.map((dept) => (
            <label key={dept} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedDepartments.includes(dept)}
                onChange={(e) => onToggleDepartment(dept, e.target.checked)}
              />
              {dept}
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={assigning || selectedDepartments.length === 0}
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {assigning ? 'Assigning...' : 'Confirm assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
