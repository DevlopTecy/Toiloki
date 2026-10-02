import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumb.css';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="desktop-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={13} className="breadcrumb-separator" />}
            {isLast ? (
              <span className="breadcrumb-item current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                className="breadcrumb-item link-btn"
                onClick={item.onClick}
                type="button"
              >
                {isFirst && item.label === 'Home' ? (
                  <Home size={12} className="home-breadcrumb-icon" />
                ) : null}
                <span>{item.label}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
