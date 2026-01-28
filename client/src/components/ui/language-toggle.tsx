import React from 'react';
import { Sa, Us } from 'react-flags-select';
import { useTranslation } from 'react-i18next';

export default function LanguageToggle({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';

  // Size configs
  const config = {
    sm: { w: 56, h: 28, knob: 24, flag: 20, font: 13, gap: 8 },
    md: { w: 68, h: 34, knob: 30, flag: 26, font: 14, gap: 10 },
    lg: { w: 84, h: 42, knob: 38, flag: 32, font: 16, gap: 12 },
  }[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: config.gap }}>
      <span 
        style={{ 
          fontWeight: isEnglish ? 600 : 400,
          color: isEnglish ? '#fff' : '#94a3b8',
          fontSize: config.font,
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        EN
      </span>
      
      <button
        onClick={() => i18n.changeLanguage(isEnglish ? 'ar' : 'en')}
        aria-label="Toggle language"
        style={{
          width: config.w,
          height: config.h,
          borderRadius: config.h / 2,
          border: 'none',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.3s ease',
          boxShadow: isEnglish 
            ? '0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.3)'
            : '0 0 0 2px #22c55e, 0 4px 12px rgba(34, 197, 94, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {/* Sliding knob with flag */}
        <span
          style={{
            position: 'absolute',
            left: isEnglish ? 2 : config.w - config.knob - 2,
            width: config.knob,
            height: config.knob,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {isEnglish ? (
            <Us 
              style={{ 
                width: config.flag, 
                height: config.flag, 
                objectFit: 'cover',
                borderRadius: '50%'
              }} 
              aria-label="English" 
            />
          ) : (
            <Sa 
              style={{ 
                width: config.flag, 
                height: config.flag, 
                objectFit: 'cover',
                borderRadius: '50%'
              }} 
              aria-label="Arabic" 
            />
          )}
        </span>
      </button>
      
      <span 
        style={{ 
          fontWeight: !isEnglish ? 600 : 400,
          color: !isEnglish ? '#fff' : '#94a3b8',
          fontSize: config.font,
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        AR
      </span>
    </div>
  );
}