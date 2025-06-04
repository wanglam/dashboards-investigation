/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCard,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiDatePicker,
  EuiDatePickerRange,
  EuiMarkdownFormat,
} from '@elastic/eui';
import React from 'react';
import moment from 'moment';

interface ContextPanelProps {
  context: any; // TODO: add type information
}

export const ContextPanel = ({ context }: ContextPanelProps) => {
  console.log('context', context);
  const dataSourceOptions = [
    { label: context?.dataSourceTitle ?? '', id: context?.dataSourceId ?? '' },
  ];
  const indexPatternOptions = [
    { label: context?.indexPatternTitle ?? '', id: context?.indexPatternId ?? '' },
  ];

  return (
    <EuiPanel>
      <EuiTitle>
        <h3>Global Context</h3>
      </EuiTitle>
      <EuiFlexGroup gutterSize="m" alignItems="center">
        <EuiFlexItem>
          <EuiComboBox
            singleSelection={{ asPlainText: true }}
            isDisabled={true}
            prepend="Data source"
            selectedOptions={dataSourceOptions}
            options={dataSourceOptions}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiComboBox
            singleSelection={{ asPlainText: true }}
            isDisabled={true}
            prepend="Index"
            options={indexPatternOptions}
            selectedOptions={indexPatternOptions}
          />
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiDatePickerRange
            readOnly={true}
            startDateControl={
              <EuiDatePicker
                selected={moment(context?.timeRange?.from)}
                onChange={() => {}}
                aria-label="Start date"
                showTimeSelect
              />
            }
            endDateControl={
              <EuiDatePicker
                selected={moment(context?.timeRange?.to)}
                onChange={() => {}}
                aria-label="End date"
                showTimeSelect
              />
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiCard title={context?.source}>
        {context?.content && <EuiMarkdownFormat>{context?.content}</EuiMarkdownFormat>}
      </EuiCard>
    </EuiPanel>
  );
};
