/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useEffect, useState } from 'react';
import { getEmbeddable } from 'public/services';
import { NotebookReactContext } from '../context_provider/context_provider';
import { BubbleUpInput } from './bubbleup/embeddable/types';
import { bubbleUpDataDistributionService } from './bubbleup/distribution_difference';
import { generateAllFieldCharts } from './bubbleup/render_bubble_vega';

interface Props {
  //   http: CoreStart['http'];
  //   para: ParaType;
  //   updateBubbleParagraph: (paraUniqueId: string, result: string) => Promise<any>;
  updateNotebookContext: (newContext: any) => Promise<any>;
}

export const BubbleUpCard = (props: Props) => {
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
        await props.updateNotebookContext({ ...context, specs: summaryData });
      } catch (error) {
        console.error('Error fetching or processing data:', error);
      } finally {
        setSpecsLoading(false);
      }
    };

    loadSpecsData();
  }, []);
};
