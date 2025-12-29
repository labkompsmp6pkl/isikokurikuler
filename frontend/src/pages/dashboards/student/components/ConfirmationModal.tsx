import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 font-semibold text-sm shadow-sm"
          >
            Ya, Saya Yakin
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
