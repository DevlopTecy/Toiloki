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

export type UtilityStatus = 'ready' | 'beta' | 'soon';

export type UtilityTemplate = 'file' | 'text/code' | 'table' | 'calculator';

export interface UtilityDefinition {
  id: string; // unique utilityId
  name: string;
  description: string;
  engineId: string;
  component?: React.ComponentType;
  keywords?: string[];
  icon?: LucideIcon;
  status?: UtilityStatus;
  template?: UtilityTemplate;
  acceptedFormats?: string;
  aliases?: string[];
}

export interface GroupDefinition {
  id: string; // unique groupId
  name: string;
  description: string;
  icon: LucideIcon;
  badgeGradient: string;
  utilities: UtilityDefinition[];
}

export interface WorkspaceDefinition {
  id: WorkspaceId;
  name: string;
  description: string;
  icon: LucideIcon;
  badgeGradient: string;
  groups: GroupDefinition[];
}
