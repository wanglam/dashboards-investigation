/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef } from 'react';
import { combineLatest } from 'rxjs';
import moment from 'moment';
import {
  IndexInsightContent,
  NotebookContext,
  NoteBookSource,
  ParagraphBackendType,
} from '../../common/types/notebooks';
import { ParagraphState, ParagraphStateValue } from '../../common/state/paragraph_state';
import {
  DATA_DISTRIBUTION_PARAGRAPH_TYPE,
  DEEP_RESEARCH_PARAGRAPH_TYPE,
  LOG_PATTERN_PARAGRAPH_TYPE,
  PPL_PARAGRAPH_TYPE,
} from '../../common/constants/notebooks';
import { useParagraphs } from './use_paragraphs';
import { useNotebook } from './use_notebook';
import { getInputType } from '../../common/utils/paragraph';
import { getLocalInputParameters } from '../components/notebooks/components/helpers/per_agent_helpers';

export const usePrecheck = () => {
  const { updateNotebookContext } = useNotebook();
  const { createParagraph, runParagraph } = useParagraphs();
  const deepResearchParaCreated = useRef(false);

  const setInitialGoal = useCallback(
    async (res: { context?: NotebookContext }) => {
      if (res.context?.source === NoteBookSource.ALERTING && !res.context.initialGoal) {
        await updateNotebookContext({
          initialGoal: 'Why did the alert happen? Find the root cause and give some solutions.',
        });
      }
    },
    [updateNotebookContext]
  );

  return {
    start: useCallback(
      async (res: {
        context?: NotebookContext;
        paragraphs: Array<ParagraphBackendType<unknown>>;
      }) => {
        let logPatternParaExists = false;
        let anomalyAnalysisParaExists = false;

        for (let index = 0; index < res.paragraphs.length; ++index) {
          // if the paragraph is a query, load the query output
          if (res.paragraphs[index].input.inputType === LOG_PATTERN_PARAGRAPH_TYPE) {
            logPatternParaExists = true;
          } else if (res.paragraphs[index].input.inputType === DATA_DISTRIBUTION_PARAGRAPH_TYPE) {
            anomalyAnalysisParaExists = true;
          }
        }

        const totalParagraphLength = res.paragraphs.length;
        const paragraphStates: Array<ParagraphState<unknown>> = [];

        if (!logPatternParaExists) {
          const resContext = res.context as NotebookContext;
          if (resContext?.timeRange && resContext?.index && resContext?.timeField) {
            if (
              resContext?.indexInsight?.is_log_index &&
              resContext?.indexInsight?.log_message_field
            ) {
              const logPatternResult = await createParagraph({
                index: totalParagraphLength + paragraphStates.length,
                input: {
                  inputText: '',
                  inputType: LOG_PATTERN_PARAGRAPH_TYPE,
                  parameters: {
                    index: resContext.index,
                  },
                },
                dataSourceMDSId: resContext?.dataSourceId,
              });
              if (logPatternResult) {
                paragraphStates.push(logPatternResult);
              }
            } else {
              const relatedLogIndex = resContext?.indexInsight?.related_indexes?.find(
                (relatedIndex: IndexInsightContent) => {
                  return relatedIndex.is_log_index && relatedIndex.log_message_field;
                }
              );

              if (relatedLogIndex) {
                const logPatternResult = await createParagraph({
                  index: totalParagraphLength + paragraphStates.length,
                  input: {
                    inputText: '',
                    inputType: LOG_PATTERN_PARAGRAPH_TYPE,
                    parameters: {
                      // assuming the related log index share same time field
                      timeField: relatedLogIndex.time_field || resContext.timeField,
                      index: relatedLogIndex.index_name,
                      insight: relatedLogIndex,
                    },
                  },
                  dataSourceMDSId: resContext?.dataSourceId,
                });
                if (logPatternResult) {
                  paragraphStates.push(logPatternResult);
                }
              }
            }
          }
        }

        if (!anomalyAnalysisParaExists) {
          const resContext = res.context;
          const canAnalyticDis =
            resContext?.source === NoteBookSource.DISCOVER &&
            resContext.variables?.['pplQuery'] &&
            !resContext.variables?.log;
          const canAnalyticAlert =
            resContext?.source === NoteBookSource.ALERTING && resContext?.filters;
          if (
            resContext?.timeRange &&
            resContext?.index &&
            resContext?.timeField &&
            (canAnalyticDis || canAnalyticAlert)
          ) {
            const newParaContent = JSON.stringify({
              index: resContext.index,
              timeField: resContext.timeField,
              dataSourceId: resContext?.dataSourceId,
              timeRange: resContext.timeRange,
              ...(canAnalyticAlert ? { filters: resContext.filters } : {}),
              ...(canAnalyticDis ? { query: resContext.variables?.['pplQuery'] } : {}),
            });
            const anomalyAnalysisParagraphResult = await createParagraph({
              index: totalParagraphLength + paragraphStates.length,
              input: {
                inputText: newParaContent || '',
                inputType: DATA_DISTRIBUTION_PARAGRAPH_TYPE,
              },
              dataSourceMDSId: resContext?.dataSourceId,
            });
            if (anomalyAnalysisParagraphResult) {
              paragraphStates.push(anomalyAnalysisParagraphResult);
            }
          }
        }

        if (
          res.context?.source === NoteBookSource.DISCOVER &&
          !res.paragraphs.find((paragraph) => getInputType(paragraph) === PPL_PARAGRAPH_TYPE) &&
          res.context.variables?.['pplQuery'] &&
          res.context.timeField &&
          res.context.timeRange
        ) {
          const formatToLocalTime = (timestamp: number) =>
            moment(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS');
          const pplQuery = res.context.variables?.['pplQuery'];
          const createdPPLParagraph = await createParagraph({
            index: res.paragraphs.length + paragraphStates.length,
            input: {
              inputText: `%ppl ${pplQuery}`,
              inputType: 'CODE',
              parameters: {
                noDatePicker: false,
                indexName: res.context.index,
                timeField: res.context.timeField,
                timeRange: {
                  from: formatToLocalTime(res.context.timeRange.selectionFrom),
                  to: formatToLocalTime(res.context.timeRange.selectionTo),
                },
              },
            },
            dataSourceMDSId: res.context.dataSourceId || '',
          });
          if (createdPPLParagraph) {
            await runParagraph({
              id: createdPPLParagraph.value.id,
            });

            paragraphStates.push(createdPPLParagraph);
          }
        }

        if (paragraphStates.length && res.context?.initialGoal) {
          const combinedObservable = combineLatest(
            paragraphStates.map((paragraphState) => paragraphState.getValue$())
          );
          const subscription = combinedObservable.subscribe(async (paragraphValues) => {
            const hasResult = (para?: ParagraphStateValue<unknown>) =>
              !para?.uiState?.isRunning &&
              ((para?.output?.[0]?.result && para.output[0].result !== '') ||
                para?.fullfilledOutput);

            const shouldCreate =
              !deepResearchParaCreated.current &&
              paragraphValues.every((paragraphValue) => hasResult(paragraphValue));

            if (shouldCreate) {
              deepResearchParaCreated.current = true;

              subscription.unsubscribe();
              await createParagraph({
                index: totalParagraphLength + paragraphStates.length,
                input: {
                  inputText: '',
                  inputType: DEEP_RESEARCH_PARAGRAPH_TYPE,
                  parameters: getLocalInputParameters(),
                },
                dataSourceMDSId: res.context?.dataSourceId,
              });
            }
          });
        }
      },
      [createParagraph, runParagraph]
    ),
    setInitialGoal,
  };
};
