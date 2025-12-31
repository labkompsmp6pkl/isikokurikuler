import React from 'react';

// 1. Definisikan tipe data untuk props (interface)
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';   // Opsional, default nanti kita set
  color?: 'blue' | 'white' | 'red' | 'gray'; // Opsional
  className?: string;          // Opsional, untuk tambahan class custom
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md',       // Default size jika tidak diisi
  color = 'blue',    // Default color jika tidak diisi
  className = '' 
}) => {

  // 2. Mapping ukuran ke class Tailwind
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  // 3. Mapping warna ke class Tailwind (Border color)
  // border-t-transparent membuat efek putaran terlihat jelas
  const colorClasses = {
    blue: 'border-indigo-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    red: 'border-red-600 border-t-transparent',
    gray: 'border-gray-300 border-t-gray-600',
  };

  // Pilih class berdasarkan props, fallback ke default jika tidak ada di map
  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div 
      className={`animate-spin rounded-full ${selectedSize} ${selectedColor} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;