"use client";

import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2 } from "lucide-react";

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
  data_parsed?: any; // Full CustomerForm data from the request
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

  const addPosition = () => {
    const newPosition: PositionInfo = {
      position_class: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      unit: 'Stk',
      total_price: 0,
    };
    setPositions([...positions, newPosition]);
  };

  const removePosition = (index: number) => {
    const updated = positions.filter((_, i) => i !== index);
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
              {request.total_volume_cbm !== null && request.total_volume_cbm !== undefined && (
                <div>
                  <label className="text-sm text-base-content/60">Volume</label>
                  <div className="font-medium">{Number(request.total_volume_cbm).toFixed(2)} m³</div>
                </div>
              )}
              {request.moving_out_date && (
                <div>
                  <label className="text-sm text-base-content/60">Moving Out Date</label>
                  <div className="font-medium">{request.moving_out_date}</div>
                </div>
              )}
              {request.moving_in_date && (
                <div>
                  <label className="text-sm text-base-content/60">Moving In Date</label>
                  <div className="font-medium">{request.moving_in_date}</div>
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

          {/* Form Data Details */}
          {request.data_parsed && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Form Data</h3>

              {/* Services */}
              {request.data_parsed.services && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Services</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {request.data_parsed.services.carton_pack && <div>✓ Carton Pack</div>}
                    {request.data_parsed.services.carton_unpack && <div>✓ Carton Unpack</div>}
                    {request.data_parsed.services.furniture_disassembly && <div>✓ Furniture Disassembly</div>}
                    {request.data_parsed.services.furniture_assembly && <div>✓ Furniture Assembly</div>}
                    {request.data_parsed.services.lamps_disassembly && (
                      <div>✓ Lamps Disassembly ({request.data_parsed.services.number_of_lamps_to_disassemble || 0})</div>
                    )}
                    {request.data_parsed.services.lamps_assembly && (
                      <div>✓ Lamps Assembly ({request.data_parsed.services.number_of_lamps_to_assemble || 0})</div>
                    )}
                    {request.data_parsed.services.kitchen_disassembly && <div>✓ Kitchen Disassembly</div>}
                    {request.data_parsed.services.kitchen_assembly && <div>✓ Kitchen Assembly</div>}
                    {request.data_parsed.services.storage && <div>✓ Storage</div>}
                  </div>
                </div>
              )}

              {/* Goods/Furniture */}
              {request.data_parsed.goods && request.data_parsed.goods.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Goods</h4>
                  <div className="space-y-2">
                    {request.data_parsed.goods.map((room: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-3">
                        <div className="font-semibold">{room.name}</div>
                        <div className="text-sm text-gray-600">Volume: {room.volume_m3?.toFixed(2) || 0} m³</div>
                        {room.items && room.items.length > 0 && (
                          <div className="text-sm mt-1">
                            {room.items.map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="ml-2">
                                • {item.description} (Qty: {item.quantity}, Vol: {item.volume_per_item_m3?.toFixed(2) || 0} m³)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Furniture Assembly */}
              {request.data_parsed.furniture_assembly && Array.isArray(request.data_parsed.furniture_assembly) && request.data_parsed.furniture_assembly.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Furniture Assembly</h4>
                  <div className="space-y-2">
                    {request.data_parsed.furniture_assembly.map((roomFurniture: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-green-500 pl-3">
                        <div className="font-semibold">{roomFurniture.room?.label || roomFurniture.room?.name || 'Room'}</div>
                        {roomFurniture.furniture && roomFurniture.furniture.length > 0 && (
                          <div className="text-sm mt-1">
                            {roomFurniture.furniture.map((f: any, fIdx: number) => (
                              <div key={fIdx} className="ml-2">
                                • {f.item?.label || f.item?.name || 'Item'} (Qty: {f.quantity}, Vol: {((f.item?.volume_m3 || 0) * (f.quantity || 0)).toFixed(2)} m³)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage Info */}
              {request.data_parsed.storage_info && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Storage Information</h4>
                  <div className="text-sm space-y-1">
                    <div>Wants Storage: {request.data_parsed.storage_info.wants_storage ? 'Yes' : 'No'}</div>
                    {request.data_parsed.storage_info.storage_date && (
                      <div>Storage Date: {request.data_parsed.storage_info.storage_date}</div>
                    )}
                    {request.data_parsed.storage_info.retrieval_date && (
                      <div>Retrieval Date: {request.data_parsed.storage_info.retrieval_date}</div>
                    )}
                    {request.data_parsed.storage_info.retrieval_address && (
                      <div>Retrieval Address: {request.data_parsed.storage_info.retrieval_address.address ||
                        `${request.data_parsed.storage_info.retrieval_address.street_name} ${request.data_parsed.storage_info.retrieval_address.house_number}, ${request.data_parsed.storage_info.retrieval_address.city}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cartonage Info */}
              {request.data_parsed.cartonage_info && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Cartonage Information</h4>
                  <div className="text-sm space-y-1">
                    {request.data_parsed.cartonage_info.boxes_to_buy > 0 && (
                      <div>Boxes to Buy: {request.data_parsed.cartonage_info.boxes_to_buy}</div>
                    )}
                    {request.data_parsed.cartonage_info.boxes_to_rent > 0 && (
                      <div>Boxes to Rent: {request.data_parsed.cartonage_info.boxes_to_rent}</div>
                    )}
                    {request.data_parsed.cartonage_info.wardrobe_boxes_to_rent > 0 && (
                      <div>Wardrobe Boxes to Rent: {request.data_parsed.cartonage_info.wardrobe_boxes_to_rent}</div>
                    )}
                    {request.data_parsed.cartonage_info.packing_service_quantity > 0 && (
                      <div>Packing Service: {request.data_parsed.cartonage_info.packing_service_quantity} boxes</div>
                    )}
                    {request.data_parsed.cartonage_info.unpacking_service_quantity > 0 && (
                      <div>Unpacking Service: {request.data_parsed.cartonage_info.unpacking_service_quantity} boxes</div>
                    )}
                    {request.data_parsed.cartonage_info.delivery_date && (
                      <div>Delivery Date: {request.data_parsed.cartonage_info.delivery_date}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Location Details */}
              {(request.data_parsed.from_location || request.data_parsed.to_location) && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Location Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {request.data_parsed.from_location && (
                      <div>
                        <div className="font-semibold mb-1">From Location:</div>
                        <div>Type: {request.data_parsed.from_location.object_type}</div>
                        <div>Floor: {request.data_parsed.from_location.floor}</div>
                        <div>Living Space: {request.data_parsed.from_location.living_space_m2} m²</div>
                        <div>Elevator: {request.data_parsed.from_location.has_elevator ? 'Yes' : 'No'}</div>
                        <div>Parking Zone: {request.data_parsed.from_location.needs_parking_zone ? 'Yes' : 'No'}</div>
                        <div>Walkway: {request.data_parsed.from_location.walkway_m} m</div>
                      </div>
                    )}
                    {request.data_parsed.to_location && (
                      <div>
                        <div className="font-semibold mb-1">To Location:</div>
                        <div>Type: {request.data_parsed.to_location.object_type}</div>
                        <div>Floor: {request.data_parsed.to_location.floor}</div>
                        <div>Living Space: {request.data_parsed.to_location.living_space_m2} m²</div>
                        <div>Elevator: {request.data_parsed.to_location.has_elevator ? 'Yes' : 'No'}</div>
                        <div>Parking Zone: {request.data_parsed.to_location.needs_parking_zone ? 'Yes' : 'No'}</div>
                        <div>Walkway: {request.data_parsed.to_location.walkway_m} m</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {request.data_parsed.notes && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Notes</h4>
                  <div className="text-sm bg-gray-50 p-3 rounded">
                    {request.data_parsed.notes}
                  </div>
                </div>
              )}
            </div>
          )}

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
                    <div className="flex items-center justify-between mb-2">
                      <label className="label">
                        <span className="label-text font-semibold">Positions</span>
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={addPosition}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Position
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra table-sm">
                        <thead>
                          <tr>
                            <th>Class</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Unit</th>
                            <th>Total</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((pos, index) => (
                            <tr key={index}>
                              <td>
                                <input
                                  type="text"
                                  className="input input-bordered input-sm w-full"
                                  value={pos.position_class}
                                  onChange={(e) =>
                                    updatePosition(index, "position_class", e.target.value)
                                  }
                                  placeholder="Class"
                                />
                              </td>
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
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-ghost btn-error"
                                  onClick={() => removePosition(index)}
                                  title="Remove position"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {positions.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center text-gray-500 py-4">
                                No positions. Click "Add Position" to add one.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colSpan={5}>Total</th>
                            <th>{formatAmount(calculatedTotal * 100)}</th>
                            <th></th>
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
                              <th>Class</th>
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
                                <td>{pos.position_class || '-'}</td>
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
                              <th colSpan={5}>Total</th>
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
