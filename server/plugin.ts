/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  CoreStart,
  ILegacyClusterClient,
  Logger,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/server';
import { DataSourcePluginSetup } from '../../../src/plugins/data_source/server/types';
import { DataSourceManagementPlugin } from '../../../src/plugins/data_source_management/public/plugin';
import { PPLPlugin } from './adaptors/ppl_plugin';
import { setupRoutes } from './routes/index';
import { notebookSavedObject } from './saved_objects/observability_saved_object';
import { AssistantPluginSetup, ObservabilityPluginSetup, ObservabilityPluginStart } from './types';

export interface ObservabilityPluginSetupDependencies {
  dataSourceManagement: ReturnType<DataSourceManagementPlugin['setup']>;
  dataSource: DataSourcePluginSetup;
}

export class ObservabilityPlugin
  implements Plugin<ObservabilityPluginSetup, ObservabilityPluginStart> {
  private readonly logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(
    core: CoreSetup,
    deps: {
      assistantDashboards?: AssistantPluginSetup;
      dataSource: ObservabilityPluginSetupDependencies;
    }
  ) {
    const { dataSource } = deps;
    this.logger.debug('Observability: Setup');
    const router = core.http.createRouter();

    const dataSourceEnabled = !!dataSource;
    const openSearchObservabilityClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_notebook',
      {
        plugins: [PPLPlugin],
      }
    );
    if (dataSourceEnabled) {
      dataSource.registerCustomApiSchema(PPLPlugin);
    }

    // Register server side APIs
    setupRoutes({
      router,
      client: openSearchObservabilityClient,
      dataSourceEnabled,
      logger: this.logger,
    });

    core.savedObjects.registerType(notebookSavedObject);

    return {};
  }

  public start(_core: CoreStart) {
    this.logger.debug('Observability: Started');
    return {};
  }

  public stop() {}
}
