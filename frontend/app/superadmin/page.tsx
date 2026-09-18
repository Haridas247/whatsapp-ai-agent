'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function SuperadminPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await fetchApi('/api/businesses');
      setBusinesses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchTenant = async (id: string) => {
    try {
      await fetchApi('/api/business/switch-active', {
        method: 'POST',
        body: JSON.stringify({ business_id: id }),
      });
      loadBusinesses(); // Refresh list to update active status
      alert('Successfully switched active tenant in the database.');
    } catch (err) {
      console.error(err);
      alert('Failed to switch tenant');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Superadmin Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Superadmin Dashboard</h1>
        </div>
        
        <p className="text-gray-600">Manage all registered tenants and their API usage limits across the platform.</p>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tenant / Business
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Chat Usage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businesses.map((biz) => {
                const limitReached = biz.chat_count >= biz.chat_limit;
                return (
                  <tr key={biz.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{biz.name}</div>
                          <div className="text-sm text-gray-500">{biz.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {biz.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {biz.chat_count} / {biz.chat_limit}
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${limitReached ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (biz.chat_count / biz.chat_limit) * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {biz.status === 'ACTIVE' ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <CheckCircle2 className="h-4 w-4" /> ACTIVE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <XCircle className="h-4 w-4" /> INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {biz.status !== 'ACTIVE' && (
                        <button 
                          onClick={() => handleSwitchTenant(biz.id)}
                          className="px-3 py-1 text-sm font-medium rounded-md border text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Make Active
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
