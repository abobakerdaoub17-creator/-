import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type BtnSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<BtnVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  secondary: 'bg-white text-secondary-700 ring-1 ring-secondary-200 hover:bg-secondary-50 shadow-sm',
  ghost: 'text-secondary-600 hover:bg-secondary-100',
  danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-sm',
  success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 shadow-sm',
};

const sizes: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2',
};

export function Button({ variant = 'primary', size = 'md', icon, fullWidth, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-secondary-700 mb-1.5">{label}</span>}
      <input
        className={`w-full rounded-xl border-0 bg-secondary-50 px-3.5 py-2.5 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none ${error ? 'ring-error-300 focus:ring-error-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-error-600">{error}</span>}
    </label>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-secondary-700 mb-1.5">{label}</span>}
      <select
        className={`w-full rounded-xl border-0 bg-secondary-50 px-3.5 py-2.5 text-secondary-900 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center text-secondary-400 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-secondary-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-secondary-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
