/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { investigationNotebookID } from '../../../../../common/constants/shared';

export const convertLegacyNotebooksUrl = (location: Location) => {
  const pathname = location.pathname.replace('notebooks-dashboards', investigationNotebookID);
  const hash = `${location.hash}${
    location.hash.includes('?') ? location.search.replace(/^\?/, '&') : location.search
  }`;
  return pathname + hash;
};
