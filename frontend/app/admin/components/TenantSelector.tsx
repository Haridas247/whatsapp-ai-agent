'use client';

import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check, Sparkles, Scissors, Stethoscope } from 'lucide-react';
import { fetchApi } from '../../../lib/api';

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
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const loadBusinesses = async () => {
    try {
      const data = await fetchApi('/api/businesses');
      if (Array.isArray(data)) {
        setBusinesses(data);
        
        const storedId = localStorage.getItem('superadmin_active_tenant');
        if (storedId) {
          const match = data.find(b => b.id === storedId);
          if (match) setActiveBiz(match);
        } else {
          setActiveBiz(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('agent_auth_role');
    if (role === 'SUPERADMIN') {
      setIsSuperadmin(true);
      loadBusinesses();
    }
  }, []);

  const handleSelectBusiness = async (biz: Business) => {
    if (biz.id === activeBiz?.id || switching) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    localStorage.setItem('superadmin_active_tenant', biz.id);
    setActiveBiz(biz);
    setIsOpen(false);
    
    // Reload page to re-render all dashboard panels for the newly selected tenant
    window.location.reload();
  };

  if (!isSuperadmin) return null;

  const isSalon = (cat?: string) => (cat || '').toLowerCase().includes('salon') || (cat || '').toLowerCase().includes('spa');

  return (
    <div className="relative mt-4 font-sans">
      <div className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-blue-600" />
          Active Sector / Tenant
        </span>
        {switching && (
          <span className="text-[10px] text-blue-600 animate-pulse font-mono">Switching...</span>
        )}
      </div>

      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-md text-left transition-all group shadow-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`h-7 w-7 rounded-md flex items-center justify-center text-xs shrink-0 ${
              isSalon(activeBiz?.category)
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            {isSalon(activeBiz?.category) ? (
              <Scissors className="h-3.5 w-3.5" />
            ) : (
              <Stethoscope className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {activeBiz?.name || 'Loading...'}
            </p>
            <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              {activeBiz?.category || 'SaaS Demo'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-md shadow-xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-gray-500 border-b border-gray-100 flex items-center justify-between">
              <span>Choose Demo Sector</span>
              <span className="text-blue-600 text-[9px] flex items-center gap-1">
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
                  className={`w-full flex items-center justify-between p-2.5 rounded-md text-left transition-all ${
                    selected
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-md flex items-center justify-center text-xs shrink-0 ${
                        salon
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {salon ? (
                        <Scissors className="h-4 w-4" />
                      ) : (
                        <Stethoscope className="h-4 w-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-semibold truncate ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {biz.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {biz.category} • {salon ? 'T. Nagar' : 'Anna Nagar'}
                      </p>
                    </div>
                  </div>

                  {selected && <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
