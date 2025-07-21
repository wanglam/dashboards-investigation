/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  investigationNotebookID,
  investigationNotebookPluginOrder,
  investigationNotebookTitle,
} from '../common/constants/shared';
import { setOSDHttp, setOSDSavedObjectsClient, uiSettingsService } from '../common/utils';
import { coreRefs } from './framework/core_refs';
import { registerAllPluginNavGroups } from './plugin_helpers/plugin_nav';
import PPLService from './services/requests/ppl';
import {
  AppPluginStartDependencies,
  InvestigationSetup,
  InvestigationStart,
  SetupDependencies,
} from './types';

import './index.scss';
import { BubbleUpEmbeddableFactory } from './components/notebooks/components/bubbleup/embeddable/BubbleUpEmbeddableFactory';
import {
  setClient,
  setCoreStart,
  setData,
  setDataSourceManagementSetup,
  setEmbeddable,
  setExpressions,
  setSearch,
} from './services';

export class InvestigationPlugin
  implements
    Plugin<InvestigationSetup, InvestigationStart, SetupDependencies, AppPluginStartDependencies> {
  public setup(
    core: CoreSetup<AppPluginStartDependencies>,
    setupDeps: SetupDependencies
  ): ObservabilitySetup {
    uiSettingsService.init(core.uiSettings, core.notifications);
    const pplService = new PPLService(core.http);
    setOSDHttp(core.http);
    core.getStartServices().then(([coreStart]) => {
      setOSDSavedObjectsClient(coreStart.savedObjects.client);
    });

    const appMountWithStartPage = () => async (params: AppMountParameters) => {
      const { Observability } = await import('./components/index');
      const [coreStart, depsStart] = await core.getStartServices();
      const { dataSourceManagement } = setupDeps;
      return Observability(
        coreStart,
        depsStart as AppPluginStartDependencies,
        params,
        dataSourceManagement,
        coreStart.savedObjects
      );
    };

    core.application.register({
      id: investigationNotebookID,
      title: investigationNotebookTitle,
      order: investigationNotebookPluginOrder,
      mount: appMountWithStartPage(),
    });

    registerAllPluginNavGroups(core);

    setupDeps.embeddable.registerEmbeddableFactory(
      'vega_visualization',
      new BubbleUpEmbeddableFactory()
    );

    setDataSourceManagementSetup(
      !!setupDeps.dataSourceManagement
        ? {
            enabled: true,
            dataSourceManagement: setupDeps.dataSourceManagement,
          }
        : {
            enabled: false,
            dataSourceManagement: undefined,
          }
    );

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart, startDeps: AppPluginStartDependencies): ObservabilityStart {
    const pplService: PPLService = new PPLService(core.http);

    coreRefs.core = core;
    coreRefs.http = core.http;
    coreRefs.savedObjectsClient = core.savedObjects.client;
    coreRefs.pplService = pplService;
    coreRefs.toasts = core.notifications.toasts;
    coreRefs.chrome = core.chrome;
    coreRefs.dataSources = startDeps.data;
    coreRefs.application = core.application;
    coreRefs.dashboard = startDeps.dashboard;
    coreRefs.overlays = core.overlays;
    coreRefs.dataSource = startDeps.dataSource;
    coreRefs.navigation = startDeps.navigation;
    coreRefs.contentManagement = startDeps.contentManagement;
    coreRefs.workspaces = core.workspaces;

    setExpressions(startDeps.expressions);
    setData(startDeps.data);
    setEmbeddable(startDeps.embeddable);
    setSearch(startDeps.data.search);
    setCoreStart(core);
    setClient(core.http);

    // Export so other plugins can use this flyout
    return {};
  }

  public stop() {}
}
