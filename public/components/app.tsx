/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import { QueryManager } from 'common/query_manager';
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
  dslService: any;
  savedObjects: any;
  timestampUtils: any;
  queryManager: QueryManager;
  startPage: string;
  dataSourceEnabled: boolean;
  dataSourceManagement: DataSourceManagementPluginSetup;
  setActionMenu: (menuMount: MountPoint | undefined) => void;
  savedObjectsMDSClient: CoreStart['savedObjects'];
  defaultRoute?: string;
}

const pages = {
  notebooks: NotebooksHome,
};

export const App = ({
  CoreStartProp,
  DepsStart,
  pplService,
  dslService,
  savedObjects,
  timestampUtils,
  queryManager,
  startPage,
  dataSourceManagement,
  setActionMenu,
  dataSourceEnabled,
  savedObjectsMDSClient,
  defaultRoute,
}: ObservabilityAppDeps) => {
  const { chrome, http, notifications, savedObjects: _coreSavedObjects } = CoreStartProp;
  const parentBreadcrumb = {
    text: observabilityTitle,
    href: `${observabilityID}#/`,
  };

  const ModuleComponent = pages[startPage];

  return (
    <I18nProvider>
      <ModuleComponent
        http={http}
        chrome={chrome}
        notifications={notifications}
        CoreStartProp={CoreStartProp}
        DepsStart={DepsStart}
        DashboardContainerByValueRenderer={DepsStart.dashboard.DashboardContainerByValueRenderer}
        pplService={pplService}
        dslService={dslService}
        savedObjects={savedObjects}
        timestampUtils={timestampUtils}
        queryManager={queryManager}
        parentBreadcrumb={parentBreadcrumb}
        parentBreadcrumbs={[parentBreadcrumb]}
        setBreadcrumbs={chrome.setBreadcrumbs}
        dataSourceManagement={dataSourceManagement}
        dataSourceEnabled={dataSourceEnabled}
        setActionMenu={setActionMenu}
        savedObjectsMDSClient={savedObjectsMDSClient}
        defaultRoute={defaultRoute}
      />
    </I18nProvider>
  );
};
