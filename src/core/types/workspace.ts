import React from 'react';
import { LucideIcon } from 'lucide-react';

export type WorkspaceId =
  | 'pdf'
  | 'documents'
  | 'images'
  | 'data'
  | 'text'
  | 'developer'
  | 'calculator'
  | 'files';

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  engineId: string;
  component?: React.ComponentType;
  keywords?: string[];
}

export interface UtilityDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  badgeGradient: string;
  features: FeatureDefinition[];
}

export interface WorkspaceDefinition {
  id: WorkspaceId;
  name: string;
  description: string;
  icon: LucideIcon;
  badgeGradient: string;
  utilities: UtilityDefinition[];
}
