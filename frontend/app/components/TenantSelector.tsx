'use client';

import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check, Sparkles, Scissors, Stethoscope } from 'lucide-react';
import { fetchApi } from '../../lib/api';

interface Business {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function TenantSelector() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const loadBusinesses = async () => {
    try {
      const data = await fetchApi('/api/businesses');
      if (Array.isArray(data)) {
        setBusinesses(data);
        const active = data.find((b) => b.status === 'ACTIVE') || data[0];
        setActiveBiz(active || null);
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleSelectBusiness = async (biz: Business) => {
    if (biz.id === activeBiz?.id || switching) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      await fetchApi('/api/business/switch-active', {
        method: 'POST',
        body: JSON.stringify({ business_id: biz.id }),
      });
      setActiveBiz(biz);
      setIsOpen(false);
      // Reload page to re-render all dashboard panels for the newly selected tenant
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch business tenant:', err);
    } finally {
      setSwitching(false);
    }
  };

  const isSalon = (cat?: string) => (cat || '').toLowerCase().includes('salon') || (cat || '').toLowerCase().includes('spa');

  return (
    <div className="relative mt-4">
      <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-emerald-400" />
          Active Sector / Tenant
        </span>
        {switching && (
          <span className="text-[10px] text-amber-400 animate-pulse font-mono">Switching...</span>
        )}
      </div>

      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="w-full flex items-center justify-between p-2.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
              isSalon(activeBiz?.category)
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isSalon(activeBiz?.category) ? (
              <Scissors className="h-3.5 w-3.5" />
            ) : (
              <Stethoscope className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
              {activeBiz?.name || 'Loading...'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeBiz?.category || 'SaaS Demo'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-2 backdrop-blur-xl space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
              <span>Choose Demo Sector</span>
              <span className="text-emerald-400 text-[9px] flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> 1-Click
              </span>
            </div>

            {businesses.map((biz) => {
              const selected = biz.id === activeBiz?.id;
              const salon = isSalon(biz.category);

              return (
                <button
                  key={biz.id}
                  onClick={() => handleSelectBusiness(biz)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    selected
                      ? 'bg-emerald-500/15 border border-emerald-500/30'
                      : 'hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        salon
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {salon ? (
                        <Scissors className="h-4 w-4" />
                      ) : (
                        <Stethoscope className="h-4 w-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-semibold truncate ${selected ? 'text-white' : 'text-slate-200'}`}>
                        {biz.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {biz.category} • {salon ? 'T. Nagar' : 'Anna Nagar'}
                      </p>
                    </div>
                  </div>

                  {selected && <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
