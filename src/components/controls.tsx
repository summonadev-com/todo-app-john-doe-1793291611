import { Children, createContext, isValidElement, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

/* ---------- Floating popover anchored to an element ---------- */

function Floating({
  anchorRef,
  onClose,
  children,
  matchWidth,
  maxHeight = 280,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  matchWidth?: boolean;
  maxHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  useLayoutEffect(() => {
    const a = anchorRef.current;
    const m = ref.current;
    if (!a || !m) return;
    const r = a.getBoundingClientRect();
    const h = Math.min(m.scrollHeight, maxHeight);
    const below = window.innerHeight - r.bottom;
    const top = below < h + 12 && r.top > below ? Math.max(8, r.top - h - 4) : r.bottom + 4;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - m.offsetWidth - 8));
    setPos({ top, left, minWidth: matchWidth ? r.width : 0 });
  }, [anchorRef, matchWidth, maxHeight]);

  useEffect(() => {
    function down(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    }
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    function scroll(e: Event) {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key, true);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[80] overflow-auto rounded-md border border-slate-200 bg-white shadow-xl"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, minWidth: pos?.minWidth, maxHeight, visibility: pos ? 'visible' : 'hidden' }}
    >
      {children}
    </div>,
    document.body,
  );
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Select (drop-in replacement for <select> with <option> children) ---------- */

interface OptProps {
  value?: string | number;
  children?: ReactNode;
}
function textOf(node: ReactNode): string {
  return Children.toArray(node).join('');
}

export function Select({
  value,
  defaultValue,
  onChange,
  className = '',
  children,
  disabled,
  title,
}: {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  const [inner, setInner] = useState<string>(String(defaultValue ?? ''));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const options = Children.toArray(children)
    .filter((c): c is ReactElement<OptProps> => isValidElement(c))
    .map((c) => ({ value: String(c.props.value ?? textOf(c.props.children)), label: textOf(c.props.children) }));

  const current = value !== undefined ? String(value) : inner;
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === current));
  const shown = options[selectedIdx];

  function pick(i: number) {
    const o = options[i];
    if (!o) return;
    if (value === undefined) setInner(o.value);
    onChange?.({ target: { value: o.value } });
    setOpen(false);
    btn.current?.focus();
  }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setActive(selectedIdx);
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(active);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setActive(selectedIdx);
          setOpen((o) => !o);
        }}
        onKeyDown={onKey}
        className={`inline-flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
      >
        <span className="truncate">{shown?.label ?? ''}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <Floating anchorRef={btn} onClose={close} matchWidth>
          <ul role="listbox" className="py-1">
            {options.map((o, i) => (
              <li
                key={o.value + i}
                role="option"
                aria-selected={i === selectedIdx}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-sm ${
                  i === active ? 'bg-blue-50 text-slate-900' : 'text-slate-700'
                } ${i === selectedIdx ? 'font-semibold text-[#0078d4]' : ''}`}
              >
                {o.label}
                {i === selectedIdx && (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M2 6.5l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </Floating>
      )}
    </>
  );
}

/* ---------- Checkbox ---------- */

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label ?? 'Select'}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4]/40 ${
        checked ? 'border-[#0078d4] bg-[#0078d4]' : 'border-slate-400 bg-white hover:border-[#0078d4]'
      }`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
          <path d="M2 6.5l3 3 5-6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

/* ---------- Date picker ---------- */

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function ymd(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function DateField({
  value,
  onChange,
  className = '',
  placeholder = 'Select date',
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const base = value ? new Date(value + 'T00:00') : new Date();
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const close = useCallback(() => setOpen(false), []);
  const now = new Date();
  const today = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  const first = new Date(view.y, view.m, 1);
  const cells: { date: string; day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(view.y, view.m, 1 - first.getDay() + i);
    cells.push({ date: ymd(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: d.getMonth() === view.m });
  }
  function shift(n: number) {
    const d = new Date(view.y, view.m + n, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }
  const label = value ? new Date(value + 'T00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={() => {
          const b = value ? new Date(value + 'T00:00') : new Date();
          setView({ y: b.getFullYear(), m: b.getMonth() });
          setOpen((o) => !o);
        }}
        className={`inline-flex items-center justify-between gap-2 text-left ${className}`}
      >
        <span className={`truncate ${label ? '' : 'text-slate-400'}`}>{label || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0 text-slate-500" aria-hidden>
          <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <Floating anchorRef={btn} onClose={close} maxHeight={360}>
          <div className="w-64 p-3">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => shift(-1)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100" aria-label="Previous month">
                ‹
              </button>
              <span className="text-sm font-semibold">{new Date(view.y, view.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              <button type="button" onClick={() => shift(1)} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100" aria-label="Next month">
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
              {DOW.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((c) => (
                <button
                  key={c.date}
                  type="button"
                  onClick={() => {
                    onChange(c.date);
                    setOpen(false);
                  }}
                  className={`h-8 rounded text-sm ${
                    c.date === value
                      ? 'bg-[#0078d4] font-semibold text-white'
                      : c.date === today
                        ? 'font-semibold text-[#0078d4] ring-1 ring-[#0078d4] hover:bg-blue-50'
                        : c.inMonth
                          ? 'text-slate-800 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {c.day}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm">
              <button
                type="button"
                className="text-[#0078d4] hover:underline"
                onClick={() => {
                  onChange(today);
                  setOpen(false);
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="text-slate-500 hover:underline"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </Floating>
      )}
    </>
  );
}

/* ---------- Confirm dialog ---------- */

interface ConfirmOpts {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}
type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn>(() => Promise.resolve(false));
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmCtx);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback<ConfirmFn>((opts) => new Promise<boolean>((resolve) => setReq({ ...opts, resolve })), []);

  function answer(v: boolean) {
    req?.resolve(v);
    setReq(null);
  }
  useEffect(() => {
    if (!req) return;
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        req?.resolve(false);
        setReq(null);
      }
    }
    document.addEventListener('keydown', key, true);
    return () => document.removeEventListener('keydown', key, true);
  }, [req]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {req && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onMouseDown={() => answer(false)}>
          <div role="alertdialog" className="w-full max-w-sm rounded-md bg-white p-5 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                  req.danger === false ? 'bg-blue-100 text-[#0078d4]' : 'bg-red-100 text-red-600'
                }`}
              >
                !
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{req.title ?? 'Are you sure?'}</h2>
                <p className="mt-1 text-sm text-slate-600">{req.message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => answer(false)}
                className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                autoFocus
                onClick={() => answer(true)}
                className={`rounded px-3.5 py-1.5 text-sm font-medium text-white ${
                  req.danger === false ? 'bg-[#0078d4] hover:bg-[#106ebe]' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {req.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
