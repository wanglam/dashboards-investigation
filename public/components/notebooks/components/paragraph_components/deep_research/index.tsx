/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect, useContext, useCallback, useState } from 'react';
import { useObservable } from 'react-use';
import {
  EuiAvatar,
  EuiFlexGroup,
  EuiFlexItem,
  EuiMarkdownFormat,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiPanel,
  EuiSpacer,
  EuiTabbedContent,
  EuiText,
} from '@elastic/eui';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import type { NoteBookServices } from 'public/types';
import type { DeepResearchInputParameters, DeepResearchOutputResult } from 'common/types/notebooks';

import { useOpenSearchDashboards } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  ParagraphState,
  ParagraphStateValue,
} from '../../../../../../common/state/paragraph_state';
import { useParagraphs } from '../../../../../hooks/use_paragraphs';
import { getLocalInputParameters } from '../../helpers/per_agent_helpers';

import { DeepResearchOutput } from './deep_research_output';
import { NotebookReactContext } from '../../../context_provider/context_provider';
import {
  AI_RESPONSE_TYPE,
  DEEP_RESEARCH_PARAGRAPH_TYPE,
} from '../../../../../../common/constants/notebooks';
import { extractParentInteractionId } from '../../../../../../common/utils/task';

import { StepDetailsModal } from './step_details_modal';
import { PERAgentTaskService } from './services/per_agent_task_service';
import { MessageTraceFlyout } from './message_trace_flyout';
import { PERAgentMemoryService } from './services/per_agent_memory_service';
import { PERAgentMessageService } from './services/per_agent_message_service';

export const DeepResearchParagraph = ({
  paragraphState,
}: {
  paragraphState: ParagraphState<Partial<DeepResearchOutputResult>, DeepResearchInputParameters>;
}) => {
  const {
    services: { http },
  } = useOpenSearchDashboards<NoteBookServices>();

  const { state } = useContext(NotebookReactContext);
  const [stepDetailMessageId, setStepDetailMessageId] = useState<string>();
  const [showContextModal, setShowContextModal] = useState(false);
  const [traceMessageId, setTraceMessageId] = useState<string>();
  const [showSteps, setShowSteps] = useState(false);
  const paragraphValue = useObservable(paragraphState.getValue$(), paragraphState.value);
  const contextValue = useObservable(state.value.context.getValue$(), state.value.context.value);
  const PERAgentServices = useMemo(() => {
    // FIXME: Remove the task service in the production
    const taskService = new PERAgentTaskService(http);
    const messageService = new PERAgentMessageService(http);
    const executorMemoryId$ = combineLatest([
      paragraphState.getValue$(),
      taskService.getExecutorMemoryId$(),
    ]).pipe(
      map(([currentParagraphValue, executorMemoryId]) => {
        if (
          currentParagraphValue &&
          !ParagraphState.getOutput(currentParagraphValue)?.result.executorAgentMemoryId
        ) {
          return executorMemoryId;
        }
        return ParagraphState.getOutput(currentParagraphValue)?.result.executorAgentMemoryId;
      })
    );
    const executorMemoryService = new PERAgentMemoryService(http, executorMemoryId$, () => {
      return !messageService.getMessageValue().response;
    });
    return {
      task: taskService,
      message: messageService,
      executorMemory: executorMemoryService,
      executorMemoryId$,
    };
  }, [http, paragraphState]);
  const observables = useMemo(
    () => ({
      message$: PERAgentServices.message.getMessage$(),
    }),
    [PERAgentServices.message]
  );
  const message = useObservable(observables.message$);
  const input =
    (paragraphValue.input.parameters as DeepResearchInputParameters) || paragraphValue.input;
  const messageLoaded = !!message;
  const messageFinished = !!message && !!message.response;
  const executorMemoryId = useObservable(PERAgentServices.executorMemoryId$);

  const { runParagraph } = useParagraphs();
  const rawOutputResult = ParagraphState.getOutput(paragraphValue)?.result;
  // FIXME: Read paragraph out directly once all notebooks store object as output
  const outputResult = useMemo<Partial<DeepResearchOutputResult> | undefined>(() => {
    if (typeof rawOutputResult !== 'string' || typeof rawOutputResult === 'undefined') {
      return rawOutputResult;
    }
    if (!rawOutputResult) {
      return undefined;
    }
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawOutputResult);
    } catch (e) {
      console.error('Failed to parse output result', e);
    }
    if (typeof parsedResult?.task_id === 'string') {
      return {
        taskId: parsedResult.task_id,
      };
    }
    return undefined;
  }, [rawOutputResult]);

  const runParagraphHandler = useCallback(
    async (inputPayload?: Partial<ParagraphStateValue['input']>) => {
      paragraphState.updateInput({
        ...inputPayload,
        parameters: getLocalInputParameters(),
      });
      await runParagraph({
        id: paragraphValue.id,
      });
    },
    [runParagraph, paragraphState, paragraphValue.id]
  );

  useEffect(() => {
    if (
      !paragraphValue.uiState?.isRunning &&
      !paragraphValue.input.inputText &&
      paragraphValue.input.inputType === DEEP_RESEARCH_PARAGRAPH_TYPE &&
      contextValue.initialGoal &&
      !outputResult?.taskId
    ) {
      // automatically run paragraph if there is initial goal
      runParagraphHandler({
        inputText: contextValue.initialGoal,
      });
    }
  }, [contextValue, paragraphValue, outputResult, runParagraphHandler]);

  useEffect(() => {
    paragraphState.updateUIState({
      actions: [
        ...(executorMemoryId && !!message?.response
          ? [
              {
                name: `${showSteps ? 'Hide' : 'Show'} steps`,
                action: () => {
                  setShowSteps((flag) => !flag);
                },
              },
            ]
          : []),
        ...(outputResult?.messageId || outputResult?.taskId
          ? [
              {
                name: 'Show agent inputs',
                action: () => {
                  setShowContextModal(true);
                },
              },
            ]
          : []),
        ...(paragraphValue.input.inputType === AI_RESPONSE_TYPE
          ? [
              {
                name: 'Re-Run',
                action: runParagraphHandler,
              },
            ]
          : []),
      ],
    });
  }, [
    paragraphState,
    outputResult?.taskId,
    showSteps,
    paragraphValue.input.inputType,
    runParagraphHandler,
    message?.response,
    executorMemoryId,
    outputResult?.messageId,
  ]);

  useEffect(() => {
    const dataSourceId = paragraphValue.dataSourceMDSId;
    if (!!outputResult?.messageId) {
      PERAgentServices.message.setup({
        messageId: outputResult?.messageId,
        dataSourceId,
      });
      return () => {
        PERAgentServices.message.stop('Unmount..');
      };
    }
    PERAgentServices.message.reset();
    const taskId = outputResult?.taskId;
    if (!taskId) {
      PERAgentServices.task.reset();
      return;
    }
    PERAgentServices.task.setup({
      taskId,
      dataSourceId,
    });
    return () => {
      PERAgentServices.task.stop('Unmount');
    };
  }, [
    outputResult?.taskId,
    outputResult?.messageId,
    paragraphValue.dataSourceMDSId,
    PERAgentServices.task,
    PERAgentServices.message,
  ]);

  useEffect(() => {
    const dataSourceId = paragraphValue.dataSourceMDSId;
    if (!!outputResult?.messageId) {
      PERAgentServices.message.setup({
        messageId: outputResult?.messageId,
        dataSourceId,
      });
      return () => {
        PERAgentServices.message.stop('Unmount..');
      };
    }
    PERAgentServices.message.reset();
    const subscription = PERAgentServices.task.getTask$().subscribe((task) => {
      if (task && extractParentInteractionId(task)) {
        PERAgentServices.message.setup({
          messageId: extractParentInteractionId(task),
          dataSourceId,
        });
      }
    });
    return () => {
      PERAgentServices.message.stop('Unmount');
      subscription.unsubscribe();
    };
  }, [
    outputResult?.messageId,
    paragraphValue.dataSourceMDSId,
    PERAgentServices.task,
    PERAgentServices.message,
  ]);

  useEffect(() => {
    PERAgentServices.executorMemory.setup({
      dataSourceId: paragraphValue.dataSourceMDSId,
    });
    return () => {
      PERAgentServices.executorMemory.stop('Unmount');
    };
  }, [paragraphValue.dataSourceMDSId, http, PERAgentServices.executorMemory]);

  useEffect(() => {
    if (paragraphValue.uiState?.isRunning) {
      // Clean the output result immediately after re-run
      paragraphState.updateOutput({ result: {} });
      setShowSteps(true);
    }
  }, [paragraphValue.uiState?.isRunning, paragraphState]);

  useEffect(() => {
    if (messageLoaded) {
      setShowSteps(!messageFinished);
    }
  }, [messageLoaded, messageFinished]);

  return (
    <>
      <EuiFlexGroup gutterSize="s" alignItems="flexStart">
        <EuiFlexItem grow={false}>
          <EuiAvatar name={state.value.owner ?? 'User'} size="l" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel paddingSize="m" hasShadow={false} color="subdued">
            <EuiText size="s">
              <p>{paragraphValue.input.inputText}</p>
            </EuiText>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={false} />
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <DeepResearchOutput
        messageService={PERAgentServices.message}
        executorMemoryService={PERAgentServices.executorMemory}
        showSteps={showSteps}
        onViewDetails={setStepDetailMessageId}
        onExplainThisStep={setTraceMessageId}
      />
      <EuiSpacer />
      {stepDetailMessageId && (
        <StepDetailsModal
          onStepExplain={(messageId) => {
            setTraceMessageId(messageId);
            setStepDetailMessageId(undefined);
          }}
          closeModal={() => {
            setStepDetailMessageId(undefined);
          }}
          messageService={PERAgentServices.message}
          executorMemoryService={PERAgentServices.executorMemory}
          defaultExpandMessageId={stepDetailMessageId}
        />
      )}
      {/* FIXME this is used for debug */}
      {showContextModal && (
        <EuiModal onClose={() => setShowContextModal(false)}>
          <EuiModalHeader>Context</EuiModalHeader>
          <EuiModalBody>
            <EuiTabbedContent
              tabs={[
                ...((input as DeepResearchInputParameters)?.PERAgentInput
                  ? [
                      {
                        id: 'agentInput',
                        name: 'Agent input',
                        content: (
                          <>
                            <EuiMarkdownFormat>
                              {`\`\`\`json
${JSON.stringify(
  {
    ...input?.PERAgentInput,
    body: JSON.parse(input?.PERAgentInput.body),
  },
  null,
  2
)}
                      \`\`\`
                      `}
                            </EuiMarkdownFormat>
                          </>
                        ),
                      },
                    ]
                  : []),
                ...(input?.PERAgentContext
                  ? [
                      {
                        id: 'agentContext',
                        name: 'Agent context',
                        content: (
                          <>
                            <EuiMarkdownFormat>
                              {input?.PERAgentContext || 'No context'}
                            </EuiMarkdownFormat>
                          </>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </EuiModalBody>
        </EuiModal>
      )}
      {traceMessageId && (
        <MessageTraceFlyout
          messageId={traceMessageId}
          messageService={PERAgentServices.message}
          executorMemoryService={PERAgentServices.executorMemory}
          onClose={() => {
            setTraceMessageId(undefined);
          }}
          dataSourceId={paragraphValue.dataSourceMDSId}
        />
      )}
    </>
  );
};
