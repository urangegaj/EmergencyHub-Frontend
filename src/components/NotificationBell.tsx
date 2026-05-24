import { useNotifications } from '../contexts/NotificationContext';

export function NotificationBell() {
  const { enabled, unreadCount, notifications, markRead } = useNotifications();

  if (!enabled) {
    return (
      <span
        className="rounded-md border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-400"
        title="Notifications will be available when backend routes are ready"
      >
        🔔 Soon
      </span>
    );
  }

  return (
    <details className="relative">
      <summary className="relative cursor-pointer list-none rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
        {notifications.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-500">No notifications yet.</p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void markRead(n.id)}
                  className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 ${
                    n.read ? 'text-slate-500' : 'font-medium text-slate-900'
                  }`}
                >
                  {n.message}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
