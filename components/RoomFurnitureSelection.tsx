'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, X, Search, X as XIcon } from 'lucide-react';
import { catalog, RoomType, FurnitureItem } from '../types/form';
import FormHeader from './FormHeader';

interface RoomFurniture {
    room: RoomType;
    furniture: Array<{
        item: FurnitureItem;
        quantity: number;
    }>;
}

interface RoomFurnitureSelectionProps {
    selectedRooms: RoomType[];
    initialRoomFurniture?: RoomFurniture[];
    onBack: () => void;
    onSave: (roomFurniture: RoomFurniture[]) => void;
    onRoomsChange?: (rooms: RoomType[]) => void;
}

const STORAGE_KEY = 'furniture-assembly-state';

export default function RoomFurnitureSelection({
    selectedRooms,
    initialRoomFurniture = [],
    onBack,
    onSave,
    onRoomsChange,
}: RoomFurnitureSelectionProps) {
    const [activeRoom, setActiveRoom] = useState<RoomType | null>(selectedRooms[0] || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roomFurniture, setRoomFurniture] = useState<RoomFurniture[]>(initialRoomFurniture);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [tempSelectedRooms, setTempSelectedRooms] = useState<RoomType[]>(selectedRooms);
    const [showCustomFurnitureModal, setShowCustomFurnitureModal] = useState(false);
    const [customFurnitureName, setCustomFurnitureName] = useState('');
    const [customFurnitureVolume, setCustomFurnitureVolume] = useState<number>(0.5);

    // Update tempSelectedRooms when selectedRooms changes (but not when modal is open)
    useEffect(() => {
        if (!showRoomModal) {
            setTempSelectedRooms(selectedRooms);
        }
    }, [selectedRooms, showRoomModal]);

    // Initialize room furniture for all selected rooms if not present
    useEffect(() => {
        const updatedRoomFurniture = [...roomFurniture];
        selectedRooms.forEach(room => {
            if (!updatedRoomFurniture.some(rf => rf.room.name === room.name)) {
                updatedRoomFurniture.push({ room, furniture: [] });
            }
        });
        // Remove rooms that are no longer selected
        const filteredRoomFurniture = updatedRoomFurniture.filter(rf =>
            selectedRooms.some(sr => sr.name === rf.room.name)
        );
        setRoomFurniture(filteredRoomFurniture);
    }, [selectedRooms]);

    // Set active room if current one is removed
    useEffect(() => {
        if (activeRoom && !selectedRooms.some(r => r.name === activeRoom.name)) {
            setActiveRoom(selectedRooms[0] || null);
        } else if (!activeRoom && selectedRooms.length > 0) {
            setActiveRoom(selectedRooms[0]);
        }
    }, [selectedRooms, activeRoom]);

    const getCurrentRoomFurniture = () => {
        if (!activeRoom) return [];
        return roomFurniture.find(rf => rf.room.name === activeRoom.name)?.furniture || [];
    };

    const addFurniture = (item: FurnitureItem) => {
        if (!activeRoom) return;

        const currentFurniture = getCurrentRoomFurniture();
        const existing = currentFurniture.find(f => f.item.name === item.name);

        const updatedFurniture = existing
            ? currentFurniture.map(f =>
                f.item.name === item.name ? { ...f, quantity: f.quantity + 1 } : f
            )
            : [...currentFurniture, { item, quantity: 1 }];

        updateRoomFurniture(activeRoom, updatedFurniture);
    };

    const addCustomFurniture = () => {
        if (!activeRoom || !customFurnitureName.trim()) return;

        // Create a unique name for the custom furniture item
        const customItemName = `custom_${Date.now()}_${customFurnitureName.toLowerCase().replace(/\s+/g, '_')}`;

        // Create custom furniture item
        const customItem: FurnitureItem = {
            name: customItemName,
            label: customFurnitureName.trim(),
            icon: 'fas fa-box', // Default icon for custom items
            volume_m3: customFurnitureVolume,
            requires_assembly_disassembly: false, // Custom items don't require assembly by default
        };

        // Add to current room
        addFurniture(customItem);

        // Reset form and close modal
        setCustomFurnitureName('');
        setCustomFurnitureVolume(0.5);
        setShowCustomFurnitureModal(false);
    };

    const updateQuantity = (itemName: string, delta: number) => {
        if (!activeRoom) return;

        const currentFurniture = getCurrentRoomFurniture();
        const updatedFurniture = currentFurniture
            .map(f => {
                if (f.item.name === itemName) {
                    const newQuantity = Math.max(0, f.quantity + delta);
                    if (newQuantity === 0) {
                        return null;
                    }
                    return { ...f, quantity: newQuantity };
                }
                return f;
            })
            .filter((f): f is { item: FurnitureItem; quantity: number } => f !== null);

        updateRoomFurniture(activeRoom, updatedFurniture);
    };

    const removeFurniture = (itemName: string) => {
        if (!activeRoom) return;

        const currentFurniture = getCurrentRoomFurniture();
        const updatedFurniture = currentFurniture.filter(f => f.item.name !== itemName);
        updateRoomFurniture(activeRoom, updatedFurniture);
    };

    const updateRoomFurniture = (room: RoomType, furniture: Array<{ item: FurnitureItem; quantity: number }>) => {
        const updatedRoomFurniture = roomFurniture.map(rf =>
            rf.room.name === room.name ? { room, furniture } : rf
        );

        // If room doesn't exist in array, add it
        if (!updatedRoomFurniture.some(rf => rf.room.name === room.name)) {
            updatedRoomFurniture.push({ room, furniture });
        }

        setRoomFurniture(updatedRoomFurniture);
    };

    // Save to localStorage when roomFurniture changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        ...parsed,
                        roomFurniture,
                    }));
                }
            } catch (error) {
                console.error('Error saving furniture to localStorage:', error);
            }
        }
    }, [roomFurniture]);

    // Save to formData when roomFurniture changes
    useEffect(() => {
        onSave(roomFurniture);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomFurniture]); // onSave is intentionally omitted to prevent infinite loops

    // Filter furniture items based on search query
    const filteredFurnitureItems = catalog.furniture_items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentFurniture = getCurrentRoomFurniture();
    const getRoomFurnitureCount = (room: RoomType) => {
        const rf = roomFurniture.find(r => r.room.name === room.name);
        return rf ? rf.furniture.reduce((sum, f) => sum + f.quantity, 0) : 0;
    };

    // Calculate total CBM from all furniture across all rooms
    const calculateTotalCBM = (): number => {
        return roomFurniture.reduce((total, rf) => {
            const roomTotal = rf.furniture.reduce((sum, f) => {
                return sum + (f.item.volume_m3 * f.quantity);
            }, 0);
            return total + roomTotal;
        }, 0);
    };

    const totalCBM = calculateTotalCBM();

    if (!activeRoom) {
        return (
            <div className="space-y-6">
                <div className="alert alert-info">
                    <span>Bitte wählen Sie zuerst Räume aus.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                    <FormHeader title="Wählen Sie die Möbel pro Raum aus" />
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Gesamtvolumen:</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600">{totalCBM.toFixed(2)} m³</span>
                </div>
            </div>

            {/* Room Tabs */}
            <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2">
                {selectedRooms.map((room) => {
                    const isActive = activeRoom.name === room.name;
                    const furnitureCount = getRoomFurnitureCount(room);
                    return (
                        <button
                            key={room.name}
                            type="button"
                            onClick={() => setActiveRoom(room)}
                            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all relative flex-shrink-0 ${isActive
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <i className={`${room.icon} text-lg sm:text-xl`}></i>
                            <span className="font-medium text-sm sm:text-base whitespace-nowrap">{room.label}</span>
                            {isActive && (
                                <div className="absolute top-1 right-1 w-2 h-2"></div>
                            )}
                        </button>
                    );
                })}
                {/* Add Room Button */}
                <button
                    type="button"
                    onClick={() => {
                        setTempSelectedRooms([...selectedRooms]);
                        setShowRoomModal(true);
                    }}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all flex-shrink-0"
                >
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Search and Furniture List */}
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="form-control">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`${activeRoom.label} durchsuchen`}
                                className="input input-bordered w-full pl-10 pr-10 relative"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                                >
                                    <XIcon className="w-5 h-5 z-10" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Furniture List */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Alle Möbel</span>
                        </label>
                        <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                            <div className="divide-y divide-gray-200">
                                {filteredFurnitureItems.map((item) => {
                                    return (
                                        <div
                                            key={item.name}
                                            onClick={() => addFurniture(item)}
                                            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                <i className={`${item.icon} text-lg sm:text-xl text-gray-600 flex-shrink-0`}></i>
                                                <span className="font-medium text-gray-800 text-sm sm:text-base break-words">{item.label}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addFurniture(item);
                                                }}
                                                className="btn btn-sm btn-circle btn-primary flex-shrink-0 ml-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Custom Furniture Button */}
                    <button
                        type="button"
                        onClick={() => setShowCustomFurnitureModal(true)}
                        className="btn border-primary btn-primary w-full">
                        <Plus className="w-5 h-5 mr-2" />
                        Möbelstück selbst anlegen
                    </button>

                </div>

                {/* Right Column: Added Furniture */}
                <div className="space-y-4">
                    <div className="form-control">
                        <label className="label pt-8 sm:pt-14">
                            <span className="label-text font-semibold text-sm sm:text-base break-words">
                                <i className={`${activeRoom.icon} mr-2 text-lg sm:text-xl`} />
                                {activeRoom.label} ({currentFurniture.reduce((sum, f) => sum + f.quantity, 0)})
                            </span>
                        </label>
                        {currentFurniture.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                                <div className="text-gray-500 text-sm">
                                    Keine Möbel hinzugefügt. Wählen Sie Möbel aus der Liste links aus.
                                </div>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                                <div className="divide-y divide-gray-200">
                                    {currentFurniture.map((f) => (
                                        <div
                                            key={f.item.name}
                                            className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 gap-2"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                <i className={`${f.item.icon} text-lg sm:text-xl text-gray-600 flex-shrink-0`}></i>
                                                <span className="font-medium text-gray-800 text-sm sm:text-base break-words">{f.item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(f.item.name, -1)}
                                                    className="btn btn-sm btn-circle btn-ghost"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{f.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(f.item.name, 1)}
                                                    className="btn btn-sm btn-circle btn-ghost"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFurniture(f.item.name)}
                                                    className="btn btn-sm btn-ghost text-red-500 ml-1 sm:ml-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Furniture Modal */}
            {showCustomFurnitureModal && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => {
                        setShowCustomFurnitureModal(false);
                        setCustomFurnitureName('');
                        setCustomFurnitureVolume(0.5);
                    }}
                >
                    <div
                        className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words pr-2">Möbelstück selbst anlegen</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomFurnitureModal(false);
                                    setCustomFurnitureName('');
                                    setCustomFurnitureVolume(0.5);
                                }}
                                className="btn btn-lg btn-circle btn-ghost hover:bg-gray-100"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Name des Möbelstücks</span>
                                </label>
                                <input
                                    type="text"
                                    value={customFurnitureName}
                                    onChange={(e) => setCustomFurnitureName(e.target.value)}
                                    placeholder="z.B. Antiker Schrank"
                                    className="input input-bordered w-full"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && customFurnitureName.trim()) {
                                            addCustomFurniture();
                                        }
                                    }}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Volumen (m³)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={customFurnitureVolume}
                                    onChange={(e) => setCustomFurnitureVolume(parseFloat(e.target.value) || 0)}
                                    className="input input-bordered w-full"
                                    placeholder="0.5"
                                />
                                <label className="label">
                                    <span className="label-text-alt text-gray-500">
                                        Geschätztes Volumen des Möbelstücks in Kubikmetern
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4 sm:mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomFurnitureModal(false);
                                    setCustomFurnitureName('');
                                    setCustomFurnitureVolume(0.5);
                                }}
                                className="btn btn-sm sm:btn-lg btn-outline px-4 sm:px-8 text-sm sm:text-base w-full sm:w-auto"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={addCustomFurniture}
                                disabled={!customFurnitureName.trim()}
                                className="btn btn-sm sm:btn-lg btn-primary px-4 sm:px-8 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                Hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Selection Modal */}
            {
                showRoomModal && (
                    <div
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
                        onClick={() => setShowRoomModal(false)}
                    >
                        <div
                            className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words pr-2">Räume hinzufügen</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowRoomModal(false)}
                                    className="btn btn-lg btn-circle btn-ghost hover:bg-gray-100"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 mb-6 md:mb-8">
                                {catalog.rooms.map((room) => {
                                    const isSelected = tempSelectedRooms.some(r => r.name === room.name);
                                    return (
                                        <button
                                            key={room.name}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setTempSelectedRooms(tempSelectedRooms.filter(r => r.name !== room.name));
                                                } else {
                                                    setTempSelectedRooms([...tempSelectedRooms, room]);
                                                }
                                            }}
                                            className={`btn h-auto py-4 sm:py-6 lg:py-8 flex flex-col items-center gap-2 sm:gap-3 lg:gap-4 border-2 transition-all ${isSelected
                                                ? 'btn-primary border-primary shadow-lg hover:shadow-xl text-sm sm:text-base lg:text-lg'
                                                : 'btn-outline border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md text-xs sm:text-sm lg:text-base'
                                                }`}
                                        >
                                            <i className={`${room.icon} text-2xl sm:text-3xl lg:text-4xl`}></i>
                                            <span className="font-semibold text-center break-words px-1">{room.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRoomModal(false)}
                                    className="btn btn-lg btn-outline px-8 text-base"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onRoomsChange) {
                                            onRoomsChange(tempSelectedRooms);
                                        }
                                        // Update active room if current one was removed
                                        if (activeRoom && !tempSelectedRooms.some(r => r.name === activeRoom.name)) {
                                            setActiveRoom(tempSelectedRooms[0] || null);
                                        } else if (!activeRoom && tempSelectedRooms.length > 0) {
                                            setActiveRoom(tempSelectedRooms[0]);
                                        }
                                        setShowRoomModal(false);
                                    }}
                                    className="btn btn-lg btn-primary px-8 text-base"
                                >
                                    Speichern
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
