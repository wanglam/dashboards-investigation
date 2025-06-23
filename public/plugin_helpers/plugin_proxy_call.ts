/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpFetchOptionsWithPath, HttpStart } from '../../../../src/core/public';

export const callOpenSearchCluster = (props: {
  http: HttpStart;
  dataSourceId?: string;
  request: Pick<HttpFetchOptionsWithPath, 'path' | 'method' | 'body'>;
}) => {
  const path = props.request.path;
  const query: HttpFetchOptionsWithPath['query'] = {
    path,
    method: props.request.method || 'GET',
  };
  if (props.dataSourceId) {
    query.dataSourceId = props.dataSourceId;
  }
  return props.http.post({
    path: '/api/console/proxy',
    query,
    body: props.request.body,
  });
};
