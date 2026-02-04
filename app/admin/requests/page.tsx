"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Edit, AlertCircle } from "lucide-react";
import { RequestDetailModal } from "@/components/RequestDetailModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

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
  amount_net: number; // in cents
  positions: PositionInfo[];
  breakdown_by_class?: any[];
  calculation_details?: any;
}

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
  prediction: AIPredictionResponse | null;
  email_status: string | null;
  prediction_id: number | null;
}

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<RequestWithEmailStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [selectedRequest, setSelectedRequest] = useState<RequestWithEmailStatus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_authenticated');
      if (auth === 'true') {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [page, search, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/admin/requests?${params.toString()}`);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [search, isAuthenticated]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "50",
      });
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`${API_BASE}/api/requests/pending-emails?${params}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRowClick = (request: RequestWithEmailStatus) => {
    setSelectedRequest(request);
  };

  const handleUpdatePrediction = async (predictionId: number, updates: any) => {
    try {
      const response = await fetch(`${API_BASE}/api/predictions/${predictionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update prediction: ${response.status}`);
      }

      // Refresh requests
      await fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update prediction");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-base-content">
                Pending Requests
              </h1>
              <p className="text-sm text-base-content/60 mt-1">
                Requests where emails haven't been sent
              </p>
            </div>
            <div className="flex gap-2">
              <label className="input input-bordered flex items-center gap-2 w-64">
                <Search className="w-4 h-4 opacity-50" />
                <input
                  type="search"
                  className="grow"
                  placeholder="Search customer or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button
                className="btn btn-ghost"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-base-100 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>From → To</th>
                    <th>Distance</th>
                    <th>Volume</th>
                    <th>Prediction</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="cursor-pointer hover:bg-base-200"
                      onClick={() => handleRowClick(request)}
                    >
                      <td className="font-mono text-sm">{request.id}</td>
                      <td>
                        <div className="font-medium">{request.customer_name}</div>
                        {request.customer_phone && (
                          <div className="text-xs text-base-content/60">
                            {request.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="text-sm">{request.customer_email}</td>
                      <td>
                        <div className="text-sm">
                          <div className="truncate max-w-xs">{request.from_address}</div>
                          <div className="text-xs text-base-content/60">→</div>
                          <div className="truncate max-w-xs">{request.to_address}</div>
                        </div>
                      </td>
                      <td>
                        {request.distance_km
                          ? `${request.distance_km.toFixed(1)} km`
                          : "-"}
                      </td>
                      <td>
                        {request.total_volume_cbm
                          ? `${request.total_volume_cbm.toFixed(1)} m³`
                          : "-"}
                      </td>
                      <td>
                        {request.prediction ? (
                          <div className="font-semibold">
                            {formatAmount(request.prediction.amount_net)}
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${request.email_status === "pending"
                            ? "badge-warning"
                            : request.email_status === "approved"
                              ? "badge-info"
                              : request.email_status === "failed"
                                ? "badge-error"
                                : "badge-ghost"
                            }`}
                        >
                          {request.email_status || "No email"}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/60">
                        {formatDate(request.received_at)}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(request);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {requests.length === 0 && (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                <p className="text-base-content/60">No pending requests found</p>
              </div>
            )}
          </div>
        )}
      </div>

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
