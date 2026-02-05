'use client';

import { useState, useEffect, useCallback } from 'react';
import { CustomerForm, Location, GoodsRoom, GoodsItem } from '@/types/form';
import {
  AlertCircle,
  Loader2, ChevronLeft, ChevronRight, Check, X
} from 'lucide-react';
import AddressInputForm from './AddressInputForm';
import AddressDetailsForm from './AddressDetailsForm';
import ContactForm from './ContactForm';
import ServicesForm from './ServicesForm';
import StorageForm from './StorageForm';
import CartonageForm from './CartonageForm';
import ThankYouScreen from './ThankYouScreen';
import RoomSelectionForm from './RoomSelectionForm';
import RoomFurnitureSelection from './RoomFurnitureSelection';
import FurnitureServicesForm from './FurnitureServicesForm';
import FormHeader from './FormHeader';

// Get API URL from environment variable
// In production (Vercel), this should be set to your HTTPS backend URL
// e.g., https://31.220.74.62 or https://your-domain.com
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:4001'
    : ''); // Empty string will cause error if not set in production

if (!API_URL && typeof window !== 'undefined') {
  console.error('NEXT_PUBLIC_API_URL environment variable is not set!');
}

// Step Group Configuration
type StepGroupId = 'addresses' | 'contact' | 'storage' | 'goods' | 'cartonage' | 'services' | 'review';

type SubStepId =
  | 'from_address'
  | 'from_address_details'
  | 'to_address'
  | 'to_address_details'
  | 'contact'
  | 'storage'
  | 'room_selection'
  | 'furniture_selection'
  | 'furniture_services'
  | 'cartonage'
  | 'services'
  | 'review';

interface StepGroup {
  id: StepGroupId;
  label: string;
  subSteps: SubStepId[];
  isConditional?: (formData: Partial<CustomerForm>) => boolean;
}

const STEP_GROUPS: StepGroup[] = [
  {
    id: 'addresses',
    label: 'Adressen',
    subSteps: ['from_address', 'from_address_details', 'to_address', 'to_address_details'],
  },
  {
    id: 'contact',
    label: 'Kontakt',
    subSteps: ['contact'],
  },

  {
    id: 'storage',
    label: 'Einlagerung',
    subSteps: ['storage'],
    isConditional: (formData) => {
      // Only show storage if dates differ
      return !!(formData.moving_out_date && formData.moving_in_date && formData.moving_out_date !== formData.moving_in_date);
    },
  },
  {
    id: 'goods',
    label: 'Möbel',
    subSteps: ['room_selection', 'furniture_selection', 'furniture_services'],
  },
  {
    id: 'cartonage',
    label: 'Kartonagen',
    subSteps: ['cartonage'],
  },
  {
    id: 'services',
    label: 'Extras',
    subSteps: ['services'],
  },
  {
    id: 'review',
    label: 'Zusammenfassung',
    subSteps: ['review'],
  },
];

const STORAGE_KEY = 'moving-form-data';
const STORAGE_STEP_KEY = 'moving-form-step';

export default function MovingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showManualCbmModal, setShowManualCbmModal] = useState(false);
  const [manualCbmValue, setManualCbmValue] = useState<string>('');

  // Default form state
  const getDefaultFormData = (): Partial<CustomerForm & {
    customer_name_obj?: { firstName: string; lastName: string };
    customer_title?: string;
    goods_text_input?: string;
    goods_photos?: File[];
    goods_volume_method?: string | null;
    furniture_selected_rooms?: any[];
    furniture_assembly?: any[];
    furniture_services?: any[];
  }> => ({
    customer_name: '',
    customer_name_obj: { firstName: '', lastName: '' },
    customer_title: '',
    customer_email: '',
    customer_phone: '',
    from_location: {
      address: '',
      object_type: 'Wohnung',
      floor: 0,
      living_space_m2: 0,
      has_elevator: false,
      needs_parking_zone: false,
      walkway_m: 0,
    },
    to_location: {
      address: '',
      object_type: 'Wohnung',
      floor: 0,
      living_space_m2: 0,
      has_elevator: false,
      needs_parking_zone: false,
      walkway_m: 0,
    },
    services: {
      carton_pack: false,
      carton_unpack: false,
      furniture_disassembly: false,
      furniture_assembly: false,
      lamps_disassembly: false,
      number_of_lamps_to_disassemble: 0,
      lamps_assembly: false,
      number_of_lamps_to_assemble: 0,
      kitchen_disassembly: false,
      kitchen_assembly: false,
      storage: false,
    },
    goods: [],
    total_volume_m3: 0,
    moving_out_date: '',
    moving_in_date: '',
    storage_info: null,
    notes: '',

    goods_text_input: '',
    goods_photos: [],
    goods_volume_method: null,
    cartonage_info: null,
    furniture_selected_rooms: [],
    furniture_assembly: [],
    furniture_services: [],
  });

  // Form state - all data persists across steps
  const [formData, setFormData] = useState<Partial<CustomerForm>>(getDefaultFormData);
  const [currentStepGroupIndex, setCurrentStepGroupIndex] = useState(0);
  const [currentSubStepIndex, setCurrentSubStepIndex] = useState(0);
  const [visitedStepGroups, setVisitedStepGroups] = useState<Set<number>>(new Set([0]));
  const [visitedSubSteps, setVisitedSubSteps] = useState<Set<string>>(new Set(['from_address'])); // Track visited substeps as "groupIndex:subStepIndex"
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get visible step groups (filter out conditional ones that don't apply)
  const getVisibleStepGroups = (): StepGroup[] => {
    return STEP_GROUPS.filter(group => {
      if (group.isConditional) {
        return group.isConditional(formData);
      }
      return true;
    });
  };

  // Get current step group
  const getCurrentStepGroup = (): StepGroup | null => {
    const visibleGroups = getVisibleStepGroups();
    return visibleGroups[currentStepGroupIndex] || null;
  };

  // Get current sub-step
  const getCurrentSubStep = (): SubStepId | null => {
    const currentGroup = getCurrentStepGroup();
    if (!currentGroup) return null;
    return currentGroup.subSteps[currentSubStepIndex] || null;
  };

  const goToSubStep = (groupIndex: number, subStepId: number): void => {
    const visibleGroup = getVisibleStepGroups();
    if (groupIndex >= 0 && groupIndex < visibleGroup.length) {
      const group = visibleGroup[groupIndex];
      if (subStepId >= 0 && subStepId < group.subSteps.length) {
        // Use helper function to get correct sub-step index (handles furniture_services skipping)
        const correctedIndex = group.id === 'goods'
          ? getGoodsGroupSubStepIndex(group, subStepId)
          : subStepId;

        setCurrentStepGroupIndex(groupIndex);
        setCurrentSubStepIndex(correctedIndex);
        setVisitedStepGroups(prev => new Set([...prev, groupIndex]));
        // Mark this substep as visited
        const subStepKey = `${groupIndex}:${subStepId}`;
        setVisitedSubSteps(prev => new Set([...prev, subStepKey]));
      }
    }
  };

  const isSubStepVisible = (groupIndex: number, subStepId: number) => {
    const visibleGroup = getVisibleStepGroups();
    if (groupIndex >= 0 && groupIndex < visibleGroup.length) {
      const group = visibleGroup[groupIndex];
      if (subStepId >= 0 && subStepId < group.subSteps.length) {
        const subStepKey = `${groupIndex}:${subStepId}`;
        // A substep is visible if:
        // 1. The group has been visited AND
        // 2. Either we've visited this specific substep, or we're currently past it
        return visitedStepGroups.has(groupIndex) && (
          visitedSubSteps.has(subStepKey) ||
          currentStepGroupIndex > groupIndex ||
          (currentStepGroupIndex === groupIndex && currentSubStepIndex >= subStepId)
        );
      }
    }
    return false;
  }

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper function to convert base64 to File
  const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Load form data and step from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STORAGE_STEP_KEY);

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);

          // Convert base64 photo strings back to File objects
          if (parsedData.goods_photos && Array.isArray(parsedData.goods_photos)) {
            parsedData.goods_photos = parsedData.goods_photos.map((photo: any) => {
              if (typeof photo === 'string' && photo.startsWith('data:')) {
                const match = photo.match(/data:(.*?);base64,(.*)/);
                if (match) {
                  const mimeType = match[1];
                  const extension = mimeType.split('/')[1] || 'jpg';
                  return base64ToFile(photo, `photo.${extension}`, mimeType);
                }
              }
              return photo;
            });
          }

          setFormData(parsedData);
        } catch (error) {
          console.error('Error loading form data from localStorage:', error);
        }
      }

      if (savedStep) {
        try {
          const stepData = JSON.parse(savedStep);
          const groupIndex = stepData.groupIndex || 0;
          const subStepIndex = stepData.subStepIndex || 0;
          setCurrentStepGroupIndex(groupIndex);
          setCurrentSubStepIndex(subStepIndex);
          // Mark current substep as visited
          const subStepKey = `${groupIndex}:${subStepIndex}`;
          setVisitedSubSteps(new Set([subStepKey]));
        } catch (error) {
          console.error('Error loading step from localStorage:', error);
        }
      }

      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && !isSubmitted) {
      const saveFormData = async () => {
        try {
          const dataToSave: any = { ...formData };

          if (dataToSave.goods_photos && Array.isArray(dataToSave.goods_photos)) {
            const base64Photos = await Promise.all(
              dataToSave.goods_photos.map(async (photo: File) => {
                if (photo instanceof File) {
                  try {
                    return await fileToBase64(photo);
                  } catch (error) {
                    console.error('Error converting photo to base64:', error);
                    return null;
                  }
                }
                return photo;
              })
            );
            dataToSave.goods_photos = base64Photos.filter((photo: any) => photo !== null);
          }

          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (error) {
          console.error('Error saving form data to localStorage:', error);
        }
      };

      saveFormData();
    }
  }, [formData, isInitialized, isSubmitted]);

  // Recalculate step groups when formData changes (e.g., dates change)
  useEffect(() => {
    if (isInitialized) {
      const visibleGroups = STEP_GROUPS.filter(group => {
        if (group.isConditional) {
          return group.isConditional(formData);
        }
        return true;
      });
      // Ensure current step group index is valid
      if (currentStepGroupIndex >= visibleGroups.length) {
        setCurrentStepGroupIndex(Math.max(0, visibleGroups.length - 1));
        return; // Exit early to avoid checking sub-steps with invalid group
      }
      // Ensure current sub-step index is valid
      const currentGroup = visibleGroups[currentStepGroupIndex];
      if (currentGroup && currentSubStepIndex >= currentGroup.subSteps.length) {
        setCurrentSubStepIndex(Math.max(0, currentGroup.subSteps.length - 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.moving_out_date, formData.moving_in_date, isInitialized]);

  // Save current step to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && !isSubmitted) {
      try {
        localStorage.setItem(STORAGE_STEP_KEY, JSON.stringify({
          groupIndex: currentStepGroupIndex,
          subStepIndex: currentSubStepIndex,
        }));
      } catch (error) {
        console.error('Error saving step to localStorage:', error);
      }
    }
  }, [currentStepGroupIndex, currentSubStepIndex, isInitialized, isSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const nameObj = (formData as any).customer_name_obj;
      if (!(formData as any).customer_title || !nameObj?.firstName || !nameObj?.lastName || !formData.customer_email || !formData.customer_phone) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus.');
      }

      if (!isValidEmail(formData.customer_email)) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      }

      if (!isValidPhoneNumber(formData.customer_phone)) {
        throw new Error('Bitte geben Sie eine gültige Telefonnummer ein.');
      }

      if (!formData.from_location?.address || !formData.to_location?.address) {
        throw new Error('Bitte geben Sie beide Adressen an.');
      }

      if (!formData.moving_out_date || !formData.moving_in_date) {
        throw new Error('Bitte geben Sie beide Umzugsdaten an.');
      }

      // Validate that moving_in_date is not earlier than moving_out_date
      const outDate = parseDate(formData.moving_out_date);
      const inDate = parseDate(formData.moving_in_date);
      if (outDate && inDate && inDate < outDate) {
        throw new Error('Das Einzugsdatum darf nicht vor dem Auszugsdatum liegen.');
      }

      // Calculate volume from furniture_assembly (same logic as review section)
      const furnitureAssembly = (formData as any).furniture_assembly || [];
      let calculatedVolumeFromFurniture = 0;

      furnitureAssembly.forEach((roomFurniture: any) => {
        const furniture = roomFurniture.furniture || [];
        furniture.forEach((f: any) => {
          const itemVolume = f.item?.volume_m3 || 0;
          const quantity = f.quantity || 0;
          calculatedVolumeFromFurniture += itemVolume * quantity;
        });
      });

      // Calculate volume from existing goods array
      const calculatedVolumeFromGoods = (formData.goods || []).reduce((sum: number, room: GoodsRoom) => {
        return sum + (room.volume_m3 || 0);
      }, 0);

      // Use calculated volume from furniture if available, otherwise from goods, otherwise manual input
      const totalVolume = calculatedVolumeFromFurniture > 0
        ? calculatedVolumeFromFurniture
        : (calculatedVolumeFromGoods > 0
          ? calculatedVolumeFromGoods
          : (formData.total_volume_m3 || 0));

      // Convert furniture_assembly to goods format for backend
      // Only include rooms that have furniture items
      const goodsFromFurniture: GoodsRoom[] = furnitureAssembly
        .filter((roomFurniture: any) => {
          const furniture = roomFurniture.furniture || [];
          return furniture.length > 0 && furniture.some((f: any) => f.item && (f.quantity || 0) > 0);
        })
        .map((roomFurniture: any) => {
          const furniture = roomFurniture.furniture || [];
          const items: GoodsItem[] = furniture
            .filter((f: any) => f.item && (f.quantity || 0) > 0)
            .map((f: any) => ({
              description: f.item?.label || f.item?.name || 'Unknown item',
              quantity: f.quantity || 0,
              volume_per_item_m3: f.item?.volume_m3 || 0,
            }));

          // Calculate room volume as sum of (volume_per_item_m3 * quantity) for all items
          const roomVolume = items.reduce((sum: number, item: GoodsItem) => {
            return sum + (item.volume_per_item_m3 * item.quantity);
          }, 0);

          return {
            name: roomFurniture.room?.name || 'unknown',
            items: items,
            volume_m3: roomVolume,
          };
        });

      // Use goods from furniture_assembly if it has items, otherwise use existing goods
      const finalGoods = goodsFromFurniture.length > 0
        ? goodsFromFurniture
        : (formData.goods || []);

      const fullName = nameObj
        ? `${nameObj.firstName} ${nameObj.lastName}`.trim()
        : formData.customer_name || '';

      const payload: CustomerForm = {
        customer_name: fullName,
        customer_email: formData.customer_email!,
        customer_phone: formData.customer_phone!,
        from_location: formData.from_location!,
        to_location: formData.to_location!,
        services: formData.services!,
        goods: finalGoods,
        total_volume_m3: totalVolume,
        moving_out_date: formData.moving_out_date!,
        moving_in_date: formData.moving_in_date!,
        notes: formData.notes || null,
        // storage_info and cartonage_info temporarily excluded until backend support is added
      };

      if (!API_URL) {
        throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable in Vercel.');
      }

      const response = await fetch(`${API_URL}/api/submit-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let error;
        try {
          const errorText = await response.text();
          // Try to parse as JSON, fallback to text
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: errorText || `Server error: ${response.status} ${response.statusText}` };
          }
        } catch (e) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error(error.detail?.error || error.error || 'Fehler beim Senden der Anfrage');
      }

      const result = await response.json();
      console.log('Request ID:', result.request_id);
      setIsSubmitted(true);

      // Don't clear localStorage on success - allows resubmission if needed
      // User can manually clear or start a new form
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
      });
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const currentGroup = getCurrentStepGroup();
    if (!currentGroup) return;

    const visibleGroups = getVisibleStepGroups();

    // Special handling for goods group: skip furniture sub-steps if not visited
    if (currentGroup.id === 'goods') {

      // If on room_selection, go to furniture_selection
      if (currentSubStep === 'room_selection') {
        const furnitureSelectionIndex = currentGroup.subSteps.indexOf('furniture_selection');
        if (furnitureSelectionIndex >= 0) {
          const subStepKey = `${currentStepGroupIndex}:${furnitureSelectionIndex}`;
          setCurrentSubStepIndex(furnitureSelectionIndex);
          setVisitedSubSteps(prev => new Set([...prev, subStepKey]));
          return;
        }
      }

      // If on furniture_selection, validate that furniture items exist
      if (currentSubStep === 'furniture_selection') {
        const furnitureAssembly = (formData as any).furniture_assembly || [];
        const hasFurnitureItems = furnitureAssembly.some((rf: any) => {
          const furniture = rf.furniture || [];
          return furniture.length > 0 && furniture.some((f: any) => f.item && (f.quantity || 0) > 0);
        });

        // If no furniture items, show modal for manual CBM input
        if (!hasFurnitureItems) {
          setShowManualCbmModal(true);
          return;
        }

        proceedFromFurnitureSelection();
        return;
      }
    }

    // Check if there's a next sub-step in current group
    if (currentSubStepIndex < currentGroup.subSteps.length - 1) {
      const nextSubStepIndex = currentSubStepIndex + 1;
      const subStepKey = `${currentStepGroupIndex}:${nextSubStepIndex}`;
      setCurrentSubStepIndex(nextSubStepIndex);
      setVisitedSubSteps(prev => new Set([...prev, subStepKey]));
      return;
    }

    // Move to next group
    if (currentStepGroupIndex < visibleGroups.length - 1) {
      const nextGroupIndex = currentStepGroupIndex + 1;
      const nextSubStepKey = `${nextGroupIndex}:0`;
      setCurrentStepGroupIndex(nextGroupIndex);
      setCurrentSubStepIndex(0);
      setVisitedStepGroups(prev => new Set([...prev, nextGroupIndex]));
      setVisitedSubSteps(prev => new Set([...prev, nextSubStepKey]));
    }
  };

  const prevStep = () => {
    const currentGroup = getCurrentStepGroup();
    if (!currentGroup) return;

    const visibleGroups = getVisibleStepGroups();
    const currentSubStep = getCurrentSubStep();

    // Special handling for goods group
    if (currentGroup.id === 'goods') {
      const roomSelectionIndex = currentGroup.subSteps.indexOf('room_selection');
      const furnitureSelectionIndex = currentGroup.subSteps.indexOf('furniture_selection');
      const hasFurnitureRooms = (formData as any).furniture_selected_rooms?.length > 0;

      // If on room_selection, go back to previous group (it's the first step in goods group)
      if (currentSubStep === 'room_selection') {
        if (currentStepGroupIndex > 0) {
          const prevGroup = visibleGroups[currentStepGroupIndex - 1];
          setCurrentStepGroupIndex(currentStepGroupIndex - 1);
          setCurrentSubStepIndex(prevGroup.subSteps.length - 1);
        }
        return;
      }
      // If on furniture_selection and rooms are selected, go back to room_selection
      if (currentSubStep === 'furniture_selection' && hasFurnitureRooms && roomSelectionIndex >= 0) {
        setCurrentSubStepIndex(roomSelectionIndex);
        return;
      }

      const kitchenOrLampItems = hasKitchenOrLampItems();
      // If on furniture_services, go back to furniture_selection (if rooms selected) or previous substep
      if (currentSubStep === 'furniture_services' && hasFurnitureRooms && kitchenOrLampItems && furnitureSelectionIndex >= 0) {
        setCurrentSubStepIndex(furnitureSelectionIndex);
        return;
      }
    }

    // Check if there's a previous sub-step in current group
    if (currentSubStepIndex > 0) {
      setCurrentSubStepIndex(currentSubStepIndex - 1);
      return;
    }

    // Move to previous group
    if (currentStepGroupIndex > 0) {
      const prevGroup = visibleGroups[currentStepGroupIndex - 1];

      setCurrentStepGroupIndex(currentStepGroupIndex - 1);

      // Use helper function to get correct sub-step index (handles furniture_services skipping for goods group)
      const targetIndex = prevGroup.subSteps.length - 1;
      const correctedIndex = prevGroup.id === 'goods'
        ? getGoodsGroupSubStepIndex(prevGroup, targetIndex)
        : targetIndex;

      setCurrentSubStepIndex(correctedIndex);
    }
  };

  const goToStepGroup = (groupIndex: number) => {
    const visibleGroups = getVisibleStepGroups();
    if (groupIndex >= 0 && groupIndex < visibleGroups.length && visitedStepGroups.has(groupIndex)) {
      const subStepKey = `${groupIndex}:0`;
      setCurrentStepGroupIndex(groupIndex);
      setCurrentSubStepIndex(0);
      setVisitedStepGroups(prev => new Set([...prev, groupIndex]));
      setVisitedSubSteps(prev => new Set([...prev, subStepKey]));
    }
  };

  // Helper function to parse DD-MM-YYYY date string and compare dates
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const isMovingInDateAfterMovingOutDate = (): boolean => {
    if (!formData.moving_out_date || !formData.moving_in_date) return true; // Let other validation handle missing dates
    const outDate = parseDate(formData.moving_out_date);
    const inDate = parseDate(formData.moving_in_date);
    if (!outDate || !inDate) return true; // Invalid format, let other validation handle
    return inDate >= outDate;
  };

  // Phone number validation function
  const isValidPhoneNumber = (phone: string | undefined): boolean => {
    if (!phone || phone.trim().length === 0) return false;

    // Remove common formatting characters (spaces, dashes, parentheses, plus signs)
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

    // Check if it contains only digits (and possibly leading zeros or country codes)
    if (!/^\d+$/.test(cleaned)) return false;

    // Must have at least 6 digits (minimum reasonable phone number length)
    // and at most 15 digits (E.164 maximum)
    const digitCount = cleaned.length;
    return digitCount >= 6 && digitCount <= 15;
  };

  // Email validation function
  const isValidEmail = (email: string | undefined): boolean => {
    if (!email || email.trim().length === 0) return false;

    // Basic email regex pattern
    // Allows: local@domain format
    // Local part: letters, numbers, dots, hyphens, underscores, plus signs
    // Domain part: letters, numbers, dots, hyphens
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return emailRegex.test(email.trim());
  };

  const canProceed = (): boolean => {
    const currentSubStep = getCurrentSubStep();
    if (!currentSubStep) return false;

    switch (currentSubStep) {
      case 'from_address':
        const fromLoc = formData.from_location;
        return !!(
          fromLoc?.street_name &&
          fromLoc?.house_number &&
          fromLoc?.city &&
          fromLoc?.postal_code &&
          fromLoc?.country &&
          formData.moving_out_date
        );
      case 'from_address_details':
        // Address details are required
        const fromLocDetails = formData.from_location;
        return !!(
          fromLocDetails?.object_type &&
          fromLocDetails?.floor !== undefined &&
          fromLocDetails?.has_elevator !== undefined &&
          fromLocDetails?.living_space_m2 !== undefined &&
          fromLocDetails?.walkway_m !== undefined &&
          fromLocDetails?.living_space_m2 > 0
        );
      case 'to_address':
        const toLoc = formData.to_location;
        const hasValidToAddress = !!(
          toLoc?.street_name &&
          toLoc?.house_number &&
          toLoc?.city &&
          toLoc?.postal_code &&
          toLoc?.country &&
          formData.moving_in_date
        );
        // Also validate that moving_in_date is not earlier than moving_out_date
        return hasValidToAddress && isMovingInDateAfterMovingOutDate();
      case 'to_address_details':
        // Address details are required
        const toLocDetails = formData.to_location;
        return !!(
          toLocDetails?.object_type &&
          toLocDetails?.floor !== undefined &&
          toLocDetails?.has_elevator !== undefined &&
          toLocDetails?.walkway_m !== undefined
        );
      case 'contact':
        const customerNameObj = (formData as any).customer_name_obj;
        return !!(
          (formData as any).customer_title &&
          customerNameObj?.firstName &&
          customerNameObj?.lastName &&
          formData.customer_email &&
          formData.customer_phone &&
          isValidEmail(formData.customer_email) &&
          isValidPhoneNumber(formData.customer_phone)
        );
      case 'storage':
        const storageInfo = formData.storage_info;
        if (!storageInfo || storageInfo.wants_storage === null) return false;
        if (storageInfo.wants_storage === false) return true;
        return !!(
          storageInfo.move_out_matches_storage_date !== null &&
          storageInfo.move_in_matches_retrieval_date !== null &&
          storageInfo.retrieval_address_matches_move_in !== null &&
          storageInfo.storage_date &&
          storageInfo.retrieval_date &&
          storageInfo.retrieval_address?.street_name &&
          storageInfo.retrieval_address?.house_number &&
          storageInfo.retrieval_address?.city &&
          storageInfo.retrieval_address?.postal_code &&
          storageInfo.retrieval_address?.country
        );
      case 'room_selection':
        // Can proceed if at least one room is selected
        const selectedRooms = (formData as any).furniture_selected_rooms || [];
        return selectedRooms.length > 0;
      case 'furniture_selection':
        // Can proceed (will skip furniture_services if no kitchen/lamp items)
        return true;
      case 'furniture_services':
        // Can proceed (optional step)
        return true;
      case 'cartonage':
      case 'services':
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Memoize location change handlers to prevent infinite re-renders
  const handleFromLocationChange = useCallback((location: Location) => {
    setFormData(prev => ({ ...prev, from_location: location }));
  }, []);

  const handleToLocationChange = useCallback((location: Location) => {
    setFormData(prev => ({ ...prev, to_location: location }));
  }, []);

  // Memoize furniture assembly handlers to prevent infinite re-renders
  const handleFurnitureAssemblySave = useCallback((roomFurniture: any[]) => {
    setFormData(prev => ({ ...prev, furniture_assembly: roomFurniture } as any));
  }, []);

  const handleRoomsChange = useCallback((rooms: any[]) => {
    setFormData(prev => ({ ...prev, furniture_selected_rooms: rooms } as any));
  }, []);

  const handleRoomSelectionSave = useCallback((rooms: any[]) => {
    setFormData(prev => ({ ...prev, furniture_selected_rooms: rooms } as any));
  }, []);

  const handleFurnitureServicesSave = useCallback((services: any[]) => {
    setFormData(prev => ({ ...prev, furniture_services: services } as any));
  }, []);

  // handle assembly state
  const hasKitchenOrLampItems = (): boolean => {
    const roomFurniture = (formData as any).furniture_assembly || [];
    return roomFurniture.some((rf: any) =>
      rf.furniture?.some((f: any) => f.item?.requires_assembly_disassembly === true)
    );
  }

  // Helper function to get the correct sub-step index for goods group, skipping furniture_services if no kitchen/lamp items
  const getGoodsGroupSubStepIndex = (group: any, targetIndex: number): number => {
    if (!group?.subSteps) return targetIndex;
    const targetSubStep = group.subSteps[targetIndex];

    // If trying to go to furniture_services but no kitchen/lamp items, redirect to furniture_selection
    if (targetSubStep === 'furniture_services') {
      const hasKitchenLampItems = hasKitchenOrLampItems();
      const furnitureSelectionIndex = group.subSteps.indexOf('furniture_selection');

      if (!hasKitchenLampItems && furnitureSelectionIndex >= 0) {
        return furnitureSelectionIndex;
      }
    }

    return targetIndex;
  }

  // Helper function to proceed from furniture_selection to next step
  const proceedFromFurnitureSelection = () => {
    const currentGroup = getCurrentStepGroup();
    if (!currentGroup) return;

    const furnitureServicesIndex = currentGroup.subSteps.indexOf('furniture_services');
    const hasFurnitureRooms = (formData as any).furniture_selected_rooms?.length > 0;
    const kitchenOrLampItems = hasKitchenOrLampItems();
    const visibleGroups = getVisibleStepGroups();
    const currentStepGroupIndex = visibleGroups.findIndex(g => g.id === currentGroup.id);

    if (hasFurnitureRooms && kitchenOrLampItems && furnitureServicesIndex >= 0) {
      const subStepKey = `${currentStepGroupIndex}:${furnitureServicesIndex}`;
      setCurrentSubStepIndex(furnitureServicesIndex);
      setVisitedSubSteps(prev => new Set([...prev, subStepKey]));
    } else {
      // Skip furniture_services if no rooms, go to next group
      if (currentStepGroupIndex < visibleGroups.length - 1) {
        const nextGroupIndex = currentStepGroupIndex + 1;
        const nextSubStepKey = `${nextGroupIndex}:0`;
        setCurrentStepGroupIndex(nextGroupIndex);
        setCurrentSubStepIndex(0);
        setVisitedStepGroups(prev => new Set([...prev, nextGroupIndex]));
        setVisitedSubSteps(prev => new Set([...prev, nextSubStepKey]));
      }
    }
  };

  // Function to resubmit the form
  const handleResubmit = () => {
    setIsSubmitted(false);
    setIsSubmitting(false); // Reset submitting state
    setSubmitStatus({ type: null, message: '' });
    // Form data is already preserved in state and localStorage, so we can just resubmit
    // Scroll to top to show the form again
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Early return AFTER all hooks are declared
  if (isSubmitted) {
    return <ThankYouScreen onResubmit={handleResubmit} />;
  }

  const visibleGroups = getVisibleStepGroups();
  const currentGroup = getCurrentStepGroup();
  const currentSubStep = getCurrentSubStep();
  const progressPercentage = ((currentStepGroupIndex + 1) / visibleGroups.length) * 100;
  const isLastGroup = currentStepGroupIndex === visibleGroups.length - 1;
  const isLastSubStep = currentGroup ? currentSubStepIndex === currentGroup.subSteps.length - 1 : false;

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Main Content */}
      <div className="flex-1 py-8 px-4 overflow-y-auto pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 lg:px-0">
          <div className="card bg-white border border-gray-200 shadow-lg">
            <div className="card-body p-4 lg:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                {submitStatus.type === 'error' && (
                  <div className="alert bg-gray-100 border border-gray-300 text-black mb-4 lg:mb-6 text-sm lg:text-base">
                    <AlertCircle className="w-5 h-5 text-gray-700" />
                    <div className="flex-1">
                      <span>{submitStatus.message}</span>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="btn btn-primary btn-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Wird gesendet...
                            </>
                          ) : (
                            'Erneut versuchen'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Render component based on current sub-step */}
                {currentSubStep === 'from_address' && (
                  <AddressInputForm
                    location={formData.from_location!}
                    onChange={(location) => setFormData({ ...formData, from_location: location })}
                    title="Aktuelle Adresse"
                    showMovingDate={true}
                    movingOutDate={formData.moving_out_date || ''}
                    onMovingOutDateChange={(date) => setFormData({ ...formData, moving_out_date: date })}
                  />
                )}

                {currentSubStep === 'from_address_details' && (
                  <AddressDetailsForm
                    location={formData.from_location!}
                    onChange={(location) => setFormData({ ...formData, from_location: location })}
                    title="Details zur Auszugsadresse"
                  />
                )}

                {currentSubStep === 'to_address' && (
                  <>
                    <AddressInputForm
                      location={formData.to_location!}
                      onChange={(location) => setFormData({ ...formData, to_location: location })}
                      title="Zukünftige Adresse"
                      showMovingDate={true}
                      movingInDate={formData.moving_in_date || ''}
                      onMovingInDateChange={(date) => setFormData({ ...formData, moving_in_date: date })}
                    />
                    {formData.moving_out_date && formData.moving_in_date && !isMovingInDateAfterMovingOutDate() && (
                      <div className="alert bg-red-50 border border-red-300 text-red-800 mt-4">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div className="flex-1">
                          <span>Das Einzugsdatum darf nicht vor dem Auszugsdatum liegen.</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {currentSubStep === 'to_address_details' && (
                  <AddressDetailsForm
                    location={formData.to_location!}
                    onChange={(location) => setFormData({ ...formData, to_location: location })}
                    title="Details zur Einzugsadresse"
                  />
                )}

                {currentSubStep === 'contact' && (
                  <ContactForm
                    customerName={(formData as any).customer_name_obj || { firstName: '', lastName: '' }}
                    customerTitle={(formData as any).customer_title || ''}
                    customerEmail={formData.customer_email || ''}
                    customerPhone={formData.customer_phone || ''}
                    onCustomerFirstNameChange={(value) => {
                      const currentNameObj = (formData as any).customer_name_obj || { firstName: '', lastName: '' };
                      setFormData({
                        ...formData,
                        customer_name_obj: { ...currentNameObj, firstName: value }
                      } as any);
                    }}
                    onCustomerLastNameChange={(value) => {
                      const currentNameObj = (formData as any).customer_name_obj || { firstName: '', lastName: '' };
                      setFormData({
                        ...formData,
                        customer_name_obj: { ...currentNameObj, lastName: value }
                      } as any);
                    }}
                    onCustomerTitleChange={(value) => setFormData({ ...formData, customer_title: value } as any)}
                    onCustomerEmailChange={(value) => setFormData({ ...formData, customer_email: value })}
                    onCustomerPhoneChange={(value) => setFormData({ ...formData, customer_phone: value })}
                  />
                )}

                {currentSubStep === 'storage' && (
                  <StorageForm
                    storageInfo={formData.storage_info || {
                      wants_storage: null,
                      move_out_matches_storage_date: null,
                      move_in_matches_retrieval_date: null,
                      retrieval_address_matches_move_in: null,
                      storage_date: '',
                      retrieval_date: '',
                      retrieval_address: {
                        address: '',
                        object_type: 'Wohnung',
                        floor: 0,
                        living_space_m2: 0,
                        has_elevator: false,
                        needs_parking_zone: false,
                        walkway_m: 0,
                      },
                    }}
                    movingOutDate={formData.moving_out_date || ''}
                    movingInDate={formData.moving_in_date || ''}
                    toLocation={formData.to_location!}
                    onStorageInfoChange={(storageInfo) => setFormData({ ...formData, storage_info: storageInfo })}
                  />
                )}

                {currentSubStep === 'room_selection' && (
                  <RoomSelectionForm
                    onBack={prevStep}
                    onSave={handleRoomSelectionSave}
                    initialSelectedRooms={(formData as any).furniture_selected_rooms || []}
                  />
                )}

                {currentSubStep === 'furniture_selection' && (
                  <RoomFurnitureSelection
                    selectedRooms={(formData as any).furniture_selected_rooms || []}
                    initialRoomFurniture={(formData as any).furniture_assembly || []}
                    onBack={prevStep}
                    onSave={handleFurnitureAssemblySave}
                    onRoomsChange={handleRoomsChange}
                  />
                )}

                {currentSubStep === 'furniture_services' && (
                  <FurnitureServicesForm
                    selectedRooms={(formData as any).furniture_selected_rooms || []}
                    roomFurniture={(formData as any).furniture_assembly || []}
                    initialServices={(formData as any).furniture_services || []}
                    onBack={prevStep}
                    onSave={handleFurnitureServicesSave}
                  />
                )}

                {currentSubStep === 'cartonage' && (
                  <CartonageForm
                    cartonageInfo={formData.cartonage_info || {
                      box_quantity: 0,
                      boxes_to_buy: 0,
                      boxes_to_rent: 0,
                      wardrobe_boxes_to_rent: 0,
                      packing_service_quantity: 0,
                      unpacking_service_quantity: 0,
                      packing_material_package: null,
                      delivery_date: '',
                      cartonage_notes: '',
                    }}
                    onCartonageInfoChange={(cartonageInfo) => setFormData({ ...formData, cartonage_info: cartonageInfo })}
                  />
                )}

                {currentSubStep === 'services' && (
                  <ServicesForm
                    fromLocation={formData.from_location}
                    toLocation={formData.to_location}
                    onFromLocationChange={handleFromLocationChange}
                    onToLocationChange={handleToLocationChange}
                  />
                )}

                {currentSubStep === 'review' && (
                  <div className="space-y-4 lg:space-y-6">
                    <FormHeader title="Zusammenfassung" />
                    <div className="space-y-4 lg:space-y-6">
                      {/* Contact Details */}
                      <div className="card bg-gray-50 border border-gray-200">
                        <div className="card-body p-4 lg:p-6">
                          <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Kontaktdaten</h3>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Name:</strong> {
                                (formData as any).customer_name_obj
                                  ? `${((formData as any).customer_name_obj).firstName} ${((formData as any).customer_name_obj).lastName}`.trim()
                                  : formData.customer_name || 'Nicht angegeben'
                              }
                            </div>
                            {(formData as any).customer_title && (
                              <div>
                                <strong>Anrede:</strong> {(formData as any).customer_title}
                              </div>
                            )}
                            <div>
                              <strong>E-Mail:</strong> {formData.customer_email || 'Nicht angegeben'}
                            </div>
                            <div>
                              <strong>Telefon:</strong> {formData.customer_phone || 'Nicht angegeben'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="card bg-gray-50 border border-gray-200">
                        <div className="card-body p-4 lg:p-6">
                          <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Adressen</h3>
                          <div className="space-y-3 text-sm">
                            <div>
                              <strong>Von:</strong> {formatAddress(formData.from_location)}
                            </div>
                            <div>
                              <strong>Nach:</strong> {formatAddress(formData.to_location)}
                            </div>
                          </div>
                        </div>
                      </div>



                      {/* Volume Calculation */}
                      {(() => {
                        const furnitureAssembly = (formData as any).furniture_assembly || [];
                        let calculatedVolume = 0;

                        furnitureAssembly.forEach((roomFurniture: any) => {
                          roomFurniture.furniture?.forEach((f: any) => {
                            calculatedVolume += (f.item?.volume_m3 || 0) * (f.quantity || 0);
                          });
                        });

                        const displayVolume = calculatedVolume > 0 ? calculatedVolume.toFixed(2) : (formData.total_volume_m3 || 0).toFixed(2);

                        return (
                          <div className="card bg-gray-50 border border-gray-200">
                            <div className="card-body p-4 lg:p-6">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Volumen</h3>
                              <div className="text-sm">
                                <div>
                                  <strong>Gesamtvolumen:</strong> {displayVolume} m³
                                </div>
                                {calculatedVolume > 0 && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    (berechnet aus ausgewählten Möbeln)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Furniture Assembly/Disassembly Services */}
                      {(() => {
                        const furnitureServices = (formData as any).furniture_services || [];
                        const hasServices = furnitureServices.some((rs: any) =>
                          rs.services?.some((s: any) => s.disassembly > 0 || s.assembly > 0)
                        );

                        if (!hasServices) return null;

                        return (
                          <div className="card bg-gray-50 border border-gray-200">
                            <div className="card-body p-4 lg:p-6">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Möbelmontage</h3>
                              <div className="space-y-3 text-sm">
                                {furnitureServices.map((roomService: any) => {
                                  const roomServices = roomService.services?.filter((s: any) => s.disassembly > 0 || s.assembly > 0) || [];
                                  if (roomServices.length === 0) return null;

                                  return (
                                    <div key={roomService.room?.name} className="border-l-2 border-blue-500 pl-3">
                                      <div className="font-semibold text-gray-700 mb-2">
                                        {roomService.room?.label || roomService.room?.name}
                                      </div>
                                      <div className="space-y-1 ml-2">
                                        {roomServices.map((service: any, idx: number) => {
                                          const parts: string[] = [];
                                          if (service.disassembly > 0) {
                                            parts.push(`${service.disassembly}x Abbau`);
                                          }
                                          if (service.assembly > 0) {
                                            parts.push(`${service.assembly}x Aufbau`);
                                          }
                                          if (parts.length === 0) return null;

                                          return (
                                            <div key={idx} className="text-gray-600">
                                              {service.item?.label}: {parts.join(', ')}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* General Services */}
                      {(() => {
                        const services = formData.services;
                        const hasServices = services && (
                          services.kitchen_disassembly ||
                          services.kitchen_assembly ||
                          services.lamps_disassembly ||
                          services.lamps_assembly ||
                          services.furniture_disassembly ||
                          services.furniture_assembly ||
                          services.carton_pack ||
                          services.carton_unpack
                        );

                        if (!hasServices) return null;

                        return (
                          <div className="card bg-gray-50 border border-gray-200">
                            <div className="card-body p-4 lg:p-6">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Weitere Services</h3>
                              <div className="space-y-2 text-sm">
                                {services.kitchen_disassembly && (
                                  <div>✓ Küchendemontage</div>
                                )}
                                {services.kitchen_assembly && (
                                  <div>✓ Küchenmontage</div>
                                )}
                                {services.lamps_disassembly && services.number_of_lamps_to_disassemble > 0 && (
                                  <div>✓ Lampendemontage ({services.number_of_lamps_to_disassemble} Stück)</div>
                                )}
                                {services.lamps_assembly && services.number_of_lamps_to_assemble > 0 && (
                                  <div>✓ Lampenmontage ({services.number_of_lamps_to_assemble} Stück)</div>
                                )}
                                {services.furniture_disassembly && (
                                  <div>✓ Möbeldemontage (allgemein)</div>
                                )}
                                {services.furniture_assembly && (
                                  <div>✓ Möbelmontage (allgemein)</div>
                                )}
                                {services.carton_pack && (
                                  <div>✓ Einpackservice</div>
                                )}
                                {services.carton_unpack && (
                                  <div>✓ Auspackservice</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Cartonage */}
                      {(() => {
                        const cartonage = formData.cartonage_info;
                        const hasCartonage = cartonage && (
                          cartonage.boxes_to_buy > 0 ||
                          cartonage.boxes_to_rent > 0 ||
                          cartonage.wardrobe_boxes_to_rent > 0 ||
                          cartonage.packing_service_quantity > 0 ||
                          cartonage.unpacking_service_quantity > 0
                        );

                        if (!hasCartonage) return null;

                        return (
                          <div className="card bg-gray-50 border border-gray-200">
                            <div className="card-body p-4 lg:p-6">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Kartonagen</h3>
                              <div className="space-y-2 text-sm">
                                {cartonage.boxes_to_buy > 0 && (
                                  <div>✓ Standardkartons kaufen: {cartonage.boxes_to_buy} Stück</div>
                                )}
                                {cartonage.boxes_to_rent > 0 && (
                                  <div>✓ Standardkartons mieten: {cartonage.boxes_to_rent} Stück</div>
                                )}
                                {cartonage.wardrobe_boxes_to_rent > 0 && (
                                  <div>✓ Kleiderspindkartons mieten: {cartonage.wardrobe_boxes_to_rent} Stück</div>
                                )}
                                {cartonage.packing_service_quantity > 0 && (
                                  <div>✓ Einpackservice: {cartonage.packing_service_quantity} Kartons</div>
                                )}
                                {cartonage.unpacking_service_quantity > 0 && (
                                  <div>✓ Auspackservice: {cartonage.unpacking_service_quantity} Kartons</div>
                                )}
                                {cartonage.delivery_date && (
                                  <div className="mt-2 text-gray-600">
                                    <strong>Lieferdatum:</strong> {cartonage.delivery_date}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Storage */}
                      <div className="card bg-gray-50 border border-gray-200">
                        <div className="card-body p-4 lg:p-6">
                          <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Einlagerung</h3>
                          <div className="text-sm">
                            {formData.storage_info?.wants_storage === true ? (
                              <div className="space-y-2">
                                <div className="font-semibold text-green-600">✓ Einlagerung gewünscht</div>
                                {formData.storage_info.storage_date && (
                                  <div>
                                    <strong>Einlagerungsdatum:</strong> {formData.storage_info.storage_date}
                                  </div>
                                )}
                                {formData.storage_info.retrieval_date && (
                                  <div>
                                    <strong>Auslagerungsdatum:</strong> {formData.storage_info.retrieval_date}
                                  </div>
                                )}
                                {formData.storage_info.retrieval_address && (
                                  <div>
                                    <strong>Lieferadresse:</strong> {formatAddress(formData.storage_info.retrieval_address)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500 italic">Nicht gewählt</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Parking Zones */}
                      {(() => {
                        const fromNeedsParking = formData.from_location?.needs_parking_zone;
                        const toNeedsParking = formData.to_location?.needs_parking_zone;

                        if (!fromNeedsParking && !toNeedsParking) return null;

                        return (
                          <div className="card bg-gray-50 border border-gray-200">
                            <div className="card-body p-4 lg:p-6">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Halteverbotszone</h3>
                              <div className="space-y-2 text-sm">
                                {fromNeedsParking && (
                                  <div>✓ Beladestelle: {formatAddress(formData.from_location)}</div>
                                )}
                                {toNeedsParking && (
                                  <div>✓ Entladestelle: {formatAddress(formData.to_location)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-0 left-0 w-80 lg:w-1/3 bg-blue-900 text-white flex flex-col h-screen z-50 transition-transform duration-300 ease-in-out`}
      >
        {/* Progress Bar - Desktop Only */}
        <div className="hidden lg:block p-6 border-b border-blue-800">
          <div className="h-2 bg-blue-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Close Button - Mobile Only */}
        <div className="lg:hidden flex justify-end p-4 border-b border-blue-800">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
            aria-label="Menü schließen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Steps */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="space-y-4">
            {visibleGroups.map((group, index) => {
              const isCurrent = index === currentStepGroupIndex;
              const isVisited = visitedStepGroups.has(index);

              if (group.id === 'addresses') {
                const fromAddressIndex = group.subSteps.indexOf('from_address');
                const toAddressIndex = group.subSteps.indexOf('to_address');
                const isFromCurrent = isCurrent && currentSubStepIndex === fromAddressIndex;
                const isToCurrent = isCurrent && currentSubStepIndex === toAddressIndex;
                const isFromVisited = isSubStepVisible(index, fromAddressIndex);
                const isToVisited = isSubStepVisible(index, toAddressIndex);

                return (
                  <div key={group.id} className="space-y-1">
                    {/* Main group header */}
                    <div
                      className={`text-lg font-semibold mb-2 ${isCurrent ? 'text-white' : isVisited ? 'text-blue-200' : 'text-blue-400'
                        }`}
                    >
                      {group.label}
                    </div>

                    {/* Subheadings */}
                    <div className="ml-4 space-y-1">
                      <button
                        onClick={() => {
                          goToSubStep(index, fromAddressIndex);
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={!isFromVisited}
                        className={`w-full text-left transition-colors py-2 px-2 rounded-lg ${isFromCurrent
                          ? 'text-white font-medium text-base bg-blue-800'
                          : isFromVisited
                            ? 'text-blue-200 font-medium text-sm hover:text-white hover:bg-blue-800'
                            : 'text-blue-400 text-sm'
                          } ${isFromVisited ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        Auszugsadresse
                      </button>
                      <button
                        onClick={() => {
                          goToSubStep(index, toAddressIndex);
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={!isToVisited}
                        className={`w-full text-left transition-colors py-2 px-2 rounded-lg ${isToCurrent
                          ? 'text-white font-medium text-base bg-blue-800'
                          : isToVisited
                            ? 'text-blue-200 font-medium text-sm hover:text-white hover:bg-blue-800'
                            : 'text-blue-400 text-sm'
                          } ${isToVisited ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        Einzugsadresse
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={group.id}
                  onClick={() => {
                    if (isVisited) {
                      goToStepGroup(index);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  disabled={!isVisited}
                  className={`w-full text-left transition-colors py-3 px-3 rounded-lg ${isCurrent
                    ? 'text-white font-bold text-xl bg-blue-800'
                    : isVisited
                      ? 'text-blue-200 font-semibold text-lg hover:text-white hover:bg-blue-800'
                      : 'text-blue-400 text-lg'
                    } ${isVisited ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {group.label}
                </button>

              );
            })}
          </div>
        </div>

        {/* Navigation Buttons - Desktop Only */}
        <div className="hidden lg:grid p-6 grid-cols-2 gap-4 border-t border-blue-800">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStepGroupIndex === 0 && currentSubStepIndex === 0}
            className={`w-full btn bg-white text-blue-900 hover:bg-blue-50 border-white text-lg py-6 shadow-none ${currentStepGroupIndex === 0 && currentSubStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Zurück
          </button>

          {!isLastGroup || !isLastSubStep ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`w-full btn bg-blue-600 text-white hover:bg-blue-500 border-blue-600 text-lg py-6 shadow-none ${!canProceed() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              Weiter
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any);
              }}
              className={`w-full btn bg-blue-600 text-white hover:bg-blue-500 border-blue-600 text-lg py-6 shadow-none ${isSubmitting ? 'loading' : ''
                }`}
              disabled={isSubmitting || !canProceed()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Anfrage absenden
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Buttons - Fixed at Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 p-4 safe-area-inset-bottom">
        <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStepGroupIndex === 0 && currentSubStepIndex === 0}
            className={`w-full btn bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-300 text-base py-4 shadow-none ${currentStepGroupIndex === 0 && currentSubStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Zurück
          </button>

          {!isLastGroup || !isLastSubStep ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`w-full btn bg-blue-600 text-white hover:bg-blue-500 border-blue-600 text-base py-4 shadow-none ${!canProceed() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              Weiter
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any);
              }}
              className={`w-full btn bg-blue-600 text-white hover:bg-blue-500 border-blue-600 text-base py-4 shadow-none ${isSubmitting ? 'loading' : ''
                }`}
              disabled={isSubmitting || !canProceed()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Absenden
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Spacer for mobile bottom navigation */}
      <div className="lg:hidden h-24" />

      {/* Manual CBM Input Modal */}
      {showManualCbmModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => {
            setShowManualCbmModal(false);
            setManualCbmValue('');
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Gesamtvolumen manuell eingeben</h3>
              <button
                type="button"
                onClick={() => {
                  setShowManualCbmModal(false);
                  setManualCbmValue('');
                }}
                className="btn btn-circle btn-ghost hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Gesamtvolumen (m³)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={manualCbmValue}
                  onChange={(e) => setManualCbmValue(e.target.value)}
                  placeholder="z.B. 15.5"
                  className="input input-bordered w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCbmValue && parseFloat(manualCbmValue) > 0) {
                      const cbmValue = parseFloat(manualCbmValue);
                      setFormData(prev => ({ ...prev, total_volume_m3: cbmValue } as any));
                      setShowManualCbmModal(false);
                      setManualCbmValue('');
                      // Continue to next step
                      proceedFromFurnitureSelection();
                    }
                  }}
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Bitte geben Sie das geschätzte Gesamtvolumen in Kubikmetern ein
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowManualCbmModal(false);
                  setManualCbmValue('');
                }}
                className="btn btn-outline px-8"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!manualCbmValue || parseFloat(manualCbmValue) <= 0) {
                    alert('Bitte geben Sie einen gültigen Wert größer als 0 ein.');
                    return;
                  }
                  const cbmValue = parseFloat(manualCbmValue);
                  setFormData(prev => ({ ...prev, total_volume_m3: cbmValue } as any));
                  setShowManualCbmModal(false);
                  setManualCbmValue('');
                  // Continue to next step
                  proceedFromFurnitureSelection();
                }}
                disabled={!manualCbmValue || parseFloat(manualCbmValue) <= 0}
                className="btn btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAddress(location?: Location | null): string {
  if (!location) return 'Nicht angegeben';

  if (location.address) {
    return location.address;
  }

  const parts: string[] = [];

  if (location.street_name) {
    const street = location.house_number
      ? `${location.street_name} ${location.house_number}`
      : location.street_name;
    parts.push(street);
  }

  if (location.postal_code && location.city) {
    parts.push(`${location.postal_code} ${location.city}`);
  } else if (location.city) {
    parts.push(location.city);
  } else if (location.postal_code) {
    parts.push(location.postal_code);
  }

  if (location.state) {
    parts.push(location.state);
  }

  if (location.country) {
    parts.push(location.country);
  }

  return parts.length > 0 ? parts.join(', ') : 'Nicht angegeben';
}
