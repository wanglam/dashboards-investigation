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
  EuiSmallButton,
} from '@elastic/eui';
import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { BubbleUpModel } from './bubbleup/bubbleup_model';
import { bubbleUpDataDistributionService } from './bubbleup/distribution_difference';
import { generateAllFieldCharts } from './bubbleup/render_bubble_vega';

interface ContextPanelProps {
  context: any; // TODO: add type information
}

export const ContextPanel = ({ context}: ContextPanelProps) => {
  console.log('context', context);
  const dataSourceOptions = [
    { label: context?.dataSourceTitle ?? '', id: context?.dataSourceId ?? '' },
  ];
  const indexPatternOptions = [
    { label: context?.indexPatternTitle ?? '', id: context?.indexPatternId ?? '' },
  ];

  const [isBubbleUpModalVisible, setIsBubbleUpModalVisible] = useState(false);
  const [bubbleUpSpecs, setBubbleUpSpecs] = useState<Object[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => {
    setIsBubbleUpModalVisible(false);
    setIsLoading(false);
  }

  const fetchBubbleData = useCallback(async () => {
    setIsLoading(true);
    setIsBubbleUpModalVisible(true);

    const service = bubbleUpDataDistributionService;

    let response: {
      selection: Record<string, any>[];
      baseline: Record<string, any>[];
    };

    try {
      if (context?.content) {
        response = await service.fetchComparisonData2(context.timeField, context.dataSourceId, context.indexPatternTitle, JSON.parse(context.content), new Date(context.time))
        console.log('response', response);
      } else {
        const endDate = new Date('2025-5-21');
        endDate.setHours(16);
        endDate.setMinutes(4);
        endDate.setSeconds(12);
        response = await service.fetchComparisonData(context.timeField, context.dataSourceId, context.indexPatternTitle, new Date(endDate.getTime() - 12 * 1000), endDate)
      }

      const discoverFields = await service.discoverFields(response, context?.indexPatternId);
      const difference = service.analyzeDifferences(response, discoverFields);
      const summary = service.formatComparisonSummary(difference);
      const specs = generateAllFieldCharts(summary);
      setBubbleUpSpecs(specs);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }, [context]);

  return (
    <>
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
                  onChange={() => { }}
                  aria-label="Start date"
                  showTimeSelect
                />
              }
              endDateControl={
                <EuiDatePicker
                  selected={moment(context?.timeRange?.to)}
                  onChange={() => { }}
                  aria-label="End date"
                  showTimeSelect
                />
              }
            />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="paragraphToggleBubbleUpBtn"
              aria-label="Bubble up button"
              onClick={fetchBubbleData}
              isLoading={isLoading}
            >
              bubble up
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiCard title={context?.source}>
          {context?.content && <EuiMarkdownFormat>{context?.content}</EuiMarkdownFormat>}
        </EuiCard>
      </EuiPanel>
      {isBubbleUpModalVisible && <BubbleUpModel isLoading={isLoading} closeModal={closeModal} bubbleUpSpecs={bubbleUpSpecs} />}
    </>
  );
};
