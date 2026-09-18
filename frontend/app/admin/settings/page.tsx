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
import { fetchApi } from '../../../lib/api';

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
        <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinic & System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure business details, doctor schedules, treatment pricing, and Meta Cloud API webhooks
        </p>
      </div>

      {/* Business Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Clinic Business Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Clinic Name</label>
            <input
              type="text"
              readOnly
              value={business?.name || 'Dr. Kumar Dental Clinic'}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Category</label>
            <input
              type="text"
              readOnly
              value={business?.category || 'Dental Clinic'}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Emergency Helpline</label>
            <input
              type="text"
              readOnly
              value={business?.phone || '+91 98401 23456'}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Timezone</label>
            <input
              type="text"
              readOnly
              value={business?.timezone || 'Asia/Kolkata'}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-gray-700 font-semibold mb-1">Address & Landmark</label>
            <input
              type="text"
              readOnly
              value={business?.address || 'No. 45, Anna Nagar 2nd Avenue, Chennai - 600040'}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Services & Pricing Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Treatments & Pricing Menu
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Offered services presented by the AI assistant during booking
            </p>
          </div>

          <button
            onClick={() => setShowAddService(!showAddService)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Treatment
          </button>
        </div>

        {/* Add Service Inline Form */}
        {showAddService && (
          <form onSubmit={handleAddService} className="p-4 rounded-md bg-gray-50 border border-gray-200 space-y-3">
            <h4 className="text-xs font-semibold text-gray-900">New Clinic Treatment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Treatment Name (e.g. Tooth Extraction)"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-900"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Duration (Minutes)"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-900"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Price (₹ INR)"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddService(false)}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
              >
                Save Treatment
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-100">
          {services.map((svc) => (
            <div key={svc.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-gray-900">{svc.name}</span>
                <span className="text-gray-500 ml-2 font-mono">({svc.duration_minutes} mins)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 text-sm">₹{svc.price}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meta WhatsApp Cloud API Settings Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Meta WhatsApp Cloud API Configuration
          </h2>
        </div>
        
        {/* Automated Connect Options */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Automated Setup (Recommended)</h3>
            <p className="text-xs text-gray-500 mb-4">Connect your business accounts to automatically configure the WhatsApp API.</p>
            <div className="flex flex-wrap gap-3">
              <button className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Connect with Facebook
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                Connect Google Account
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Manual Setup</h3>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Webhook Callback URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="http://localhost:5000/api/webhooks/whatsapp"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 font-mono"
              />
              <button
                onClick={handleCopyWebhook}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium flex items-center gap-1.5 transition-colors border border-blue-200"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Phone Number ID</label>
              <input
                type="text"
                value={business?.whatsapp_phone_number_id || ''}
                placeholder="e.g. 1335214009670704"
                onChange={(e) => setBusiness({...business, whatsapp_phone_number_id: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">WhatsApp Business Account ID</label>
              <input
                type="text"
                value={business?.whatsapp_waba_id || ''}
                placeholder="e.g. 112233445566778"
                onChange={(e) => setBusiness({...business, whatsapp_waba_id: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Permanent Access Token</label>
            <input
              type="password"
              value={business?.whatsapp_access_token || ''}
              placeholder="EAAI..."
              onChange={(e) => setBusiness({...business, whatsapp_access_token: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors text-sm">
              <Save className="h-4 w-4" />
              Save API Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
