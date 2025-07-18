/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPL_ENDPOINT, SQL_ENDPOINT } from '../../common/constants/shared';

export const PPLPlugin = function (Client, config, components) {
  const ca = components.clientAction.factory;
  Client.prototype.notebook = components.clientAction.namespaceFactory();
  const notebook = Client.prototype.notebook.prototype;

  notebook.pplQuery = ca({
    url: {
      fmt: `${PPL_ENDPOINT}`,
      params: {
        format: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  notebook.sqlQuery = ca({
    url: {
      fmt: `${SQL_ENDPOINT}`,
      params: {
        format: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });
};
