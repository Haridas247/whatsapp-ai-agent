'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  Copy,
  Plus,
  DollarSign,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  status: string;
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // New service state
  const [showAddService, setShowAddService] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('500');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [bizData, svcData] = await Promise.all([
        fetchApi('/api/business'),
        fetchApi('/api/services'),
      ]);
      setBusiness(bizData);
      setServices(svcData);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('http://localhost:5000/api/webhooks/whatsapp');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    try {
      await fetchApi('/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: serviceName.trim(),
          duration_minutes: Number(serviceDuration),
          price: Number(servicePrice),
        }),
      });
      setServiceName('');
      setShowAddService(false);
      await loadSettings();
    } catch (err) {
      console.error('Failed to create service:', err);
    }
  };

  if (loading && !business) {
    return (
      <div className="p-16 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Clinic & System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure business details, doctor schedules, treatment pricing, and Meta Cloud API webhooks
        </p>
      </div>

      {/* Business Profile Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-400" />
          Clinic Business Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Clinic Name</label>
            <input
              type="text"
              readOnly
              value={business?.name || 'Dr. Kumar Dental Clinic'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Category</label>
            <input
              type="text"
              readOnly
              value={business?.category || 'Dental Clinic'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Emergency Helpline</label>
            <input
              type="text"
              readOnly
              value={business?.phone || '+91 98401 23456'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Timezone</label>
            <input
              type="text"
              readOnly
              value={business?.timezone || 'Asia/Kolkata'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Address & Landmark</label>
            <input
              type="text"
              readOnly
              value={business?.address || 'No. 45, Anna Nagar 2nd Avenue, Chennai - 600040'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Services & Pricing Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Treatments & Pricing Menu
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Offered services presented by the AI assistant during booking
            </p>
          </div>

          <button
            onClick={() => setShowAddService(!showAddService)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Treatment
          </button>
        </div>

        {/* Add Service Inline Form */}
        {showAddService && (
          <form onSubmit={handleAddService} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-emerald-400">New Clinic Treatment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Treatment Name (e.g. Tooth Extraction)"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Duration (Minutes)"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Price (₹ INR)"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddService(false)}
                className="px-3 py-1 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold"
              >
                Save Treatment
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-800">
          {services.map((svc) => (
            <div key={svc.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">{svc.name}</span>
                <span className="text-slate-400 ml-2 font-mono">({svc.duration_minutes} mins)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-400 text-sm">₹{svc.price}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meta WhatsApp Cloud API Settings Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          Meta WhatsApp Cloud API Configuration
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Webhook Callback URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="http://localhost:5000/api/webhooks/whatsapp"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
              />
              <button
                onClick={handleCopyWebhook}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Verify Token</label>
              <input
                type="text"
                readOnly
                value="whatsapp_agent_secure_token_2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Phone Number ID</label>
              <input
                type="text"
                readOnly
                value="1335214009670704"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
