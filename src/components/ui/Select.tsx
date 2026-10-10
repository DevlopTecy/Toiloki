import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchableThreshold?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchableThreshold = 7,
  size = 'md',
  disabled = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const isSearchable = options.length >= searchableThreshold;
  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = isSearchable && search.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase().trim()) ||
        (opt.description && opt.description.toLowerCase().includes(search.toLowerCase().trim()))
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      if (isSearchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, isSearchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`toiloki-select-container toiloki-select-${size} ${disabled ? 'is-disabled' : ''} ${className}`}
      id={selectId}
    >
      <button
        type="button"
        className={`toiloki-select-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="toiloki-select-trigger-content">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="toiloki-select-icon">{selectedOption.icon}</span>}
              <span className="toiloki-select-label">{selectedOption.label}</span>
            </>
          ) : (
            <span className="toiloki-select-placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={14} className={`toiloki-select-arrow ${isOpen ? 'is-flipped' : ''}`} />
      </button>

      {isOpen && (
        <div className="toiloki-select-dropdown" role="listbox">
          {isSearchable && (
            <div className="toiloki-select-search-box">
              <Search size={13} className="toiloki-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="toiloki-select-search-input"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="toiloki-select-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`toiloki-select-option ${isSelected ? 'is-selected' : ''} ${opt.disabled ? 'is-disabled' : ''}`}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    disabled={opt.disabled}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {opt.icon && <span className="toiloki-select-icon">{opt.icon}</span>}
                    <div className="toiloki-select-option-text">
                      <span className="toiloki-select-option-label">{opt.label}</span>
                      {opt.description && (
                        <span className="toiloki-select-option-desc">{opt.description}</span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="toiloki-select-check" />}
                  </button>
                );
              })
            ) : (
              <div className="toiloki-select-empty">No matching options</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
