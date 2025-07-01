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
import { getCoreStart, getDataSourceManagementSetup, getEmbeddable } from '../../../services';
import { BubbleUpInput } from './bubbleup/embeddable/types';
import './bubbleup/bubble_up_viz.scss';

interface AddButtonProps {
  addPara: (index: number, newParaContent: string, inputType: string) => Promise<void>;
}

export const ContextPanel = (props: AddButtonProps) => {
  const context = useContext(NotebookReactContext);
  console.log('context', context);
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
      // const startTime = new Date(context!.timeRange!.from);
      // const endTime = new Date(context!.timeRange!.to);

      // response = await service.fetchComparisonData({
      //   timeField: context.timeField,
      //   dataSourceId: context.dataSourceId,
      //   index: context.index,
      //   selectionStartTime: startTime,
      //   selectionEndTime: endTime,
      //   selectionFilters: context.filters,
      // });

      // const discoverFields = await service.discoverFields(
      //   response,
      //   context?.index,
      //   context?.dataSourceId
      // );
      // const difference = service.analyzeDifferences(response, discoverFields);
      // const summary = service.formatComparisonSummary(difference);
      // const specs = generateAllFieldCharts(summary);

      // const result = await callOpenSearchCluster({
      //   http: getCoreStart().http,
      //   request: {
      //     path: '/_plugins/_ml/models/aKoOY5cB6yOFQkrFEbF9/_predict',
      //     method: 'POST',
      //     body: JSON.stringify({
      //       parameters: {
      //         system_prompt: 'No system prompt',
      //         prompt: `
      // I need you to conduct a comprehensive analysis of system performance data to identify and explain anomalies. Please analyze both the problematic distribution (selectionDist) and the normal baseline (baselineDist) to produce actionable insights.
      
      // Structure your analysis as follows:
      
      // ## Investigation Results: [Concise Problem Title]
      
      // Root Cause Identified: [One-line summary of the primary issue]
      
      // [Brief executive summary paragraph with the most important insight framed in business terms]
      
      // ### 📊 Key Findings:
      
      // - Primary Culprit: [Identify the main problematic component]
      //   * [List specific endpoints/services with their performance metrics]
      //   * [Include P95/P99 values and compare to normal baselines]
      //   * [Note maximum observed deviations]
      
      // - Pattern Analysis:
      //   * [Describe the temporal pattern of the anomalies]
      //   * [Quantify affected operations]
      //   * [Note any correlations with other system behaviors]
      
      // - Downstream Impact:
      //   * [List affected dependent services with metrics]
      //   * [Quantify the cascading effects]
      
      // ### 🕵️ Evidence from Trace Analysis:
      
      // Looking at the sample traces, I can see:
      
      // - [List concrete evidence points from traces]
      // - [Include patterns in request metadata]
      // - [Highlight unusual user patterns or values]
      // - [Note any repeated scenarios that suggest testing or automation]
      
      // ### 💡 Why This is Happening:
      
      // Most Likely Cause: [Clear hypothesis about the root cause]
      
      // - [Explain the evidence supporting this hypothesis]
      // - [Note if the pattern suggests synthetic vs. real user traffic]
      // - [Identify any system design issues contributing to the problem]
      
      // Technical Root Cause:
      // - [Detail the specific technical bottlenecks]
      // - [Identify resource constraints or architectural issues]
      // - [Note service interactions causing cascading failures]
      
      // Please analyze the data thoroughly and present only evidence-based conclusions with specific metrics. Use technical precision while keeping the analysis accessible to technical managers.
      // Bold the fields you believe you have confidence in.
      
      
      // The selectionDist and baselineDist are as follow:
      //   ${JSON.stringify(summary)}
      //               `,
      //       },
      //     }),
      //   },
      //   dataSourceId: context.dataSourceId,
      // });
      // const summaryFromLLM =
      //   result.inference_results[0].output[0].dataAsMap.output.message.content[0].text;

      // await props.addPara(0, JSON.stringify({'specs': specs, 'summary': summaryFromLLM}), 'BUBBLE_UP');
      await props.addPara(0, '', 'ANOMALY_VISUALIZATION_ANALYSIS');

      // console.log('specs', specs);
      // setBubbleUpSpecs(specs);
      // setDifferenceState(difference);
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

  const factory = getEmbeddable().getEmbeddableFactory<BubbleUpInput>('vega_visualization');

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
                onSelectedDataSource={() => { }}
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
      {/* {isBubbleUpModalVisible && (
        <BubbleUpModel
          isLoading={isLoading}
          closeModal={closeModal}
          differences={differenceState}
          bubbleUpSpecs={bubbleUpSpecs}
          context={context}
        />
      )} */}
    </>
  );
};
