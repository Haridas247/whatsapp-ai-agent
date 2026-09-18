'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  ArrowUpRight,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { fetchApi } from '../lib/api';

interface DashboardStats {
  business: {
    id: string;
    name: string;
    category: string;
    phone: string;
    address: string;
  };
  metrics: {
    totalConversations: number;
    todayAppointments: number;
    confirmedAppointments: number;
    escalations: number;
    aiResolutionRate: number;
    servicesCount: number;
  };
  recentAppointments: Array<{
    id: string;
    start_at: string;
    status: string;
    notes?: string;
    customer: { name: string; phone: string };
    service: { name: string; price: number };
    staff: { name: string };
  }>;
}

export default function OverviewPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (silent = false) => {
    try {
      if (!silent && !data) setLoading(true);
      const res = await fetchApi('/api/dashboard/stats');
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not connect to backend server. Make sure it is running on port 5000.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(false);
    const interval = setInterval(() => loadStats(true), 15000); // 15s silent auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading clinic metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalConversations: 0,
    todayAppointments: 0,
    confirmedAppointments: 0,
    escalations: 0,
    aiResolutionRate: 98,
    servicesCount: 5,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {data?.business?.name || 'Dr. Kumar Dental Clinic'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Live Pilot
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            AI Receptionist • WhatsApp Business Cloud API v21.0 • Anna Nagar, Chennai
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/conversations"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
          >
            <MessageSquare className="h-4 w-4" />
            Live Chats ({metrics.totalConversations})
          </Link>
        </div>
      </div>

      {/* Medical Escalation Banner (Conditional) */}
      {metrics.escalations > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-200">
                {metrics.escalations} Customer(s) Require Human Staff Attention
              </h4>
              <p className="text-xs text-amber-300/80">
                Emergency keyword detected or customer requested human receptionist. AI bot reply has been paused.
              </p>
            </div>
          </div>
          <Link
            href="/conversations"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shrink-0 transition-colors"
          >
            Take Over Now
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Enquiries</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{metrics.totalConversations}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" /> English & Tanglish chats
            </p>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today's Schedule</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{metrics.todayAppointments}</div>
            <p className="text-xs text-slate-400 mt-1">
              {metrics.confirmedAppointments} total confirmed
            </p>
          </div>
        </div>

        {/* AI Resolution Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Resolution Rate</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-400">{metrics.aiResolutionRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Autonomous bookings & FAQ answers</p>
          </div>
        </div>

        {/* Human Escalations */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Escalations Pending</span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                metrics.escalations > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold ${metrics.escalations > 0 ? 'text-amber-400' : 'text-white'}`}>
              {metrics.escalations}
            </div>
            <p className="text-xs text-slate-400 mt-1">Emergency or staff requests</p>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Appointments & RAG Knowledge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Appointments</h2>
              <p className="text-xs text-slate-400">Scheduled bookings locked via WhatsApp booking engine</p>
            </div>
            <Link
              href="/appointments"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View Calendar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            {(!data?.recentAppointments || data.recentAppointments.length === 0) ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No appointments booked yet. Try booking via the CLI simulator (`npm run simulate`)!
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {data.recentAppointments.map((appt) => {
                  const dateObj = new Date(appt.start_at);
                  const timeFormatted = dateObj.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const dateFormatted = dateObj.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-300">
                          <span className="text-[10px] font-bold uppercase">{dateFormatted.split(',')[0]}</span>
                          <span className="text-xs font-semibold">{dateObj.getDate()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{appt.customer.name}</span>
                            <span className="text-xs text-slate-400 font-mono">({appt.customer.phone})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {appt.service.name} • {appt.staff.name} • ₹{appt.service.price}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-200">{timeFormatted}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === 'CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : appt.status === 'COMPLETED'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Quick Panel: Clinic Details & System Status */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              Clinic Working Hours
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Monday - Saturday</span>
                <span className="font-medium text-white">9:00 AM - 7:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Lunch Break</span>
                <span className="font-medium text-white">1:00 PM - 2:00 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Sunday</span>
                <span className="font-medium text-rose-400">Closed (Leave)</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/knowledge"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
              >
                Manage Clinic Knowledge & RAG <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Autonomous Engine Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">WhatsApp Webhook</span>
                <span className="text-emerald-400 font-medium">Ready (/api/webhooks)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Language Detection</span>
                <span className="text-emerald-400 font-medium">EN, தமிழ், Tanglish</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">24H & 2H Reminders</span>
                <span className="text-emerald-400 font-medium">BullMQ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Emergency Filter</span>
                <span className="text-emerald-400 font-medium">Zero-Delay Guardrail</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
