'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardOverview } from '@/types';

export function ProductivityChart({ data }: { data: DashboardOverview['productivity'] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
    Tarefas: d.created,
  }));

  return (
    <div className="h-72 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight">Produtividade da semana</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tarefas criadas nos últimos 7 dias
        </p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="brand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="rgba(148,163,184,0.6)" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="rgba(148,163,184,0.6)" />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: 'rgba(148,163,184,0.2)',
              fontSize: 12,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              color: '#fff',
            }}
          />
          <Area
            type="monotone"
            dataKey="Tarefas"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#brand)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
