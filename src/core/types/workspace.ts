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
  | 'files'
  | 'security'
  | 'media'
  | 'network'
  | 'design'
  | 'system';

export type UtilityStatus = 'ready' | 'beta' | 'soon';

export type UtilityTemplate = 'file' | 'text' | 'table' | 'calculator' | 'media';

export interface AlsoListedInRef {
  workspaceId: WorkspaceId;
  groupId?: string;
}

export type FeatureKind = 'option' | 'mode' | 'action' | 'output' | 'batch';
export type FeatureStatus = 'ready' | 'soon';

export interface FeatureOptionItem {
  label: string;
  value: any;
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  kind: FeatureKind;
  status: FeatureStatus;
  aliases?: string[];
  defaultValue?: any;
  options?: FeatureOptionItem[];
}

export interface UtilityDefinition {
  id: string; // unique utilityId
  name: string;
  description: string;
  engineId: string;
  component?: React.ComponentType;
  keywords?: string[];
  icon: LucideIcon;
  status: UtilityStatus;
  template: UtilityTemplate;
  acceptedFormats: string[];
  aliases: string[];
  alsoListedIn?: WorkspaceId[] | AlsoListedInRef[];
  primaryWorkspaceId?: WorkspaceId;
  primaryGroupId?: string;
  isSecondaryListing?: boolean;
  features?: FeatureDefinition[];
  mode?: 'pages' | 'tray' | 'markers' | 'panel' | 'annotate' | 'info' | 'editor' | 'standalone' | 'trim' | 'table' | 'inspect' | 'analyzer';
  accepts?: 'one' | 'many';
  inputTypes?: string[];
  needsFile?: boolean;
  primaryLabel?: string;
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
  workbench?: 'file' | 'editor' | 'standalone';
}
