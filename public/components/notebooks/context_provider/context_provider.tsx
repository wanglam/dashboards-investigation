/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { NotebookContext } from '../../../../common/types/notebooks';

export const NotebookReactContext = React.createContext<NotebookContext | undefined>(undefined);

export const NotebookContextProvider = (props: {
  children: React.ReactChild;
  contextInput?: NotebookContext;
}) => {
  const [specs, setSpecs] = useState<Array<Record<string, unknown>>>(
    props.contextInput?.specs || []
  );

  useEffect(() => {
    if (props.contextInput?.specs) {
      setSpecs(props.contextInput.specs);
    }
  }, [props.contextInput?.specs]);

  const updateSpecs = (newSpecs: Array<Record<string, unknown>>) => {
    setSpecs(newSpecs);
  };
  return (
    <NotebookReactContext.Provider
      value={props.contextInput ? { ...props.contextInput, updateSpecs, specs } : undefined}
    >
      {props.children}
    </NotebookReactContext.Provider>
  );
};
