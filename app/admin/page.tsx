'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw } from 'lucide-react';
import RequestsTable from '@/components/RequestsTable';

const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // Check if we're on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return envUrl || 'http://localhost:4001';
  }

  // If no env URL, try to use same origin (if API is on same domain)
  if (!envUrl) {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  }

  // Check if URL contains internal domains (Railway, etc.)
  if (envUrl.includes('.internal') || envUrl.includes('railway.internal')) {
    console.error('API URL appears to be an internal URL. Please set NEXT_PUBLIC_API_URL to a public URL.');
    // Try to construct public URL from internal URL
    const publicUrl = envUrl.replace('.railway.internal', '.railway.app').replace('http://', 'https://');
    return publicUrl;
  }

  return envUrl;
};

const API_URL = getApiUrl();

interface RequestWithEmailStatus {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  from_address: string;
  to_address: string;
  distance_km: number | null;
  total_volume_cbm: number | null;
  received_at: string;
  moving_out_date: string | null;
  moving_in_date: string | null;
  prediction: any | null;
  email_status: string | null;
  prediction_id: number | null;
  data_parsed?: any; // Full CustomerForm data from the request
}

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestWithEmailStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');

  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_authenticated') === 'true';
  };

  const fetchRequests = useCallback(async (pageNum: number = page, searchTerm: string = search) => {
    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        per_page: perPage.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${API_URL}/api/requests/pending-emails?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
      // Note: The API doesn't return total count, so we'll use the array length
      // You might want to add total count to the API response
      setTotalCount(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [router, page, perPage, search]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    fetchRequests(page, search);
  }, [router, page, perPage, search, fetchRequests]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage moving requests</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => fetchRequests(page, search)}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button className="btn btn-sm" onClick={() => fetchRequests(page, search)}>
              Retry
            </button>
          </div>
        )}

        <div className="card bg-white shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Requests</h2>
              <div className="text-sm text-gray-500">
                Total: {requests.length}
              </div>
            </div>

            <RequestsTable
              requests={requests}
              onRefresh={() => fetchRequests(page, search)}
              page={page}
              perPage={perPage}
              totalCount={totalCount}
              onPageChange={setPage}
              onPerPageChange={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
              search={search}
              onSearchChange={(newSearch) => {
                setSearch(newSearch);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
