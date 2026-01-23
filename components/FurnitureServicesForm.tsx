'use client';

import { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { RoomType, FurnitureItem } from '../types/form';
import FormHeader from './FormHeader';
import Dropdown, { DropdownOption } from './Dropdown';

interface RoomFurniture {
    room: RoomType;
    furniture: Array<{
        item: FurnitureItem;
        quantity: number;
    }>;
}

interface FurnitureService {
    item: FurnitureItem;
    disassembly: number; // Quantity for disassembly
    assembly: number; // Quantity for assembly
}

interface RoomServices {
    room: RoomType;
    services: FurnitureService[];
}

interface FurnitureServicesFormProps {
    selectedRooms: RoomType[];
    roomFurniture: RoomFurniture[]; // Furniture selected per room
    initialServices?: RoomServices[]; // Previously selected services
    onBack: () => void;
    onSave: (services: RoomServices[]) => void;
}

export default function FurnitureServicesForm({
    selectedRooms,
    roomFurniture,
    initialServices = [],
    onBack,
    onSave,
}: FurnitureServicesFormProps) {
    // Helper function to check if item requires assembly/disassembly
    const requiresAssemblyDisassembly = (item: FurnitureItem | undefined): boolean => {
        return item?.requires_assembly_disassembly === true;
    };

    // Initialize activeRoom to first room with items that require assembly/disassembly
    const getInitialActiveRoom = (): RoomType | null => {
        const roomsWithItems = selectedRooms.filter(room => {
            const furniture = roomFurniture.find(rf => rf.room.name === room.name);
            return furniture && furniture.furniture.some(f => f.item && requiresAssemblyDisassembly(f.item));
        });
        return roomsWithItems[0] || null;
    };

    const [activeRoom, setActiveRoom] = useState<RoomType | null>(getInitialActiveRoom());
    const [roomServices, setRoomServices] = useState<RoomServices[]>(initialServices);

    // Initialize services from roomFurniture if not already set
    useEffect(() => {
        setRoomServices(prev => {
            const newServices: RoomServices[] = selectedRooms.map(room => {
                const existing = prev.find(rs => rs.room.name === room.name);
                if (existing) {
                    // Filter existing services to only items that require assembly/disassembly
                    return {
                        ...existing,
                        services: existing.services.filter(s => s.item && requiresAssemblyDisassembly(s.item))
                    };
                }

                const furniture = roomFurniture.find(rf => rf.room.name === room.name);

                // Filter to only items that require assembly/disassembly
                const services: FurnitureService[] = (furniture?.furniture || [])
                    .filter(f => f.item && requiresAssemblyDisassembly(f.item))
                    .map(f => ({
                        item: f.item,
                        disassembly: 0,
                        assembly: 0,
                    }));

                return { room, services };
            });

            // Remove services for rooms that are no longer selected
            return newServices.filter(rs =>
                selectedRooms.some(sr => sr.name === rs.room.name)
            );
        });
    }, [selectedRooms, roomFurniture]);

    // Set active room if current one is removed or doesn't have items requiring assembly/disassembly
    useEffect(() => {
        const roomsWithAssemblyItems = selectedRooms.filter(room => {
            const furniture = roomFurniture.find(rf => rf.room.name === room.name);
            return furniture && furniture.furniture.some(f => f.item && requiresAssemblyDisassembly(f.item));
        });

        if (activeRoom) {
            const furniture = roomFurniture.find(rf => rf.room.name === activeRoom.name);
            const hasAssemblyItems = furniture && furniture.furniture.some(f => f.item && requiresAssemblyDisassembly(f.item));

            if (!selectedRooms.some(r => r.name === activeRoom.name) || !hasAssemblyItems) {
                setActiveRoom(roomsWithAssemblyItems[0] || null);
            }
        } else if (roomsWithAssemblyItems.length > 0) {
            setActiveRoom(roomsWithAssemblyItems[0]);
        }
    }, [selectedRooms, activeRoom, roomFurniture]);

    // Save services when they change
    useEffect(() => {
        onSave(roomServices);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomServices]);

    const getServicesForRoom = (roomName: string): FurnitureService[] => {
        return roomServices.find(rs => rs.room.name === roomName)?.services || [];
    };

    const areAllSelected = (room: RoomType, type: 'disassembly' | 'assembly'): boolean => {
        const furniture = roomFurniture.find(rf => rf.room.name === room.name);
        if (!furniture) return false;

        // Filter to only items that require assembly/disassembly
        const assemblyFurniture = furniture.furniture.filter(f => f.item && requiresAssemblyDisassembly(f.item));
        if (assemblyFurniture.length === 0) return false;

        const services = getServicesForRoom(room.name);
        return services.every(s => {
            const furnitureItem = assemblyFurniture.find(f => f.item.name === s.item.name);
            const maxQuantity = furnitureItem?.quantity || 0;
            return s[type] === maxQuantity && maxQuantity > 0;
        });
    };

    const updateService = (room: RoomType, itemName: string, type: 'disassembly' | 'assembly', value: number) => {
        setRoomServices(prev => {
            const roomService = prev.find(rs => rs.room.name === room.name);
            if (!roomService) return prev;

            const updatedServices = roomService.services.map(s =>
                s.item.name === itemName ? { ...s, [type]: value } : s
            );

            return prev.map(rs =>
                rs.room.name === room.name ? { ...rs, services: updatedServices } : rs
            );
        });
    };

    const selectAllForRoom = (room: RoomType, type: 'disassembly' | 'assembly') => {
        const furniture = roomFurniture.find(rf => rf.room.name === room.name);
        if (!furniture) return;

        setRoomServices(prev => {
            const roomService = prev.find(rs => rs.room.name === room.name);
            if (!roomService) return prev;

            // Filter to only items that require assembly/disassembly
            const assemblyFurniture = furniture.furniture.filter(f => f.item && requiresAssemblyDisassembly(f.item));

            const updatedServices = roomService.services.map(s => {
                const furnitureItem = assemblyFurniture.find(f => f.item.name === s.item.name);
                const maxQuantity = furnitureItem?.quantity || 0;
                return { ...s, [type]: maxQuantity };
            });

            return prev.map(rs =>
                rs.room.name === room.name ? { ...rs, services: updatedServices } : rs
            );
        });
    };

    const getQuantityOptions = (maxQuantity: number): DropdownOption<number>[] => {
        const options: DropdownOption<number>[] = [];
        for (let i = 0; i <= maxQuantity; i++) {
            options.push({ label: i.toString(), value: i });
        }
        return options;
    };

    if (!activeRoom) {
        return (
            <div className="space-y-6">
                <div className="alert alert-info">
                    <span>Bitte wählen Sie zuerst Räume aus.</span>
                </div>
            </div>
        );
    }

    const currentServices = getServicesForRoom(activeRoom.name);
    const furniture = roomFurniture.find(rf => rf.room.name === activeRoom.name);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <FormHeader title="Wählen Sie die Services für Ihre Möbel pro Raum aus" />
            </div>

            {/* Room Tabs - Only show rooms that have kitchen/lamp furniture */}
            <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2">
                {selectedRooms
                    .filter(room => {
                        const furniture = roomFurniture.find(rf => rf.room.name === room.name);
                        return furniture && furniture.furniture.some(f => f.item && requiresAssemblyDisassembly(f.item));
                    })
                    .map((room) => {
                        const isActive = activeRoom?.name === room.name;
                        const roomService = getServicesForRoom(room.name);
                        const totalServices = roomService.reduce(
                            (sum, s) => sum + s.disassembly + s.assembly,
                            0
                        );
                        return (
                            <button
                                key={room.name}
                                type="button"
                                onClick={() => setActiveRoom(room)}
                                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all relative flex-shrink-0 ${isActive
                                    ? 'btn-primary border-primary hover:border-primary/90'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <i className={`${room.icon} text-lg sm:text-xl`}></i>
                                <span className="font-medium text-sm sm:text-base whitespace-nowrap">{room.label}</span>
                            </button>
                        );
                    })}
            </div>

            {/* Assembly Services Section */}
            {(currentServices.length > 0 || (furniture && furniture.furniture.some(f => f.item && requiresAssemblyDisassembly(f.item)))) && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 break-words">
                                Montagearbeiten - {activeRoom.label}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                                Sie können auswählen, welche Möbel auf- und abgebaut werden sollen
                            </p>
                        </div>

                    </div>

                    {/* Table Structure */}
                    <div className="pl-0 sm:pl-6 lg:pl-12 rounded-lg overflow-x-auto">
                        {/* Table Header Row */}
                        <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] lg:grid-cols-[1fr_120px_120px] gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 border-b border-gray-200 min-w-[400px]">
                            <div></div> {/* empty div to maintain grid structure */}
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-sm font-semibold text-gray-700">Abbau</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                        checked={areAllSelected(activeRoom, 'disassembly')}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            if (e.target.checked) {
                                                selectAllForRoom(activeRoom, 'disassembly');
                                            } else {
                                                currentServices.forEach(s => {
                                                    updateService(activeRoom, s.item.name, 'disassembly', 0);
                                                });
                                            }
                                        }}
                                    />
                                    <span className="label-text text-xs">Alle</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-sm font-semibold text-gray-700">Aufbau</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                        checked={areAllSelected(activeRoom, 'assembly')}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            if (e.target.checked) {
                                                selectAllForRoom(activeRoom, 'assembly');
                                            } else {
                                                currentServices.forEach(s => {
                                                    updateService(activeRoom, s.item.name, 'assembly', 0);
                                                });
                                            }
                                        }}
                                    />
                                    <span className="label-text text-xs">Alle</span>
                                </div>
                            </div>
                        </div>

                        {/* Furniture Items */}
                        <div>
                            {currentServices.length > 0 ? (
                                currentServices.map((service, index) => {
                                    const furnitureItem = furniture?.furniture.find(f => f.item.name === service.item.name);
                                    const maxQuantity = furnitureItem?.quantity || 0;
                                    const disassemblyValue = service.disassembly;
                                    const assemblyValue = service.assembly;
                                    const isLast = index === currentServices.length - 1;

                                    return (
                                        <div
                                            key={service.item.name}
                                            className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] lg:grid-cols-[1fr_120px_120px] gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 items-center ${isLast ? '' : 'border-b border-gray-200'} min-w-[400px]`}
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                <i className={`${service.item.icon} text-xl sm:text-2xl text-gray-600 flex-shrink-0`}></i>
                                                <div className="font-medium text-gray-800 text-sm sm:text-base break-words">
                                                    {furnitureItem?.quantity}x {service.item.label}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <Dropdown
                                                    options={getQuantityOptions(maxQuantity)}
                                                    value={disassemblyValue}
                                                    onChange={(value) =>
                                                        updateService(activeRoom, service.item.name, 'disassembly', value)
                                                    }
                                                    placeholder="0"
                                                    className="w-16 sm:w-20"
                                                />
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <Dropdown
                                                    options={getQuantityOptions(maxQuantity)}
                                                    value={assemblyValue}
                                                    onChange={(value) =>
                                                        updateService(activeRoom, service.item.name, 'assembly', value)
                                                    }
                                                    placeholder="0"
                                                    className="w-16 sm:w-20"
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    Keine Küchen- oder Lampenmöbel in diesem Raum vorhanden.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Comments Section */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text flex items-center gap-2">
                        Gibt es zusätzliche Anmerkungen?
                        <div className="tooltip" data-tip="Zusätzliche Informationen zu den Dienstleistungen">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center cursor-help">
                                <span className="text-blue-600 text-xs font-bold">i</span>
                            </div>
                        </div>
                    </span>
                </label>
                <textarea
                    className="textarea textarea-bordered w-full min-h-[100px]"
                    placeholder="Zusätzliche Informationen zu den Dienstleistungen"
                />
            </div>
        </div>
    );
}

