'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Phone,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  };
  staff: {
    id: string;
    name: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/api/appointments' : `/api/appointments?status=${statusFilter}`;
      const data = await fetchApi(url);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      setActionLoading(id);
      await fetchApi(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadAppointments();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = appointments.filter((a) => {
    const query = search.toLowerCase();
    return (
      a.customer.name.toLowerCase().includes(query) ||
      a.customer.phone.includes(query) ||
      a.service.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinic Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage scheduled patient visits and slot occupancy in real time
          </p>
        </div>

        <button
          onClick={loadAppointments}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Controls Bar: Search & Status Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient, phone, or treatment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-gray-500">Loading appointments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center rounded-md bg-gray-50 border border-gray-200 shadow-sm">
          <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">No appointments found</p>
          <p className="text-xs text-gray-500 mt-1">
            Book an appointment using WhatsApp or CLI simulator (`npm run simulate`).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((appt) => {
            const dateObj = new Date(appt.start_at);
            const timeStr = dateObj.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            const dateStr = dateObj.toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={appt.id}
                className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow shadow-sm space-y-4"
              >
                <div>
                  {/* Top Bar with Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-500">
                      #{appt.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
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

                  {/* Customer Info */}
                  <div className="mt-3">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      {appt.customer.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {appt.customer.phone}
                    </p>
                  </div>

                  {/* Service & Time */}
                  <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Treatment:</span>
                      <span className="font-medium text-gray-900">{appt.service.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Doctor:</span>
                      <span className="font-medium text-gray-700">{appt.staff.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium text-gray-700">{dateStr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-semibold text-blue-600">{timeStr}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                      <span className="text-gray-500">Fee:</span>
                      <span className="font-bold text-gray-900">₹{appt.service.price}</span>
                    </div>
                  </div>

                  {appt.notes && (
                    <p className="text-[11px] text-gray-500 mt-2 italic">Note: {appt.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {appt.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                        disabled={actionLoading === appt.id}
                        className="flex-1 py-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                        disabled={actionLoading === appt.id}
                        className="flex-1 py-1.5 px-3 rounded-md bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </>
                  )}
                  {appt.status !== 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                      disabled={actionLoading === appt.id}
                      className="w-full py-1.5 px-3 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors border border-gray-200 shadow-sm"
                    >
                      Restore to Confirmed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
