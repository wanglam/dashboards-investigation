/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import now from 'performance-now';

import type {
  DeepResearchOutputResult,
  NotebookContext,
  ParagraphBackendType,
} from 'common/types/notebooks';
import {
  DEEP_RESEARCH_PARAGRAPH_TYPE,
  EXECUTOR_SYSTEM_PROMPT,
} from '../../../../common/constants/notebooks';
import { getInputType } from '../../../../common/utils/paragraph';
import {
  getNotebookTopLevelContextPrompt,
  getOpenSearchClientTransport,
} from '../../../routes/utils';
import { getParagraphServiceSetup } from '../../../services/get_set';
import {
  OpenSearchClient,
  RequestHandlerContext,
  SavedObject,
} from '../../../../../../src/core/server';

const getAgentIdFromParagraph = async ({
  transport,
  paragraph,
}: {
  paragraph: ParagraphBackendType<unknown>;
  transport: OpenSearchClient['transport'];
}) => {
  let output: { agent_id: string } = { agent_id: '' };
  try {
    output =
      typeof paragraph.output?.[0].result === 'string'
        ? JSON.parse(paragraph.output?.[0].result)
        : paragraph.output?.[0].result;
  } catch (e) {
    // do nothing
  }

  if (!output.agent_id) {
    try {
      const { body } = await transport.request({
        method: 'GET',
        path: '/_plugins/_ml/config/os_deep_research',
      });
      output.agent_id = body.configuration.agent_id;
    } catch (error) {
      // Add error catch here..
    }
  }
  return output.agent_id;
};

export const executePERAgentInParagraph = async ({
  transport,
  paragraph,
  context,
  baseMemoryId,
}: {
  transport: OpenSearchClient['transport'];
  paragraph: ParagraphBackendType<unknown>;
  baseMemoryId?: string;
  context?: string;
}) => {
  const agentId = await getAgentIdFromParagraph({
    transport,
    paragraph,
  });

  if (!agentId) {
    throw new Error('No PER agent id configured.');
  }
  const startTime = now();
  const payload = {
    method: 'POST',
    path: `/_plugins/_ml/agents/${agentId}/_execute`,
    querystring: 'async=true',
    body: {
      parameters: {
        question: paragraph.input.inputText,
        planner_prompt_template:
          '${parameters.tools_prompt} \n ${parameters.planner_prompt} \n Objective: ${parameters.user_prompt} \n\n Here are some steps user has executed to help you investigate: \n[${parameters.context}] \n\n',
        planner_with_history_template:
          '${parameters.tools_prompt} \n ${parameters.planner_prompt} \n Objective: ```${parameters.user_prompt}``` \n\n Here are some steps user has executed to help you investigate: \n[${parameters.context}] \n\n You have currently executed the following steps: \n[${parameters.completed_steps}] \n\n',
        reflect_prompt_template:
          '${parameters.tools_prompt} \n ${parameters.planner_prompt} \n Objective: ```${parameters.user_prompt}``` \n\n Original plan:\n[${parameters.steps}] \n\n Here are some steps user has executed to help you investigate: \n[${parameters.context}] \n\n You have currently executed the following steps from the original plan: \n[${parameters.completed_steps}] \n\n ${parameters.reflect_prompt} \n\n.',
        context,
        executor_system_prompt: `${EXECUTOR_SYSTEM_PROMPT} \n You have currently executed the following steps: \n ${context}`,
        memory_id: baseMemoryId,
      },
    },
  };
  const { body } = await transport.request(payload);
  const dateModified = new Date().toISOString();
  const output: ParagraphBackendType<DeepResearchOutputResult>['output'] = [
    {
      outputType: DEEP_RESEARCH_PARAGRAPH_TYPE,
      result: {
        taskId: body.task_id,
        memoryId: body.response?.memory_id,
        agent_id: agentId,
      },
      execution_time: `${(now() - startTime).toFixed(3)} ms`,
    },
  ];

  return {
    ...paragraph,
    dateModified,
    input: {
      ...paragraph.input,
      // FIXME: this is used for debug
      PERAgentInput: payload,
      PERAgentContext: context,
    },
    output,
  };
};

export const generateContextPromptFromParagraphs = async ({
  paragraphs,
  routeContext,
  notebookInfo,
  ignoreInputTypes = [],
}: {
  paragraphs: Array<ParagraphBackendType<unknown>>;
  routeContext: RequestHandlerContext;
  notebookInfo: SavedObject<{ savedNotebook: { context?: NotebookContext } }>;
  ignoreInputTypes?: string[];
}) => {
  const allContext = await Promise.all(
    paragraphs
      .filter((paragraph) => !ignoreInputTypes.includes(getInputType(paragraph)))
      .map(async (paragraph) => {
        const transport = await getOpenSearchClientTransport({
          context: routeContext,
          dataSourceId: paragraph.dataSourceMDSId,
        });
        const paragraphRegistry = getParagraphServiceSetup().getParagraphRegistry(
          getInputType(paragraph)
        );
        if (!paragraphRegistry) {
          return '';
        }

        return await paragraphRegistry.getContext({
          transport,
          paragraph,
        });
      })
  );
  return [getNotebookTopLevelContextPrompt(notebookInfo), ...allContext]
    .filter((item) => item)
    .map((item) => item)
    .join('\n');
};
