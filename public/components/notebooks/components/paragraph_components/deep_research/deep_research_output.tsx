/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useMemo } from 'react';
import MarkdownRender from '@nteract/markdown';
import {
  EuiLoadingContent,
  EuiText,
  EuiSpacer,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiAvatar,
  EuiTitle,
  EuiIcon,
  EuiSmallButtonEmpty,
  EuiLoadingSpinner,
  EuiAccordion,
} from '@elastic/eui';
import { useObservable } from 'react-use';
import moment from 'moment';

import {
  extractCompletedResponse,
  extractFailedErrorMessage,
  isStateCompletedOrFailed,
} from '../../../../../../common/utils/task';
import { formatTimeGap } from '../../../../../utils/time';

import { isMarkdownText } from './utils';
import { PERAgentTaskService } from './services/per_agent_task_service';
import { PERAgentMemoryService } from './services/per_agent_memory_service';

interface Props {
  taskService: PERAgentTaskService;
  executorMemoryService: PERAgentMemoryService;
  showSteps?: boolean;
  onExplainThisStep: (messageId: string) => void;
}

export const DeepResearchOutput = ({
  taskService,
  executorMemoryService,
  showSteps,
  onExplainThisStep,
}: Props) => {
  const observables = useMemo(
    () => ({
      message$: executorMemoryService.getMessages$(),
      messagePollingState$: executorMemoryService.getPollingState$(),
      task$: taskService.getTask$(),
      executorMemoryId$: taskService.getTask$(),
    }),
    [executorMemoryService, taskService]
  );
  const task = useObservable(observables.task$);
  const executorMessages = useObservable(observables.message$);
  const executorMessageId = useObservable(observables.executorMemoryId$);
  const loadingExecutorMessage = useObservable(observables.messagePollingState$);

  const finalMessage = useMemo(() => {
    if (!task) {
      return '';
    }
    if (task.state === 'COMPLETED') {
      return (
        extractCompletedResponse(task) ?? 'Task was completed, but failed to load inference result.'
      );
    }

    if (task.state === 'FAILED') {
      return `Failed to execute task, reason: ${extractFailedErrorMessage(task)}`.trim();
    }
    return '';
  }, [task]);

  const renderTraces = () => {
    if (!showSteps) {
      return null;
    }
    return (
      <>
        <EuiTitle size="m">
          <h4>Steps performed</h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        {!!executorMessages &&
          executorMessages.map((message, index) => {
            const isLastMessageLoading =
              index === executorMessages.length - 1 &&
              !message.response &&
              !isStateCompletedOrFailed(task.state);
            return (
              <>
                <EuiPanel key={message.message_id} paddingSize="s" borderRadius="l" hasBorder>
                  <EuiAccordion
                    id={message.message_id}
                    arrowDisplay="right"
                    extraAction={
                      <EuiSmallButtonEmpty
                        iconSide="right"
                        onClick={() => {
                          onExplainThisStep(message.message_id);
                        }}
                      >
                        Explain this step
                      </EuiSmallButtonEmpty>
                    }
                    buttonContent={
                      <EuiFlexGroup
                        gutterSize="s"
                        alignItems="center"
                        style={{ overflow: 'hidden' }}
                      >
                        <EuiFlexItem grow={false}>
                          {isLastMessageLoading ? (
                            <EuiLoadingSpinner size="m" />
                          ) : (
                            <EuiIcon color="success" type="checkInCircleEmpty" />
                          )}
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiText size="s">{message.input}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    }
                    paddingSize={isLastMessageLoading ? 'l' : 'none'}
                  >
                    {isLastMessageLoading ? (
                      <EuiLoadingContent />
                    ) : (
                      <EuiPanel paddingSize="l" hasShadow={false} hasBorder={false} color="subdued">
                        <EuiText className="markdown-output-text" size="s">
                          {isMarkdownText(message.response) ? (
                            <MarkdownRender source={message.response} />
                          ) : (
                            message.response
                          )}
                        </EuiText>
                      </EuiPanel>
                    )}
                  </EuiAccordion>
                </EuiPanel>
                <EuiSpacer size="s" />
              </>
            );
          })}
        {!!executorMessages && executorMessages.length > 0 && <EuiSpacer size="s" />}
      </>
    );
  };

  useEffect(() => {
    if (!showSteps) {
      return;
    }
    const stopPolling = executorMemoryService.startPolling();
    return () => {
      stopPolling?.();
    };
  }, [executorMemoryService, showSteps]);

  return (
    <>
      {renderTraces()}
      {(loadingExecutorMessage ||
        !executorMessageId ||
        !task ||
        !isStateCompletedOrFailed(task.state)) && <EuiLoadingContent />}
      {finalMessage && (
        <EuiFlexGroup gutterSize="s" alignItems="flexStart" style={{ overflow: 'hidden' }}>
          <EuiFlexItem grow={false} />
          <EuiFlexItem style={{ overflow: 'hidden' }}>
            <EuiPanel paddingSize="m" hasShadow={false} color="primary">
              <EuiText className="markdown-output-text" size="s">
                {isMarkdownText(finalMessage) ? (
                  <MarkdownRender source={finalMessage} />
                ) : (
                  finalMessage
                )}
              </EuiText>
              {task && task.last_update_time && task.create_time && (
                <EuiText size="xs" color="subdued" style={{ marginTop: '8px' }}>
                  Total Duration:{' '}
                  {formatTimeGap(Number(task.last_update_time) - Number(task.create_time))}
                  &nbsp;&nbsp; Last updated: {moment(task.last_update_time).format()}
                </EuiText>
              )}
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiAvatar name="Agent" size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      <EuiSpacer />
    </>
  );
};
