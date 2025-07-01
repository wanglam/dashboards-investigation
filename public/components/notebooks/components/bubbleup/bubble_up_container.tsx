/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useMemo, useState } from 'react';
import { EuiAccordion, EuiFlexGrid, EuiFlexGroup, EuiFlexItem, EuiMarkdownFormat, EuiPagination, EuiSpacer, EuiSteps } from '@elastic/eui';
import { getEmbeddable } from '../../../../services';
import { CoreStart } from '../../../../../../../src/core/public';
import { ParaType } from '../../../../../common/types/notebooks';
import { BubbleUpInput } from './embeddable/types';
import { EmbeddableRenderer } from '../../../../../../../src/plugins/embeddable/public';
import './bubble_up_viz.scss';
import { NotebookReactContext } from '../../context_provider/context_provider';
import { useEffect } from 'react';
import { bubbleUpDataDistributionService } from './distribution_difference';
import { generateAllFieldCharts } from './render_bubble_vega';
import { callOpenSearchCluster } from '../../../../plugin_helpers/plugin_proxy_call';
import { EuiContainedStepProps } from '@elastic/eui/src/components/steps/steps';

interface Props {
  http: CoreStart['http'];
  para: ParaType;
  updateBubbleParagraph: (paraUniqueId: string, result: string) => Promise<any>;
  updateNotebookContext: (newContext: any) => Promise<any>;
}

const ITEMS_PER_PAGE = 8;

export const BubbleUpContainer = ({ para, http, updateBubbleParagraph, updateNotebookContext }: Props) => {
  const context = useContext(NotebookReactContext);
  if (!context) {
    return null;
  }
  const [activePage, setActivePage] = useState(0);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [bubbleUpSpecs, setBubbleUpSpecs] = useState<Array<Record<string, unknown>>>([]);
  const [summary, setSummary] = useState<string>();
  const [summaryLoading, setSummaryLoading] = useState(false);
  const factory = getEmbeddable().getEmbeddableFactory<BubbleUpInput>('vega_visualization');
  const service = bubbleUpDataDistributionService;

  useEffect(() => {
    const loadSpecsData = async () => {
      setSpecsLoading(true);

      if (context?.specs && context.specs.length > 0) {
        const specs = generateAllFieldCharts(context.specs);
        setBubbleUpSpecs(specs);
        setSpecsLoading(false);
        return context.specs;
      }

      if (!context.timeRange || !context.timeField || !context.dataSourceId || !context.index) {
        console.error('Missing required context for data fetch');
        return;
      }

      try {
        const startTime = new Date(context.timeRange.from);
        const endTime = new Date(context.timeRange.to!);

        const response = await service.fetchComparisonData({
          timeField: context.timeField,
          dataSourceId: context.dataSourceId,
          index: context.index,
          selectionStartTime: startTime,
          selectionEndTime: endTime,
          selectionFilters: context.filters,
        });

        const discoverFields = await service.discoverFields(
          response,
          context.index,
          context.dataSourceId
        );

        const difference = service.analyzeDifferences(response, discoverFields);
        const summaryData = service.formatComparisonSummary(difference);
        const specs = generateAllFieldCharts(summaryData);

        setBubbleUpSpecs(specs);
        if (context.updateSpecs) {
          context.updateSpecs(summaryData);
        }
        await updateNotebookContext({ ...context, specs: summaryData });
      } catch (error) {
        console.error('Error fetching or processing data:', error);
      } finally {
        setSpecsLoading(false);
      }
    };

    loadSpecsData();
  }, []);

  useEffect(() => {

    if (!bubbleUpSpecs || bubbleUpSpecs.length === 0) return;

    const loadSummary = async () => {
      setSummaryLoading(true);

      if (para.out && para.out.length > 0) {
        try {
          const savedOutput = JSON.parse(para.out[0]);
          if (savedOutput.summary) {
            setSummary(savedOutput.summary);
            setSummaryLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing saved output:', e);
        }
      }

      try {
        setSummary('');
        const result = await callOpenSearchCluster({
          http: http,
          request: {
            path: '/_plugins/_ml/models/aKoOY5cB6yOFQkrFEbF9/_predict',
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
        
        ### Key Findings:
        - Primary Issue: [Main component with metrics]
          * [List specific endpoints/services with their performance metrics]
          * [Include P95/P99 values and compare to normal baselines]
          * [Note maximum observed deviations]
        - Pattern Observed: [Temporal patterns, frequency]
        - Impact: [Affected services/users]
        
        ### Data Insights:
        - [3-4 concrete data points supporting your conclusion]
        - [Include specific metrics/deviations]

        ### Root Cause Analysis:
        - Most Likely Cause: [Clear hypothesis]
        - Technical Explanation: [Brief technical explanation]
        - [Include specific metrics where available]
        
        Please analyze the data thoroughly and present only evidence-based conclusions with specific metrics. Use technical precision while keeping the analysis accessible to technical managers.
        Bold the fields you believe you have confidence in.
        
        The selectionDist and baselineDist are as follow:
          ${JSON.stringify(bubbleUpSpecs.slice(0, 15))}
                      `,
              },
            }),
          },
          dataSourceId: context.dataSourceId,
        });
        const summaryFromLLM =
          result.inference_results[0].output[0].dataAsMap.output.message.content[0].text;
        setSummary(summaryFromLLM);
        setSummaryLoading(false);

        await updateBubbleParagraph(
          para.uniqueId,
          JSON.stringify({ summary: summaryFromLLM })
        );
      } catch (error) {
        console.error('Error fetching or processing data:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [bubbleUpSpecs]);

  const { paginatedSpecs, totalPages } = useMemo(() => {
    if (!bubbleUpSpecs?.length) return { paginatedSpecs: [], totalPages: 0 };

    const start = activePage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return {
      paginatedSpecs: bubbleUpSpecs.slice(start, end),
      totalPages: Math.ceil(bubbleUpSpecs.length / ITEMS_PER_PAGE)
    };
  }, [bubbleUpSpecs, activePage]);


  const steps: EuiContainedStepProps[] = [
    {
      title: 'Anomaly Visualization',
      status: specsLoading ? 'loading' : 'complete',
      children: !specsLoading && (
        <EuiAccordion id="accordion1" buttonContent="Show the anomaly visualization" initialIsOpen={true} >
          <EuiFlexGrid columns={4} >
            {paginatedSpecs.map((spec, index) => (
              <EuiFlexItem key={activePage * ITEMS_PER_PAGE + index} style={{ height: 300, width: 300 }}>
                {factory && spec && (
                  <EmbeddableRenderer
                    factory={factory}
                    input={{
                      id: `text2viz-${activePage * ITEMS_PER_PAGE + index}`,
                      savedObjectId: '',
                      visInput: { spec }
                    }}
                  />
                )}
              </EuiFlexItem>
            ))}
          </EuiFlexGrid>
          <EuiSpacer size="l" />
          {totalPages > 1 && (
            <EuiFlexGroup justifyContent="center">
              <EuiFlexItem grow={false}>
                <EuiPagination
                  pageCount={totalPages}
                  activePage={activePage}
                  onPageClick={setActivePage}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </EuiAccordion>
      ),
    },
    {
      title: 'Anomaly Summary',
      status: specsLoading ? undefined : summaryLoading ? 'loading' : 'complete',
      children: !summaryLoading &&(
        summary && (<EuiAccordion id="accordion2" buttonContent="Show the anomaly summary" initialIsOpen={true} ><EuiMarkdownFormat>{summary}</EuiMarkdownFormat> </EuiAccordion>)
      ),
    },
  ];

  return (
    <EuiSteps steps={steps}/>
  );
}


