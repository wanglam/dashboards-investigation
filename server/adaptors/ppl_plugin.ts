/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OPENSEARCH_DATACONNECTIONS_API,
  PPL_ENDPOINT,
  SQL_ENDPOINT,
} from '../../common/constants/shared';

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

  notebook.getDataConnectionById = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}/<%=dataconnection%>`,
      req: {
        dataconnection: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  notebook.deleteDataConnection = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}/<%=dataconnection%>`,
      req: {
        dataconnection: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  notebook.createDataSource = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}`,
    },
    needBody: true,
    method: 'POST',
  });

  notebook.modifyDataConnection = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}`,
    },
    needBody: true,
    method: 'PATCH',
  });

  notebook.getDataConnections = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}`,
    },
    method: 'GET',
  });
};
