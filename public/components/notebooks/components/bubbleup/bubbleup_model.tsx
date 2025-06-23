/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiEmptyPrompt,
  EuiLoadingLogo,
  EuiModalBody,
  EuiFlexGrid,
  EuiFlexItem,
  EuiModalFooter,
  EuiButton,
  EuiMarkdownFormat,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { EmbeddableRenderer } from '../../../../../../../src/plugins/embeddable/public';
import { getCoreStart, getEmbeddable } from '../../../../services';
import { BubbleUpInput } from './embeddable/types';

import './bubble_up_viz.scss';
import { NotebookContext } from '../../../../../common/types/notebooks';
import { callOpenSearchCluster } from '../../../../plugin_helpers/plugin_proxy_call';

interface BubbleUpModelProps {
  isLoading: boolean;
  closeModal: () => void;
  bubbleUpSpecs: Array<Record<string, unknown>>;
  differences: Array<Record<string, unknown>>;
  context: NotebookContext;
}

export const BubbleUpModel = (bubbleUpModelProps: BubbleUpModelProps) => {
  const { isLoading, closeModal, bubbleUpSpecs, differences, context } = bubbleUpModelProps;
  const factory = getEmbeddable().getEmbeddableFactory<BubbleUpInput>('vega_visualization');
  const [summary, setSummary] = useState('');
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  useEffect(() => {
    (async () => {
      if (isLoading || differences.length === 0) {
        return;
      }
      setSummary('');
      setIsFetchingSummary(true);
      const result = await callOpenSearchCluster({
        http: getCoreStart().http,
        request: {
          path: '/_plugins/_ml/models/EioggpcB6GVIpQ1tQ9p6/_predict',
          method: 'POST',
          body: JSON.stringify({
            parameters: {
              system_prompt: 'No system prompt',
              prompt: `
I need you to conduct a comprehensive analysis of system performance data to identify and explain anomalies. Please analyze both the problematic distribution (selectionDist) and the normal baseline (baselineDist) to produce actionable insights.

Structure your analysis as follows:

## Investigation Results: [Concise Problem Title]

Root Cause Identified: [One-line summary of the primary issue]

[Brief executive summary paragraph with the most important insight framed in business terms]

### 📊 Key Findings:

- Primary Culprit: [Identify the main problematic component]
  * [List specific endpoints/services with their performance metrics]
  * [Include P95/P99 values and compare to normal baselines]
  * [Note maximum observed deviations]

- Pattern Analysis:
  * [Describe the temporal pattern of the anomalies]
  * [Quantify affected operations]
  * [Note any correlations with other system behaviors]

- Downstream Impact:
  * [List affected dependent services with metrics]
  * [Quantify the cascading effects]

### 🕵️ Evidence from Trace Analysis:

Looking at the sample traces, I can see:

- [List concrete evidence points from traces]
- [Include patterns in request metadata]
- [Highlight unusual user patterns or values]
- [Note any repeated scenarios that suggest testing or automation]

### 💡 Why This is Happening:

Most Likely Cause: [Clear hypothesis about the root cause]

- [Explain the evidence supporting this hypothesis]
- [Note if the pattern suggests synthetic vs. real user traffic]
- [Identify any system design issues contributing to the problem]

Technical Root Cause:
- [Detail the specific technical bottlenecks]
- [Identify resource constraints or architectural issues]
- [Note service interactions causing cascading failures]

Please analyze the data thoroughly and present only evidence-based conclusions with specific metrics. Use technical precision while keeping the analysis accessible to technical managers.
Bold the fields you believe you have confidence in.


The selectionDist and baselineDist are as follow:
  ${JSON.stringify(differences.slice(0, 30))}
              `,
            },
          }),
        },
        dataSourceId: context.dataSourceId,
      });
      const summaryFromLLM =
        result.inference_results[0].output[0].dataAsMap.output.message.content[0].text;
      setSummary(summaryFromLLM);
      setIsFetchingSummary(false);
    })();
  }, [isLoading, differences]);
  return (
    <EuiModal onClose={closeModal} style={{ width: '80vw', maxWidth: '1400px' }}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Analytics Modal</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      {isLoading || isFetchingSummary ? (
        <EuiEmptyPrompt
          icon={<EuiLoadingLogo logo="visPie" size="xl" />}
          title={<h2>Loading Analytics Visualization</h2>}
        />
      ) : (
        <EuiModalBody>
          {summary ? <EuiMarkdownFormat>{summary}</EuiMarkdownFormat> : null}
          <EuiFlexGrid columns={4}>
            {bubbleUpSpecs &&
              bubbleUpSpecs.map((spec, index) => (
                <EuiFlexItem key={index} style={{ height: 300, width: 300 }}>
                  {factory && spec && (
                    <EmbeddableRenderer
                      factory={factory}
                      input={{ id: 'text2viz', savedObjectId: '', visInput: { spec } }}
                    />
                  )}
                </EuiFlexItem>
              ))}
          </EuiFlexGrid>
        </EuiModalBody>
      )}

      <EuiModalFooter>
        <EuiButton onClick={closeModal} fill>
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
