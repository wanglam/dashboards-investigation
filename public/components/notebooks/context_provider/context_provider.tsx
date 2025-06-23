/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NotebookContext } from '../../../../common/types/notebooks';

export const NotebookReactContext = React.createContext<NotebookContext | undefined>(undefined);

export const NotebookContextProvider = (props: {
  children: React.ReactChild;
  contextInput?: NotebookContext;
}) => {
  return (
    <NotebookReactContext.Provider
      value={props.contextInput ? { ...props.contextInput } : undefined}
    >
      {props.children}
    </NotebookReactContext.Provider>
  );
};
