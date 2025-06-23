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
  EuiSpacer,
} from '@elastic/eui';
import React, { useCallback, useContext, useState } from 'react';
import moment from 'moment';
import { BubbleUpModel } from './bubbleup/bubbleup_model';
import { bubbleUpDataDistributionService } from './bubbleup/distribution_difference';
import { generateAllFieldCharts } from './bubbleup/render_bubble_vega';
import { NotebookReactContext } from '../context_provider/context_provider';
import { getCoreStart, getDataSourceManagementSetup } from '../../../services';

export const ContextPanel = () => {
  const context = useContext(NotebookReactContext);
  const coreStart = getCoreStart();
  const dataSourceManagementSetup = getDataSourceManagementSetup();

  const [isBubbleUpModalVisible, setIsBubbleUpModalVisible] = useState(false);
  const [bubbleUpSpecs, setBubbleUpSpecs] = useState<Array<Record<string, unknown>>>([]);
  const [differenceState, setDifferenceState] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => {
    setIsBubbleUpModalVisible(false);
    setIsLoading(false);
  };

  const fetchBubbleData = useCallback(async () => {
    setIsLoading(true);
    setIsBubbleUpModalVisible(true);

    const service = bubbleUpDataDistributionService;

    let response: {
      selection: Array<Record<string, any>>;
      baseline: Array<Record<string, any>>;
    };

    if (!context) {
      return;
    }

    try {
      const endDate = new Date('2025-5-21');
      endDate.setHours(16);
      endDate.setMinutes(4);
      endDate.setSeconds(12);
      let startTime = new Date(endDate.getTime() - 12 * 1000);
      let endTime = endDate;
      if (context?.timeRange?.from) {
        startTime = new Date(context.timeRange.from);
        if (context.timeRange.to) {
          endTime = new Date(context.timeRange.to);
        } else {
          endTime = new Date();
        }
      }

      response = await service.fetchComparisonData({
        timeField: context.timeField,
        dataSourceId: context.dataSourceId,
        index: context.index,
        selectionStartTime: startTime,
        selectionEndTime: endTime,
        selectionFilter: context.filter,
      });

      const discoverFields = await service.discoverFields(
        response,
        context?.index,
        context?.dataSourceId
      );
      const difference = service.analyzeDifferences(response, discoverFields);
      const summary = service.formatComparisonSummary(difference);
      const specs = generateAllFieldCharts(summary);
      console.log('specs', specs);
      setBubbleUpSpecs(specs);
      setDifferenceState(difference);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }, [context]);

  if (!context) {
    return null;
  }

  const DataSourceSelector =
    dataSourceManagementSetup.enabled &&
    dataSourceManagementSetup.dataSourceManagement.ui.DataSourceSelector;
  const indexOptions = [{ label: context.index, id: context.index }];

  return (
    <>
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle>
          <h3>Global Context</h3>
        </EuiTitle>
        <EuiFlexGroup gutterSize="m" alignItems="center">
          {DataSourceSelector ? (
            <EuiFlexItem>
              <DataSourceSelector
                savedObjectsClient={coreStart.savedObjects.client}
                disabled
                notifications={coreStart.notifications.toasts}
                onSelectedDataSource={() => {}}
                fullWidth
                defaultOption={[
                  {
                    id: context.dataSourceId || '',
                  },
                ]}
              />
            </EuiFlexItem>
          ) : null}
          <EuiFlexItem>
            <EuiComboBox
              singleSelection={{ asPlainText: true }}
              isDisabled={true}
              prepend="Index"
              options={indexOptions}
              selectedOptions={indexOptions}
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

          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="paragraphToggleBubbleUpBtn"
              aria-label="Bubble up button"
              onClick={fetchBubbleData}
              isLoading={isLoading}
            >
              Analyze data
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        {context.summary ? (
          <EuiCard title={context.source}>
            {context.summary && <EuiMarkdownFormat>{context.summary}</EuiMarkdownFormat>}
          </EuiCard>
        ) : null}
      </EuiPanel>
      {isBubbleUpModalVisible && (
        <BubbleUpModel
          isLoading={isLoading}
          closeModal={closeModal}
          differences={differenceState}
          bubbleUpSpecs={bubbleUpSpecs}
          context={context}
        />
      )}
    </>
  );
};
