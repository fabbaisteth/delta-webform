/**
 * API service for backend communication
 * Simplified to load form data from localStorage and submit
 */

import { CustomerForm } from '@/types/form';

const STORAGE_KEY = 'moving-form-data';

// Get API URL from environment variable
const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4001';
  }

  return '';
};

/**
 * Response interface for form submission
 */
export interface SubmitFormResponse {
  status: 'success';
  request_uuid: string;
  message: string;
}

/**
 * Error response interface
 */
export interface ApiError {
  error: string;
  detail?: {
    error?: string;
    type?: string;
  };
}

/**
 * Position info interface for prediction updates
 */
export interface PositionInfo {
  description: string;
  amount: number;
  unit_price: number;
  total_price: number;
}

/**
 * Update prediction request interface
 */
export interface UpdatePredictionRequest {
  amount_net?: number; // in cents
  hourly_rate?: number;
  ai_workhours?: number;
  positions?: PositionInfo[];
}

/**
 * Update prediction response interface
 */
export interface UpdatePredictionResponse {
  status: 'success';
  prediction_uuid: string;
  message?: string;
}

/**
 * Loads form data from localStorage
 */
export function loadFormDataFromStorage(): Partial<CustomerForm> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return null;
    }

    return JSON.parse(savedData) as Partial<CustomerForm>;
  } catch (error) {
    console.error('Error loading form data from localStorage:', error);
    return null;
  }
}

/**
 * Submits the form data to the backend API
 * Loads data from localStorage if formData is not provided
 */
export async function submitForm(formData?: CustomerForm): Promise<SubmitFormResponse> {
  // Load from localStorage if formData not provided
  const dataToSubmit = formData || loadFormDataFromStorage();

  if (!dataToSubmit) {
    throw new Error('No form data available. Please fill out the form first.');
  }

  const apiUrl = getApiUrl();

  if (!apiUrl) {
    throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
  }

  const response = await fetch(`${apiUrl}/api/submit-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSubmit),
  });

  if (!response.ok) {
    let error: ApiError;
    try {
      const errorText = await response.text();
      try {
        error = JSON.parse(errorText);
      } catch {
        error = {
          error: errorText || `Server error: ${response.status} ${response.statusText}`
        };
      }
    } catch (e) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const errorMessage = error.detail?.error || error.error || 'Fehler beim Senden der Anfrage';
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return {
    status: 'success',
    request_uuid: result.request_uuid || result.request_id,
    message: result.message || 'Request submitted successfully',
  };
}

/**
 * Updates prediction data in the database
 * This triggers regeneration of documents and sends email with PDF attachment
 * 
 * @param predictionUuid - UUID of the prediction to update
 * @param updates - Partial update data (amount_net, hourly_rate, ai_workhours, positions)
 * @returns Updated prediction response
 */
export async function updatePrediction(
  predictionUuid: string,
  updates: UpdatePredictionRequest
): Promise<UpdatePredictionResponse> {
  if (!predictionUuid) {
    throw new Error('Prediction UUID is required');
  }

  const apiUrl = getApiUrl();

  if (!apiUrl) {
    throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
  }

  const response = await fetch(`${apiUrl}/api/predictions/${predictionUuid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    let error: ApiError;
    try {
      const errorText = await response.text();
      try {
        error = JSON.parse(errorText);
      } catch {
        error = {
          error: errorText || `Server error: ${response.status} ${response.statusText}`
        };
      }
    } catch (e) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const errorMessage = error.detail?.error || error.error || 'Failed to update prediction';
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return {
    status: 'success',
    prediction_uuid: result.prediction_uuid || predictionUuid,
    message: result.message || 'Prediction updated successfully',
  };
}
