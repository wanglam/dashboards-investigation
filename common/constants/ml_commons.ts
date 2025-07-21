/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const INVESTIGATION_ML_COMMONS_API_PREFIX = '/api/investigation/ml-commons';
export const INVESTIGATION_ML_COMMONS_API = {
  singleTask: `${INVESTIGATION_ML_COMMONS_API_PREFIX}/tasks/{taskId}`,
  agents: `${INVESTIGATION_ML_COMMONS_API_PREFIX}/agents`,
  memory: `${INVESTIGATION_ML_COMMONS_API_PREFIX}/memory`,
  singleMemory: `${INVESTIGATION_ML_COMMONS_API_PREFIX}/memory/{memoryId}`,
  memoryMessages: `${INVESTIGATION_ML_COMMONS_API_PREFIX}/memory/{memoryId}/messages`,
  messageTraces: `${INVESTIGATION_ML_COMMONS_API_PREFIX}/memory/message/{messageId}/traces`,
};

const OPENSEARCH_ML_COMMONS_API_PREFIX = '/_plugins/_ml';

export const OPENSEARCH_ML_COMMONS_API = {
  singleTask: `${OPENSEARCH_ML_COMMONS_API_PREFIX}/tasks/{taskId}`,
  agentsSearch: `${OPENSEARCH_ML_COMMONS_API_PREFIX}/agents/_search`,
  memorySearch: `${OPENSEARCH_ML_COMMONS_API_PREFIX}/memory/_search`,
  singleMemory: `${OPENSEARCH_ML_COMMONS_API_PREFIX}/memory/{memoryId}`,
  memoryMessages: `${OPENSEARCH_ML_COMMONS_API_PREFIX}/memory/{memoryId}/messages`,
  messageTraces: `${OPENSEARCH_ML_COMMONS_API_PREFIX}/memory/message/{messageId}/traces`,
};
