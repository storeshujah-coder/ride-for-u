import { useStore } from '@/store/StoreContext';
import { Card } from '@/components/ui';
import { Activity, ArrowRight } from 'lucide-react';
import type { ActivityLog } from '@/types';

interface ActivityHistoryProps {
  entity: string;
  entityId?: string;
  logs?: ActivityLog[];
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  full_name: 'Full Name',
  father_name: 'Father Name',
  cnic: 'CNIC',
  phone: 'Phone',
  address: 'Address',
  joining_date: 'Joining Date',
  status: 'Status',
  notes: 'Notes',
  vehicle_number: 'Vehicle Number',
  assigned_vehicle_id: 'Assigned Vehicle',
  driving_license: 'Driving License',
  model: 'Model',
  type: 'Vehicle Type',
  capacity: 'Capacity',
  owner_type: 'Owner Type',
  owner_id: 'Owner',
  rate_type: 'Rate Type',
  fixed_rate: 'Fixed Rate',
  amount: 'Amount',
  monthly_salary: 'Monthly Salary',
  paid_amount: 'Paid Amount',
  salary_date: 'Salary Date',
  remarks: 'Remarks',
  payment_method: 'Payment Method',
  category_id: 'Category',
  record_date: 'Record Date',
  entry_type: 'Entry Type',
  details: 'Details',
};

const IGNORED_KEYS = new Set([
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'user_id',
  'profile_id',
  'monthly_record_id',
  'daily_record_id',
]);

interface FieldDiff {
  label: string;
  oldVal: string;
  newVal: string;
}

function parseChanges(oldValue?: string, newValue?: string): FieldDiff[] {
  if (!oldValue || !newValue) return [];

  // Check if oldValue is JSON
  if (oldValue.trim().startsWith('{')) {
    try {
      const oldObj = JSON.parse(oldValue);
      const newObj = JSON.parse(newValue);

      if (typeof oldObj === 'object' && oldObj !== null && typeof newObj === 'object' && newObj !== null) {
        const diffs: FieldDiff[] = [];
        const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

        for (const k of allKeys) {
          if (IGNORED_KEYS.has(k)) continue;

          const vOld = oldObj[k];
          const vNew = newObj[k];

          // Check if values differ
          if (vOld !== vNew && String(vOld ?? '') !== String(vNew ?? '')) {
            const label = FIELD_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            diffs.push({
              label,
              oldVal: vOld !== null && vOld !== undefined && vOld !== '' ? String(vOld) : '—',
              newVal: vNew !== null && vNew !== undefined && vNew !== '' ? String(vNew) : '—',
            });
          }
        }
        return diffs;
      }
    } catch {
      // If parsing fails, fall through
    }
  }

  // If simple string diff (e.g. "Rs. 5,000" → "Rs. 6,000")
  return [
    {
      label: '',
      oldVal: oldValue,
      newVal: newValue,
    },
  ];
}

export function ActivityHistory({ entity, entityId, logs }: ActivityHistoryProps) {
  const { activity } = useStore();
  const filtered = logs || activity.filter((a) => a.entity === entity && (!entityId || a.entityId === entityId));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-700">Activity History</h3>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No activity recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {filtered.slice(0, 25).map((log) => {
            const diffs = parseChanges(log.oldValue, log.newValue);

            return (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1 ring-4 ring-sky-50" />
                  <div className="w-px flex-1 bg-slate-200 mt-1" />
                </div>

                <div className="flex-1 pb-3">
                  <p className="font-medium text-slate-800 leading-snug">{log.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {log.date} — {log.time} • by <span className="font-medium text-slate-600">{log.actor}</span>
                  </p>

                  {/* Clean, readable field changes */}
                  {diffs.length > 0 && (
                    <div className="mt-2 space-y-1.5 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                      {diffs.map((d, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-1.5 text-xs">
                          {d.label && (
                            <span className="font-semibold text-slate-600 min-w-[70px]">
                              {d.label}:
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100/80 line-through">
                            {d.oldVal}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100/80 font-medium">
                            {d.newVal}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
