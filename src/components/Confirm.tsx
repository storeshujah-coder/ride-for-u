import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
}

const ConfirmContext = createContext<{
  confirm: (opts: { title: string; message: string; onConfirm: () => void }) => void;
} | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({ open: false, title: '', message: '' });

  const confirm = useCallback((opts: { title: string; message: string; onConfirm: () => void }) => {
    setState({ open: true, ...opts });
  }, []);

  const close = () => setState((prev) => ({ ...prev, open: false }));

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">{state.title}</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">{state.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={close}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { state.onConfirm?.(); close(); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}
