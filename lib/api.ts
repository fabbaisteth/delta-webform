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
