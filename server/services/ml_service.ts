/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPENSEARCH_ML_COMMONS_API } from '../../common/constants/ml_commons';
import { OpenSearchClient } from '../../../../src/core/server';

export class MLService {
  constructor() {}

  getTask = async ({
    transport,
    taskId,
  }: {
    transport: OpenSearchClient['transport'];
    taskId: string;
  }) =>
    transport
      .request({
        path: OPENSEARCH_ML_COMMONS_API.singleTask.replace('{taskId}', taskId),
        method: 'GET',
      })
      .then(({ body }) => body);

  executeAgent = async ({
    transport,
    agentId,
    async,
  }: {
    transport: OpenSearchClient['transport'];
    agentId: string;
    async?: boolean;
  }) =>
    transport.request({
      path: OPENSEARCH_ML_COMMONS_API.agentExecute.replace('{agentId}', agentId),
      method: 'GET',
      querystring: async ? 'async=true' : undefined,
    });
}
