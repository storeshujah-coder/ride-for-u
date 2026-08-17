import { useStore } from '@/store/StoreContext';
import { Card } from '@/components/ui';
import { Activity } from 'lucide-react';
import type { ActivityLog } from '@/types';

interface ActivityHistoryProps {
  entity: string;
  entityId?: string;
  logs?: ActivityLog[];
}

export function ActivityHistory({ entity, entityId, logs }: ActivityHistoryProps) {
  const { activity } = useStore();
  const filtered = logs || activity.filter((a) => a.entity === entity && (!entityId || a.entityId === entityId));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Activity History</h3>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No activity recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 20).map((log) => (
            <div key={log.id} className="flex gap-3 text-sm">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5" />
                <div className="w-px flex-1 bg-slate-200" />
              </div>
              <div className="pb-1">
                <p className="text-slate-700">{log.action}</p>
                <p className="text-xs text-slate-400 mt-0.5">{log.date} — {log.time} • by {log.actor}</p>
                {log.oldValue && log.newValue && (
                  <div className="mt-1 text-xs text-slate-500">
                    <span className="text-red-500">Old: {log.oldValue}</span>
                    {' → '}
                    <span className="text-emerald-600">New: {log.newValue}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
