import type { ReactNode } from 'react';
import type { ItemState, ItemType, Member } from '@/types/pm';

export const TYPE_COLOR: Record<ItemType, string> = {
  Epic: '#ff7b00',
  Feature: '#773b93',
  Story: '#009ccc',
  Task: '#c9a800',
  Bug: '#cc293d',
};
const TYPE_LETTER: Record<ItemType, string> = { Epic: 'E', Feature: 'F', Story: 'S', Task: 'T', Bug: 'B' };

export const STATE_COLOR: Record<ItemState, string> = {
  New: '#b1b1b1',
  Active: '#007acc',
  Resolved: '#f2a30f',
  Closed: '#339933',
};

export const field =
  'rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-[#0078d4] focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20';
export const btnPrimary =
  'rounded bg-[#0078d4] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[#106ebe] disabled:opacity-50';
export const btnSecondary =
  'rounded border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50';

export function TypeIcon({ type, size = 18 }: { type: ItemType; size?: number }) {
  return (
    <span
      title={type}
      className="inline-flex shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white"
      style={{ background: TYPE_COLOR[type], width: size, height: size }}
    >
      {TYPE_LETTER[type]}
    </span>
  );
}

export function StateBadge({ state }: { state: ItemState }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATE_COLOR[state] }} />
      {state}
    </span>
  );
}

const PRIORITY_LABEL = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' } as const;
const PRIORITY_COLOR = { 1: 'text-red-700 bg-red-50', 2: 'text-orange-700 bg-orange-50', 3: 'text-blue-700 bg-blue-50', 4: 'text-slate-600 bg-slate-100' } as const;
export function PriorityBadge({ priority }: { priority: 1 | 2 | 3 | 4 }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLOR[priority]}`}>{PRIORITY_LABEL[priority]}</span>;
}
export const priorityLabel = PRIORITY_LABEL;

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ member, size = 24 }: { member?: Member | null; size?: number }) {
  if (!member)
    return (
      <span
        title="Unassigned"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-500"
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  return (
    <span
      title={member.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
      style={{ background: member.color, width: size, height: size }}
    >
      {initials(member.name)}
    </span>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12" onMouseDown={onClose}>
      <div
        className={`w-full rounded-md bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-md'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-xl leading-none text-slate-500 hover:text-slate-900" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && <h3 className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800">{title}</h3>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function fmtDate(s: string): string {
  if (!s) return '—';
  return new Date(s + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
