"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

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

interface RequestDetailModalProps {
  request: RequestWithEmailStatus;
  onClose: () => void;
  onUpdate: (predictionId: number, updates: any) => Promise<void>;
}

export function RequestDetailModal({
  request,
  onClose,
  onUpdate,
}: RequestDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [amountNet, setAmountNet] = useState<number | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [aiWorkhours, setAiWorkhours] = useState<number | null>(null);
  const [positions, setPositions] = useState<PositionInfo[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request.prediction) {
      setAmountNet(request.prediction.amount_net);
      setHourlyRate(request.prediction.hourly_rate);
      setAiWorkhours(request.prediction.ai_workhours);
      setPositions(request.prediction.positions || []);
    }
  }, [request]);

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

  const handleSave = async () => {
    if (!request.prediction_id) {
      alert("No prediction ID found");
      return;
    }

    setSaving(true);
    try {
      const updates: any = {};
      if (amountNet !== null) updates.amount_net = amountNet;
      if (hourlyRate !== null) updates.hourly_rate = hourlyRate;
      if (aiWorkhours !== null) updates.ai_workhours = aiWorkhours;
      if (positions.length > 0) updates.positions = positions;

      await onUpdate(request.prediction_id, updates);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updatePosition = (index: number, field: keyof PositionInfo, value: any) => {
    const updated = [...positions];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate total_price
    updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    setPositions(updated);
    // Recalculate total amount_net
    const newTotal = updated.reduce((sum, pos) => sum + pos.total_price, 0) * 100;
    setAmountNet(newTotal);
  };

  const calculatedTotal = positions.reduce((sum, pos) => sum + pos.total_price, 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div>
            <h2 className="text-xl font-semibold">Request #{request.id}</h2>
            <p className="text-sm text-base-content/60 mt-1">{request.customer_name}</p>
          </div>
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Request Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Request Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-base-content/60">Customer Email</label>
                <div className="font-medium">{request.customer_email}</div>
              </div>
              {request.customer_phone && (
                <div>
                  <label className="text-sm text-base-content/60">Phone</label>
                  <div className="font-medium">{request.customer_phone}</div>
                </div>
              )}
              <div>
                <label className="text-sm text-base-content/60">From Address</label>
                <div className="font-medium">{request.from_address}</div>
              </div>
              <div>
                <label className="text-sm text-base-content/60">To Address</label>
                <div className="font-medium">{request.to_address}</div>
              </div>
              {request.distance_km && (
                <div>
                  <label className="text-sm text-base-content/60">Distance</label>
                  <div className="font-medium">{request.distance_km.toFixed(1)} km</div>
                </div>
              )}
              {request.total_volume_cbm && (
                <div>
                  <label className="text-sm text-base-content/60">Volume</label>
                  <div className="font-medium">{request.total_volume_cbm.toFixed(1)} m³</div>
                </div>
              )}
              <div>
                <label className="text-sm text-base-content/60">Received</label>
                <div className="font-medium">{formatDate(request.received_at)}</div>
              </div>
              <div>
                <label className="text-sm text-base-content/60">Email Status</label>
                <div>
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
                </div>
              </div>
            </div>
          </div>

          {/* Prediction */}
          {request.prediction ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Prediction</h3>
                {!editing && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  {/* Summary Fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Total Amount (cents)</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered w-full"
                        value={amountNet || ""}
                        onChange={(e) => setAmountNet(parseInt(e.target.value) || null)}
                      />
                      {amountNet && (
                        <div className="text-xs text-base-content/60 mt-1">
                          {formatAmount(amountNet)}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Hourly Rate</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered w-full"
                        value={hourlyRate || ""}
                        onChange={(e) => setHourlyRate(parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">AI Work Hours</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input input-bordered w-full"
                        value={aiWorkhours || ""}
                        onChange={(e) => setAiWorkhours(parseFloat(e.target.value) || null)}
                      />
                    </div>
                  </div>

                  {/* Positions */}
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Positions</span>
                    </label>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra table-sm">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Unit</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((pos, index) => (
                            <tr key={index}>
                              <td>
                                <input
                                  type="text"
                                  className="input input-bordered input-sm w-full"
                                  value={pos.description}
                                  onChange={(e) =>
                                    updatePosition(index, "description", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="input input-bordered input-sm w-full"
                                  value={pos.quantity}
                                  onChange={(e) =>
                                    updatePosition(
                                      index,
                                      "quantity",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="input input-bordered input-sm w-full"
                                  value={pos.unit_price}
                                  onChange={(e) =>
                                    updatePosition(
                                      index,
                                      "unit_price",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="input input-bordered input-sm w-full"
                                  value={pos.unit}
                                  onChange={(e) =>
                                    updatePosition(index, "unit", e.target.value)
                                  }
                                />
                              </td>
                              <td className="font-semibold">
                                {formatAmount(pos.total_price * 100)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colSpan={4}>Total</th>
                            <th>{formatAmount(calculatedTotal * 100)}</th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end">
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditing(false);
                        // Reset to original values
                        if (request.prediction) {
                          setAmountNet(request.prediction.amount_net);
                          setHourlyRate(request.prediction.hourly_rate);
                          setAiWorkhours(request.prediction.ai_workhours);
                          setPositions(request.prediction.positions || []);
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-base-content/60">Total Amount</label>
                      <div className="text-lg font-semibold">
                        {formatAmount(request.prediction.amount_net)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-base-content/60">Hourly Rate</label>
                      <div className="text-lg font-semibold">
                        {request.prediction.hourly_rate.toFixed(2)} €/h
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-base-content/60">AI Work Hours</label>
                      <div className="text-lg font-semibold">
                        {request.prediction.ai_workhours.toFixed(2)} h
                      </div>
                    </div>
                  </div>

                  {/* Positions Table */}
                  {request.prediction.positions && request.prediction.positions.length > 0 && (
                    <div>
                      <label className="text-sm text-base-content/60 mb-2 block">
                        Positions
                      </label>
                      <div className="overflow-x-auto">
                        <table className="table table-zebra table-sm">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Unit</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {request.prediction.positions.map((pos, index) => (
                              <tr key={index}>
                                <td>{pos.description}</td>
                                <td>{pos.quantity}</td>
                                <td>{formatAmount(pos.unit_price * 100)}</td>
                                <td>{pos.unit}</td>
                                <td className="font-semibold">
                                  {formatAmount(pos.total_price * 100)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <th colSpan={4}>Total</th>
                              <th>
                                {formatAmount(request.prediction.amount_net)}
                              </th>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-warning">
              <span>No prediction available for this request</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
