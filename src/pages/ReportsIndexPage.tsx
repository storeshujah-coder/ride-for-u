import { Link } from 'react-router-dom';
import { Car, User, Users, Wallet } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui';

export function ReportsIndexPage() {
  const reports = [
    { to: '/reports/vehicle', title: 'Vehicle Report', desc: 'Duty, expenses, commission and final amount for a single vehicle', icon: Car, color: 'sky' },
    { to: '/reports/driver', title: 'Driver Report', desc: 'Driver information, salary records and driver expenses', icon: User, color: 'emerald' },
    { to: '/reports/subcontractor', title: 'Subcontractor Report', desc: 'All vehicles, duty, expenses and commission for a subcontractor', icon: Users, color: 'violet' },
    { to: '/reports/business-expenses', title: 'Business Expense Report', desc: 'All business expenses by category (Vehicle, Driver, Office, etc.)', icon: Wallet, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and print reports" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.to} to={r.to}>
              <Card className="p-5 hover:border-sky-300 hover:shadow-md transition cursor-pointer h-full">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[r.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">{r.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
