'use client';

import { CheckCircle } from 'lucide-react';

interface ThankYouScreenProps {
  requestId?: string;
  onResubmit?: () => void;
}

export default function ThankYouScreen({ requestId, onResubmit }: ThankYouScreenProps) {
  return (
    <div className="min-h-screen bg-white py-8 px-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <div className="card bg-white border border-gray-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-gray-100 p-4">
                <CheckCircle className="w-16 h-16 text-gray-700" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Vielen Dank!</h1>
            <p className="text-xl mb-2">Ihre Umzugsanfrage wurde erfolgreich übermittelt.</p>
            <p className="text-gray-600 mb-6">
              Wir werden uns in Kürze bei Ihnen melden.
            </p>
            {requestId && (
              <div className="alert bg-gray-100 border border-gray-300 text-black mb-4">
                <span className="text-sm">Request ID: {requestId}</span>
              </div>
            )}
            {onResubmit && (
              <div className="mt-4">
                <button
                  onClick={onResubmit}
                  className="btn btn-outline btn-sm"
                >
                  Erneut absenden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


