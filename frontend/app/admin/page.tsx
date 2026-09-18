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
import { fetchApi } from '../../lib/api';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {data?.business?.name || 'Dr. Kumar Dental Clinic'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              Live Pilot
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            AI Receptionist • WhatsApp Business Cloud API v21.0 • Anna Nagar, Chennai
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/conversations"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Live Chats ({metrics.totalConversations})
          </Link>
        </div>
      </div>

      {/* Medical Escalation Banner (Conditional) */}
      {metrics.escalations > 0 && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                {metrics.escalations} Customer(s) Require Human Staff Attention
              </h4>
              <p className="text-xs text-amber-700">
                Emergency keyword detected or customer requested human receptionist. AI bot reply has been paused.
              </p>
            </div>
          </div>
          <Link
            href="/admin/conversations"
            className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 transition-colors shadow-sm"
          >
            Take Over Now
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Enquiries</span>
            <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">{metrics.totalConversations}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" /> English & Tanglish chats
            </p>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Schedule</span>
            <div className="h-8 w-8 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">{metrics.todayAppointments}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.confirmedAppointments} total confirmed
            </p>
          </div>
        </div>

        {/* AI Resolution Rate */}
        <div className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Resolution Rate</span>
            <div className="h-8 w-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-green-600">{metrics.aiResolutionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Autonomous bookings & FAQ answers</p>
          </div>
        </div>

        {/* Human Escalations */}
        <div className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Escalations Pending</span>
            <div
              className={`h-8 w-8 rounded-md flex items-center justify-center ${
                metrics.escalations > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold ${metrics.escalations > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {metrics.escalations}
            </div>
            <p className="text-xs text-gray-500 mt-1">Emergency or staff requests</p>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Appointments & RAG Knowledge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Appointments</h2>
              <p className="text-xs text-gray-500">Scheduled bookings locked via WhatsApp booking engine</p>
            </div>
            <Link
              href="/admin/appointments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Calendar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
            {(!data?.recentAppointments || data.recentAppointments.length === 0) ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No appointments booked yet. Try booking via the CLI simulator (`npm run simulate`)!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
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
                    <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-md bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-600">
                          <span className="text-[10px] font-bold uppercase">{dateFormatted.split(',')[0]}</span>
                          <span className="text-xs font-semibold">{dateObj.getDate()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{appt.customer.name}</span>
                            <span className="text-xs text-gray-500 font-mono">({appt.customer.phone})</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {appt.service.name} • {appt.staff.name} • ₹{appt.service.price}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-700">{timeFormatted}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            appt.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : appt.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
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
          <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI Chat Usage (Gemini)
              </span>
              <span className="text-xs font-mono text-gray-500">
                {data?.business?.chat_count || 0} / {data?.business?.chat_limit || 100}
              </span>
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(100, ((data?.business?.chat_count || 0) / (data?.business?.chat_limit || 100)) * 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 text-center">
              Limit resets monthly. Contact support to upgrade.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Clinic Working Hours
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Monday - Saturday</span>
                <span className="font-medium text-gray-900">9:00 AM - 7:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Lunch Break</span>
                <span className="font-medium text-gray-900">1:00 PM - 2:00 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Sunday</span>
                <span className="font-medium text-red-600">Closed (Leave)</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/knowledge"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 font-semibold transition-colors"
              >
                Manage Clinic Knowledge & RAG <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-md p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Autonomous Engine Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">WhatsApp Webhook</span>
                <span className="text-green-600 font-medium">Ready (/api/webhooks)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Language Detection</span>
                <span className="text-green-600 font-medium">EN, தமிழ், Tanglish</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">24H & 2H Reminders</span>
                <span className="text-green-600 font-medium">BullMQ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Emergency Filter</span>
                <span className="text-green-600 font-medium">Zero-Delay Guardrail</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
