import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ChevronDown, Check, Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, onBack, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition flex-shrink-0 cursor-pointer"
            title="Go Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : backTo ? (
          <Link
            to={backTo}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition flex-shrink-0"
            title="Go Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : null}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({ children, variant = 'primary', size = 'md', type = 'button', onClick, disabled, className = '' }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function Input({ label, type = 'text', value, onChange, placeholder, required, error }: InputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
          : 'border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface TextareaProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

export function Textarea({ label, value, onChange, placeholder, rows = 3 }: TextareaProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
      />
    </div>
  );
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export function Select({ label, value, onChange, options, placeholder, required }: SelectProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  phone?: string;
  cnic?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  addLink?: string;
  addLabel?: string;
  emptyText?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  required = false,
  error,
  disabled = false,
  addLink,
  addLabel,
  emptyText = 'No options found',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Sort and prioritize matching results so searched items appear at the very TOP
  const sortedAndFilteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;

    return [...options]
      .map((opt) => {
        const l = opt.label.toLowerCase();
        const sub = (opt.subLabel || '').toLowerCase();
        const phone = (opt.phone || '').replace(/\D/g, '');
        const cnic = (opt.cnic || '').replace(/\D/g, '');
        const cleanQ = q.replace(/\D/g, '');

        let score = 0;
        if (l === q) score = 100;
        else if (l.startsWith(q)) score = 80;
        else if (l.split(/\s+/).some((w) => w.startsWith(q))) score = 60;
        else if (l.includes(q)) score = 40;
        else if (sub.includes(q)) score = 30;
        else if (cleanQ && (phone.includes(cleanQ) || cnic.includes(cleanQ))) score = 20;
        else if (opt.badge && opt.badge.toLowerCase().includes(q)) score = 10;

        return { opt, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.opt);
  }, [options, search]);

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg border bg-white text-sm outline-none transition flex items-center justify-between gap-2 cursor-pointer ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : isOpen
                ? 'border-sky-500 ring-1 ring-sky-500'
                : 'border-slate-200 hover:border-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
          >
            <span className={selectedOption ? 'text-slate-800 font-medium truncate' : 'text-slate-400 truncate'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400">
              {value && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                  className="p-0.5 rounded hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-600' : ''}`} />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
              {/* Search Header */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-800 placeholder-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsOpen(false);
                      } else if (e.key === 'Enter' && sortedAndFilteredOptions.length > 0) {
                        e.preventDefault();
                        onChange(sortedAndFilteredOptions[0].value);
                        setIsOpen(false);
                      }
                    }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {search.trim() && (
                  <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-slate-500 font-medium">
                    <span className="text-sky-700 font-semibold">
                      ⚡ Showing search matches at the top ({sortedAndFilteredOptions.length})
                    </span>
                    <span className="text-slate-400">Press Enter for 1st</span>
                  </div>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {sortedAndFilteredOptions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    <p>{emptyText}</p>
                    {addLink && (
                      <Link
                        to={addLink}
                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium mt-2 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> {addLabel || 'Add New'}
                      </Link>
                    )}
                  </div>
                ) : (
                  sortedAndFilteredOptions.map((opt, index) => {
                    const isSelected = opt.value === value;
                    const isTopMatch = Boolean(search.trim() && index === 0);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-sm transition flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 text-sky-900 font-semibold'
                            : isTopMatch
                            ? 'bg-amber-50/80 hover:bg-amber-100/80 text-slate-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{opt.label}</span>
                            {isTopMatch && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded">
                                Top Match
                              </span>
                            )}
                            {opt.badge && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {(opt.subLabel || opt.phone || opt.cnic) && (
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                              {opt.subLabel && <span>{opt.subLabel}</span>}
                              {opt.phone && <span>📞 {opt.phone}</span>}
                              {opt.cnic && <span>🆔 {opt.cnic}</span>}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {addLink && (
          <Link to={addLink} title={addLabel || 'Add New'}>
            <Button type="button" variant="secondary" size="md">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface BadgeProps {
  status: string;
}

export function StatusBadge({ status }: BadgeProps) {
  const colors: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.Active}`}>
      {status}
    </span>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-slate-300 mb-3">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {message && <p className="text-sm text-slate-400 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function parseRouteLocation(location: string): { start: string; end: string } {
  if (!location) return { start: '', end: '' };
  if (location.includes('→')) {
    const parts = location.split('→');
    return { start: parts[0]?.trim() || '', end: parts.slice(1).join('→').trim() || '' };
  }
  if (location.includes('->')) {
    const parts = location.split('->');
    return { start: parts[0]?.trim() || '', end: parts.slice(1).join('->').trim() || '' };
  }
  return { start: location, end: '' };
}

export function formatRouteLocation(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (s && e) return `${s} → ${e}`;
  if (s) return s;
  if (e) return `→ ${e}`;
  return '';
}

interface RouteLocationInputProps {
  location: string;
  onChange: (newLocation: string) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  startId?: string;
  endId?: string;
  onStartKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onEndKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function RouteLocationInput({
  location,
  onChange,
  startPlaceholder = 'Start Location (e.g. Factory)',
  endPlaceholder = 'Destination (e.g. DHA)',
  className = '',
  size = 'sm',
  startId,
  endId,
  onStartKeyDown,
  onEndKeyDown,
}: RouteLocationInputProps) {
  const { start, end } = useMemo(() => parseRouteLocation(location), [location]);

  const handleStartChange = (val: string) => {
    onChange(formatRouteLocation(val, end));
  };

  const handleEndChange = (val: string) => {
    onChange(formatRouteLocation(start, val));
  };

  const padY = size === 'sm' ? 'py-1.5' : 'py-2';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`flex items-center bg-white border border-slate-200 rounded-md overflow-hidden focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition shadow-sm ${className}`}
    >
      <input
        id={startId}
        type="text"
        value={start}
        onChange={(e) => handleStartChange(e.target.value)}
        onKeyDown={onStartKeyDown}
        placeholder={startPlaceholder}
        className={`flex-1 min-w-[75px] px-2.5 ${padY} ${textClass} text-slate-800 placeholder-slate-300 outline-none bg-transparent`}
        title="Start Location (شروع کی جگہ)"
      />
      <div className="px-2 py-1 bg-sky-50/90 text-sky-600 font-bold text-xs flex items-center justify-center select-none border-x border-slate-100 shrink-0">
        <span>→</span>
      </div>
      <input
        id={endId}
        type="text"
        value={end}
        onChange={(e) => handleEndChange(e.target.value)}
        onKeyDown={onEndKeyDown}
        placeholder={endPlaceholder}
        className={`flex-1 min-w-[75px] px-2.5 ${padY} ${textClass} text-slate-800 placeholder-slate-300 outline-none bg-transparent`}
        title="End Location (پہنچنے کی جگہ)"
      />
    </div>
  );
}
