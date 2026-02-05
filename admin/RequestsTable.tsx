'use client';

import { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { RequestDetailModal } from './RequestDetailModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:4001'
    : '');

interface PositionInfo {
  position_class: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
  total_price: number;
}

interface AIPredictionResponse {
  request_id: number;
  version: string;
  hourly_rate: number;
  ai_workhours: number;
  amount_net: number;
  positions: PositionInfo[];
  breakdown_by_class?: any[];
  calculation_details?: any;
}

interface RequestWithEmailStatus {
  uuid?: string; // New format uses UUID
  id?: number; // Legacy format
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  // New format: separate address fields
  from_street?: string;
  from_street_number?: string;
  from_zip?: string;
  from_city?: string;
  from_country_code?: string;
  to_street?: string;
  to_street_number?: string;
  to_zip?: string;
  to_city?: string;
  to_country_code?: string;
  // Legacy format: combined addresses (for backward compatibility)
  from_address?: string;
  to_address?: string;
  distance_km: number | null;
  total_volume_cbm: number | null;
  received_at: string;
  moving_out_date: string | null;
  moving_in_date: string | null;
  prediction: AIPredictionResponse | null;
  email_status: string | null;
  prediction_uuid?: string; // New format
  prediction_id?: number | null; // Legacy format
  data_parsed?: any; // Full CustomerForm data from the request
}

interface RequestsTableProps {
  requests: RequestWithEmailStatus[];
  onRefresh: () => void;
  page?: number;
  perPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
}

export default function RequestsTable({
  requests,
  onRefresh,
  page = 1,
  perPage = 50,
  totalCount = 0,
  onPageChange,
  onPerPageChange,
  search = '',
  onSearchChange,
}: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<RequestWithEmailStatus | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchInput, setSearchInput] = useState(search);

  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_authenticated') === 'true';
  };

  const handleSendEmail = async (e: React.MouseEvent, request: RequestWithEmailStatus) => {
    e.stopPropagation(); // Prevent row click from opening modal
    if (!isAuthenticated()) {
      alert('Not authenticated');
      return;
    }

    const requestUuid = request.uuid;
    if (!requestUuid) {
      alert('Request UUID is required');
      return;
    }

    // Ensure UUID is a string
    const uuidString = String(requestUuid);
    setSendingEmail(uuidString);

    try {
      const requestBody = { request_uuid: uuidString };
      console.log('Sending email request:', requestBody, 'to', `${API_URL}/api/send-mail`);

      const response = await fetch(`${API_URL}/api/send-mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to send email (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = `${errorMessage}: ${errorText}`;
          }
        }
        console.error('Email send error:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json().catch(() => ({}));
      alert('Email sent successfully!');
      onRefresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      console.error('Email send error:', err);
      alert(errorMessage);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleUpdatePrediction = async (predictionId: string | number | null | undefined, updates: any) => {
    if (!predictionId) {
      throw new Error('No prediction ID provided');
    }
    if (!isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/predictions/${predictionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(error.error || 'Failed to update prediction');
    }

    onRefresh();
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.email_status === filter;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
        break;
      case 'name':
        comparison = a.customer_name.localeCompare(b.customer_name);
        break;
      case 'status':
        comparison = (a.email_status || '').localeCompare(b.email_status || '');
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (request: RequestWithEmailStatus, type: 'from' | 'to'): string => {
    // If combined address exists (legacy format), use it
    if (type === 'from' && request.from_address) {
      return request.from_address;
    }
    if (type === 'to' && request.to_address) {
      return request.to_address;
    }

    // Otherwise construct from individual fields
    const street = type === 'from' ? request.from_street : request.to_street;
    const streetNumber = type === 'from' ? request.from_street_number : request.to_street_number;
    const zip = type === 'from' ? request.from_zip : request.to_zip;
    const city = type === 'from' ? request.from_city : request.to_city;

    const parts: string[] = [];
    if (street) {
      const streetPart = streetNumber ? `${street} ${streetNumber}` : street;
      parts.push(streetPart);
    }
    if (zip && city) {
      parts.push(`${zip} ${city}`);
    } else if (city) {
      parts.push(city);
    } else if (zip) {
      parts.push(zip);
    }

    return parts.length > 0 ? parts.join(', ') : 'Nicht angegeben';
  };

  const getRequestId = (request: RequestWithEmailStatus): string | number => {
    return request.uuid || request.id || '';
  };

  const getStatusBadge = (status: string | null) => {
    const statusClass = status === 'pending'
      ? 'badge-warning'
      : status === 'approved'
        ? 'badge-info'
        : status === 'failed'
          ? 'badge-error'
          : 'badge-ghost';

    return (
      <span className={`badge ${statusClass}`}>
        {status || 'No email'}
      </span>
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchInput);
      if (onPageChange) {
        onPageChange(1); // Reset to first page on new search
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {onSearchChange && (
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input input-bordered flex-1"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearchInput('');
                onSearchChange('');
                if (onPageChange) {
                  onPageChange(1);
                }
              }}
            >
              Clear
            </button>
          )}
        </form>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            All ({requests.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({requests.filter(r => r.email_status === 'pending').length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'approved' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({requests.filter(r => r.email_status === 'approved').length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'failed' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('failed')}
          >
            Failed ({requests.filter(r => r.email_status === 'failed').length})
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">Sort by:</label>
          <select
            className="select select-bordered select-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'status')}
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
          </select>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Email</th>
              <th>From → To</th>
              <th>Distance</th>
              <th>Volume</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((request) => {
              const requestId = getRequestId(request);
              const fromAddr = formatAddress(request, 'from');
              const toAddr = formatAddress(request, 'to');
              return (
                <tr
                  key={request.uuid || request.id}
                  className="cursor-pointer hover:bg-base-200 transition-colors"
                  onClick={() => setSelectedRequest(request)}
                >
                  <td className="font-semibold">#{request.uuid ? request.uuid.substring(0, 8) : request.id}</td>
                  <td>{request.customer_name}</td>
                  <td>
                    <a
                      href={`mailto:${request.customer_email}`}
                      className="link link-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {request.customer_email}
                    </a>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="truncate max-w-xs" title={fromAddr}>
                        {fromAddr}
                      </div>
                      <div className="text-gray-500">→</div>
                      <div className="truncate max-w-xs" title={toAddr}>
                        {toAddr}
                      </div>
                    </div>
                  </td>
                  <td>
                    {request.distance_km !== null && request.distance_km !== undefined ? (
                      <span className="badge badge-outline">
                        {Number(request.distance_km).toFixed(1)} km
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {request.total_volume_cbm !== null && request.total_volume_cbm !== undefined ? (
                      <span className="badge badge-outline">
                        {Number(request.total_volume_cbm).toFixed(2)} m³
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-sm">{formatDate(request.received_at)}</td>
                  <td>{getStatusBadge(request.email_status)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => handleSendEmail(e, request)}
                      disabled={sendingEmail === (request.uuid || request.id)}
                      title="Send Email"
                    >
                      {sendingEmail === (request.uuid || request.id) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No requests found
          </div>
        )}
      </div>

      {/* Pagination */}
      {onPageChange && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">Items per page:</label>
            <select
              className="select select-bordered select-sm"
              value={perPage}
              onChange={(e) => {
                const newPerPage = parseInt(e.target.value);
                if (onPerPageChange) {
                  onPerPageChange(newPerPage);
                }
                if (onPageChange) {
                  onPageChange(1); // Reset to first page
                }
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {page} • Showing {sortedRequests.length} of {totalCount || requests.length} requests
            </span>
            <div className="join">
              <button
                className="join-item btn btn-sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                «
              </button>
              <button className="join-item btn btn-sm">
                {page}
              </button>
              <button
                className="join-item btn btn-sm"
                onClick={() => onPageChange(page + 1)}
                disabled={sortedRequests.length < perPage}
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={handleUpdatePrediction}
        />
      )}
    </div>
  );
}
