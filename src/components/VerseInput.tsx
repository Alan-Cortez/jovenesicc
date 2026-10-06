'use client';

import { useState, KeyboardEvent, MouseEvent } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';

interface VerseInputProps {
  defaultValue?: string;
}

export default function VerseInput({ defaultValue = '' }: VerseInputProps) {
  const [verses, setVerses] = useState<string[]>(
    defaultValue ? defaultValue.split(',').map(v => v.trim()).filter(Boolean) : []
  );
  const [inputValue, setInputValue] = useState('');

  const addVerse = (e?: MouseEvent | KeyboardEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Support comma-separated pasted lists or typed values
    const newVerses = inputValue.split(',').map(v => v.trim()).filter(v => v !== '');
    
    // Add only non-duplicates
    const uniqueNewVerses = newVerses.filter(v => !verses.includes(v));

    if (uniqueNewVerses.length > 0) {
      setVerses([...verses, ...uniqueNewVerses]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addVerse(e);
    }
  };

  const removeVerse = (indexToRemove: number) => {
    setVerses(verses.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: 'var(--color-text-main)', marginBottom: '8px', fontWeight: '600' }}>
        <BookOpen size={20} style={{ color: '#2563eb' }} />
        Versículos Usados
      </label>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input 
          type="text" 
          placeholder="Ej: Juan 3:16, Romanos 8:28 (separar por comas)" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addVerse()}
          required={verses.length === 0}
          style={{ 
            flex: 1, 
            padding: '10px 14px', 
            border: '1px solid #2563eb', 
            borderRadius: '8px', 
            backgroundColor: 'transparent', 
            color: 'var(--color-primary)',
            outline: 'none',
            fontFamily: 'var(--font-sans)'
          }}
        />
        <button 
          type="button" 
          onClick={addVerse}
          style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            width: '46px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={24} />
        </button>
      </div>
      
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        Presiona Enter para agregar. Puedes agregar múltiples separándolos por coma.
      </p>

      {verses.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {verses.map((verse, idx) => (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                backgroundColor: '#f0f5ff', 
                color: '#2563eb', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              {verse}
              <button 
                type="button"
                onClick={() => removeVerse(idx)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#2563eb', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: 0,
                  opacity: 0.7
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden input to store the comma-separated values for the form submission */}
      <input type="hidden" name="bibleRefs" value={verses.join(', ')} />
    </div>
  );
}
