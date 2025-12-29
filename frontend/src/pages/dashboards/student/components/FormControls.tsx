import React, { useState, useRef, useEffect } from 'react';

// --- Input Waktu ---
export const TimeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input type="time" {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
);

// --- Area Teks ---
export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} rows={3} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
);

// --- Pilihan Ganda (Checkbox) ---
interface SelectInputProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (value: string) => void;
}
export const SelectInput: React.FC<SelectInputProps> = ({ options, selected, onChange }) => (
  <div className="space-y-2">
    {options.map(opt => (
      <label key={opt.value} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
        <input 
          type="checkbox" 
          checked={selected.includes(opt.value)} 
          onChange={() => onChange(opt.value)}
          className="h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
        />
        <span>{opt.label}</span>
      </label>
    ))}
  </div>
);

// --- Pilihan Dropdown dengan Fitur Pencarian ---
interface SearchableSelectProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}
export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Menutup dropdown saat klik di luar komponen
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    return (
        <div className="relative" ref={wrapperRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-white p-2 border border-gray-300 rounded-md shadow-sm text-left flex justify-between items-center">
                <span className={value ? 'text-gray-900' : 'text-gray-500'}>{selectedLabel}</span>
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                    <div className="p-2">
                        <input 
                            type="text"
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <ul className="py-1">
                        {filteredOptions.map(opt => (
                            <li 
                                key={opt.value} 
                                onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                            >
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}; 
