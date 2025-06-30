import React from 'react';
import { Globe } from 'lucide-react';
import { languageService, type SupportedLanguage } from '../services/LanguageService';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  const languages = languageService.getAvailableLanguages();

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200">
        <Globe className="w-4 h-4 text-gray-700" />
        <span className="text-sm font-medium text-gray-700">
          {languages.find(lang => lang.code === currentLanguage)?.nativeName}
        </span>
      </button>
      
      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
              currentLanguage === language.code 
                ? 'text-indigo-600 font-medium bg-indigo-50' 
                : 'text-gray-700'
            }`}
          >
            {language.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;