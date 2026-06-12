import React from 'react';
import { Globe } from './icons';
import { languageService, type SupportedLanguage } from '../services/LanguageService';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  const languages = languageService.getAvailableLanguages();

  return (
    <div className="relative group">
      <button className="liquid-button px-4 py-2 flex items-center space-x-2 text-sm">
        <Globe className="w-4 h-4 text-[var(--accent)]" />
        <span className="font-500 text-[var(--text-primary)]">
          {languages.find(lang => lang.code === currentLanguage)?.nativeName}
        </span>
      </button>

      <div className="absolute right-0 top-full mt-2 liquid-glass py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
            className={`w-full text-left px-4 py-2.5 text-sm font-500 transition-all ${
              currentLanguage === language.code
                ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
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
