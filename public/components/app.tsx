/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import React from 'react';
import { CoreStart, MountPoint } from '../../../../src/core/public';
import { DataSourceManagementPluginSetup } from '../../../../src/plugins/data_source_management/public';
import { observabilityID, observabilityTitle } from '../../common/constants/shared';
import { AppPluginStartDependencies } from '../types';
import { Main as NotebooksHome } from './notebooks/components/main';

interface ObservabilityAppDeps {
  CoreStartProp: CoreStart;
  DepsStart: AppPluginStartDependencies;
  pplService: any;
  dataSourceEnabled: boolean;
  dataSourceManagement: DataSourceManagementPluginSetup;
  setActionMenu: (menuMount: MountPoint | undefined) => void;
  savedObjectsMDSClient: CoreStart['savedObjects'];
}

const pages = {
  notebooks: NotebooksHome,
};

export const App = ({
  CoreStartProp,
  DepsStart,
  pplService,
  dataSourceManagement,
  setActionMenu,
  dataSourceEnabled,
  savedObjectsMDSClient,
}: ObservabilityAppDeps) => {
  const { chrome, http, notifications, savedObjects: _coreSavedObjects } = CoreStartProp;
  const parentBreadcrumb = {
    text: observabilityTitle,
    href: `${observabilityID}#/`,
  };

  const ModuleComponent = pages.notebooks;

  return (
    <I18nProvider>
      <ModuleComponent
        http={http}
        notifications={notifications}
        DashboardContainerByValueRenderer={DepsStart.dashboard.DashboardContainerByValueRenderer}
        pplService={pplService}
        parentBreadcrumb={parentBreadcrumb}
        setBreadcrumbs={chrome.setBreadcrumbs}
        dataSourceManagement={dataSourceManagement}
        dataSourceEnabled={dataSourceEnabled}
        setActionMenu={setActionMenu}
        savedObjectsMDSClient={savedObjectsMDSClient}
      />
    </I18nProvider>
  );
};
