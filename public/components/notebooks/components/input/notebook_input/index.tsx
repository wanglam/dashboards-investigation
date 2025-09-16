/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo } from 'react';
import { EuiLoadingSpinner, EuiSmallButtonIcon, EuiTextArea } from '@elastic/eui';
import { useInputContext } from '../input_context';
import './index.scss';
import { getLocalInputParameters } from '../../helpers/per_agent_helpers';

interface NotebookInputProps {
  placeholder: string;
}

export const NotebookInput: React.FC<NotebookInputProps> = ({ placeholder }) => {
  const { inputValue, textareaRef, handleInputChange, isLoading } = useInputContext();
  const { handleSubmit, dataSourceId } = useInputContext();

  const inputParameters = useMemo(() => getLocalInputParameters(dataSourceId), [dataSourceId]);

  useEffect(() => {
    handleInputChange('');
  }, [handleInputChange]);

  return (
    <>
      <EuiTextArea
        id="nl-text-area"
        inputRef={textareaRef}
        fullWidth
        className="notebook-input__textarea"
        placeholder={placeholder}
        value={inputValue as string}
        onChange={(e) => {
          handleInputChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(inputValue as string, inputParameters);
          }
        }}
        disabled={isLoading}
        rows={1}
        resize="none"
        data-test-subj="notebook-paragraph-input-panel"
      />
      {isLoading ? (
        <EuiLoadingSpinner
          size="m"
          className="notebook-input__loading-spinner"
          data-test-subj="notebook-input-loading"
        />
      ) : (
        <div className="notebook-input__button-group">
          <EuiSmallButtonIcon
            iconType="cross"
            className="notebook-input__button"
            onClick={() => handleInputChange('')}
            aria-label="clear input"
          />
          <EuiSmallButtonIcon
            iconType="rocket"
            className="notebook-input__button"
            onClick={() => handleSubmit(inputValue as string, inputParameters)}
            aria-label="submit input"
          />
        </div>
      )}
    </>
  );
};
