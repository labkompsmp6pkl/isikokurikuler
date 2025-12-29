import React from 'react';

interface CharacterSectionProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const CharacterSection: React.FC<CharacterSectionProps> = ({ title, subtitle, children }) => {
  return (
    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 h-full flex flex-col">
      <h3 className="font-bold text-md text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
      <div className="space-y-4 flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
};
