/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  EuiAccordion,
  EuiButton,
  EuiLoadingContent,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import moment from 'moment';
import MarkdownRender from '@nteract/markdown';
import { useObservable } from 'react-use';

import { getTimeGapFromDates } from '../../../../../utils/time';
import { PERAgentTaskService } from './services/per_agent_task_service';
import { PERAgentMemoryService } from './services/per_agent_memory_service';

export const StepDetailsModal = ({
  closeModal,
  taskService,
  onStepExplain,
  defaultExpandMessageId,
  executorMemoryService,
}: {
  onStepExplain: (messageId: string) => void;
  closeModal: () => void;
  defaultExpandMessageId?: string;
  taskService: PERAgentTaskService;
  executorMemoryService: PERAgentMemoryService;
}) => {
  const titleRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const scrollLock = useRef(false);
  const observables = useMemo(
    () => ({
      message$: executorMemoryService.getMessages$(),
      messagePollingState$: executorMemoryService.getPollingState$(),
      executorMemoryId$: taskService.getExecutorMemoryId$(),
      task$: taskService.getExecutorMemoryId$(),
    }),
    [executorMemoryService, taskService]
  );
  const steps = useObservable(observables.message$);
  const loadingSteps = useObservable(observables.messagePollingState$);
  const task = useObservable(observables.task$);
  const taskCreateTime = task?.create_time;

  useEffect(() => {
    const stopPolling = executorMemoryService.startPolling();
    return () => {
      stopPolling?.();
    };
  }, [executorMemoryService]);

  useEffect(() => {
    if (!defaultExpandMessageId || scrollLock.current) {
      return;
    }
    if (steps?.find((step) => step.message_id === defaultExpandMessageId)) {
      titleRefs.current[defaultExpandMessageId]?.scrollIntoView();
      scrollLock.current = true;
    }
  }, [defaultExpandMessageId, steps]);

  const renderSteps = () => {
    if (!loadingSteps && steps?.length === 0) {
      return <>No steps</>;
    }
    return steps.map(
      ({ input: stepInput, response, message_id: messageId, create_time: createTime }, index) => {
        let durationStr = '';
        if (steps[index - 1]) {
          durationStr = getTimeGapFromDates(
            moment(steps[index - 1].create_time),
            moment(createTime)
          );
        } else if (taskCreateTime) {
          durationStr = getTimeGapFromDates(moment(taskCreateTime), moment(createTime));
        }

        return (
          <React.Fragment key={messageId}>
            <EuiPanel paddingSize="s" borderRadius="m" hasBorder>
              <EuiAccordion
                id={`trace-${index}`}
                buttonContent={
                  <div
                    ref={(element) => {
                      titleRefs.current = { ...titleRefs.current, [messageId]: element };
                    }}
                  >
                    Step {index + 1}
                    {!response ? '(No response)' : ''} - {stepInput}
                    {durationStr ? `(Duration: ${durationStr})` : ''}
                  </div>
                }
                paddingSize="l"
                initialIsOpen={defaultExpandMessageId === messageId}
              >
                {response && (
                  <EuiText className="markdown-output-text" size="s">
                    <MarkdownRender source={response} />
                  </EuiText>
                )}
                <EuiButton
                  onClick={() => {
                    onStepExplain(messageId);
                  }}
                >
                  Explain this step
                </EuiButton>
              </EuiAccordion>
            </EuiPanel>
            <EuiSpacer />
          </React.Fragment>
        );
      }
    );
  };

  return (
    <EuiModal onClose={closeModal}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Investigation steps</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {task && renderSteps()}
        {(!task || loadingSteps) && <EuiLoadingContent />}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={closeModal} fill>
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
