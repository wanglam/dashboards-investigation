/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { timer } from 'rxjs';
import { concatMap, takeWhile } from 'rxjs/operators';

import type { NoteBookServices } from 'public/types';
import { useOpenSearchDashboards } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { NotebookReactContext } from '../components/notebooks/context_provider/context_provider';

import {
  executeMLCommonsAgent,
  getMLCommonsConfig,
  getMLCommonsMessage,
} from '../utils/ml_commons_apis';
import { extractParentInteractionId } from '../../common/utils/task';
import { PERAgentInvestigationResponse } from '../../common/types/notebooks';
import { isValidPERAgentInvestigationResponse } from '../../common/utils/per_agent';
import { useNotebook } from './use_notebook';
import { useParagraphs } from './use_paragraphs';

const plannerSystemPrompt = `
You are a thoughtful and analytical planner agent in a plan-execute-reflect framework. Your job is to design a clear, step-by-step plan for a given objective.

Instructions:
- Break the objective into an ordered list of atomic, self-contained Steps that, if executed, will lead to the final result or complete the objective.
- Each Step must state what to do, where, and which tool/parameters would be used. You do not execute tools, only reference them for planning.
- Use only the provided tools; do not invent or assume tools. If no suitable tool applies, use reasoning or observations instead.
- Base your plan only on the data and information explicitly provided; do not rely on unstated knowledge or external facts.
- If there is insufficient information to create a complete plan, summarize what is known so far and clearly state what additional information is required to proceed.
- Stop and summarize if the task is complete or further progress is unlikely.
- Avoid vague instructions; be specific about data sources, indexes, or parameters.
- Never make assumptions or rely on implicit knowledge.
- Respond only in JSON format.

Step examples:
Good example: "Use Tool to sample documents from index: 'my-index'"
Bad example: "Use Tool to sample documents from each index"
Bad example: "Use Tool to sample documents from all indices"

Response Instructions:
Only respond in JSON format. Always follow the given response instructions. Do not return any content that does not follow the response instructions. Do not add anything before or after the expected JSON.

Always respond with a valid JSON object that strictly follows the below schema:
{
	"steps": array[string],
	"result": string
}

Use "steps" to return an array of strings where each string is a step to complete the objective, leave it empty if you know the final result. Please wrap each step in quotes and escape any special characters within the string.

Use "result" to return the final response when you have enough information, leave it empty if you want to execute more steps. When providing the final result, it MUST be a stringified JSON object with the following structure:
{
    "summary": string,
    "findings": array[object],
    "hypotheses": array[object],
    "reasoning": string,
    "confidence_rating": number
}

Where each finding object has this structure:
{
    "id": string,
    "description": string,
    "importance": number,
    "evidence": string
}

And each hypothesis object has this structure:
{
    "id": string,
    "description": string,
    "likelihood": number,
    "supporting_findings": array[string]
}

Here are examples of valid responses following the required JSON schema:

Example 1 - When you need to execute steps:
{
	"steps": ["This is an example step", "this is another example step"],
	"result": ""
}

Example 2 - When you have the final result:
{
	"steps": [],
	"result": "{\"summary\":\"This is a comprehensive summary of all analysis and conclusions.\",\"findings\":[{\"id\":\"F1\",\"description\":\"Key finding from data analysis\",\"importance\":9,\"evidence\":\"Specific data points or observations supporting this finding\"},{\"id\":\"F2\",\"description\":\"Another significant finding\",\"importance\":7,\"evidence\":\"Evidence supporting this finding\"},{\"id\":\"F3\",\"description\":\"Additional finding from analysis\",\"importance\":6,\"evidence\":\"Specific evidence for this finding\"}],\"hypotheses\":[{\"id\":\"H1\",\"description\":\"First hypothesis about the data\",\"likelihood\":8,\"supporting_findings\":[\"F1\",\"F2\"]},{\"id\":\"H2\",\"description\":\"Alternative hypothesis\",\"likelihood\":5,\"supporting_findings\":[\"F2\",\"F3\"]}],\"reasoning\":\"Detailed explanation of analytical process, how findings support or contradict hypotheses, and justification for likelihood ratings. Note that finding F2 supports both hypotheses but with different implications.\",\"confidence_rating\":7}"
}

Important rules for the response:
1. Do not use commas within individual steps
2. **CRITICAL: For tool parameters use commas without spaces (e.g., "param1,param2,param3") - This rule must be followed exactly**
3. For individual steps that call a specific tool, include all required parameters
4. Do not add any content before or after the JSON
5. Only respond with a pure JSON object
6. **CRITICAL: The "result" field in your final response MUST contain a properly escaped JSON string**
7. **CRITICAL: Each hypothesis must reference specific findings by their IDs in the supporting_findings array**

When you deliver your final result, include a comprehensive analysis in the "summary" field of your result JSON. This summary must:

1. List every analysis or step you performed.
2. Summarize the inputs, methods, tools, and data used at each step.
3. Include key findings from all intermediate steps — do NOT omit them.
4. Clearly explain how the steps led to your final conclusion. Only mention the completed steps.

Additionally, your final result JSON must include:
- "findings": An array of finding objects, each containing:
  * "id": A unique identifier for the finding (e.g., "F1", "F2")
  * "description": Clear statement of the finding
  * "importance": Rating from 0-10 indicating overall significance
  * "evidence": Specific data, quotes, or observations supporting this finding

- "hypotheses": An array of hypothesis objects, each containing:
  * "id": A unique identifier for the hypothesis (e.g., "H1", "H2")
  * "description": Clear statement of the hypothesis
  * "likelihood": Rating from 0-10 indicating probability of being correct
  * "supporting_findings": Array of finding IDs that support or relate to this hypothesis

- "reasoning": Detailed explanation connecting findings to hypotheses and justifying your conclusions
- "confidence_rating": Overall confidence in your analysis (0-10)

The final response should create a clear chain of evidence where findings can support multiple hypotheses, and your reasoning explains how these connections led to your conclusions and confidence rating.
`.trim();

interface InvestigationOptions {
  question?: string;
}

export const useAutomaticInvestigation = ({ question }: InvestigationOptions) => {
  const context = useContext(NotebookReactContext);
  const dataSourceId = context.state.value.context.value.dataSourceId;
  const {
    services: { http },
  } = useOpenSearchDashboards<NoteBookServices>();
  const { updateInvestigationResult } = useNotebook();
  const { createParagraph, runParagraph } = useParagraphs();

  const [investigationMessageId, setInvestigationMessageId] = useState();
  const [isInvestigating, setIsInvestigating] = useState(false);

  const startToInvestigate = async ({
    investigationQuestion,
    abortController,
  }: {
    investigationQuestion: string;
    abortController: AbortController;
  }) => {
    try {
      const agentId = (
        await getMLCommonsConfig({
          http,
          signal: abortController.signal,
          configName: 'os_deep_research',
          dataSourceId,
        })
      ).configuration.agent_id;

      const result = await executeMLCommonsAgent({
        http,
        agentId,
        async: true,
        parameters: {
          system_prompt: plannerSystemPrompt,
          question: investigationQuestion,
        },
        dataSourceId,
      });
      const parentInteractionId = extractParentInteractionId(result);

      setInvestigationMessageId(parentInteractionId);
    } catch (e) {
      console.error('Failed to execute per agent', e);
    }
  };

  const startToInvestigateRef = useRef(startToInvestigate);
  startToInvestigateRef.current = startToInvestigate;

  const storeInvestigationResponse = useCallback(
    async ({ payload }: { payload: PERAgentInvestigationResponse }) => {
      const findingId2ParagraphId: { [key: string]: string } = {};
      let paragraphIndexBias = 0;
      for (let i = 0; i < payload.findings.length; i++) {
        const finding = payload.findings[i];
        let paragraph;
        try {
          paragraph = await createParagraph({
            index: paragraphIndexBias,
            input: {
              inputText: `%md ${finding.description}`,
              inputType: 'MARKDOWN',
            },
          });
          paragraphIndexBias++;
        } catch (e) {
          console.error('Failed to create paragraph for finding:', JSON.stringify(finding));
          continue;
        }
        if (paragraph) {
          findingId2ParagraphId[finding.id] = paragraph.value.id;
          try {
            await runParagraph({
              id: paragraph.value.id,
            });
          } catch (e) {
            console.error('Failed to run paragraph:', e);
          }
        }
      }
      try {
        await updateInvestigationResult({
          summary: payload.summary,
          reasoning: payload.reasoning,
          confidenceRating: payload.confidence_rating,
          hypotheses: payload.hypotheses.map((item) => ({
            description: item.description,
            likelihood: item.likelihood,
            supportingFindingParagraphIds: item.supporting_findings
              .map((findingId) => findingId2ParagraphId[findingId])
              .filter((id) => !!id),
          })),
        });
      } catch (e) {
        console.error('Failed to update investigation result');
      } finally {
        setIsInvestigating(false);
      }
    },
    [updateInvestigationResult, createParagraph, runParagraph]
  );

  useEffect(() => {
    if (!question) {
      return;
    }
    const abortController = new AbortController();

    setIsInvestigating(true);
    startToInvestigateRef.current({
      investigationQuestion: question,
      abortController,
    });

    return () => {
      abortController.abort(
        'Message id or hasInvestigationResult or dataSourceId or question change'
      );
      setInvestigationMessageId(undefined);
      setIsInvestigating(false);
    };
  }, [question]);

  useEffect(() => {
    if (!investigationMessageId) {
      return;
    }
    const abortController = new AbortController();
    const subscription = timer(0, 5000)
      .pipe(
        concatMap(() => {
          return getMLCommonsMessage({
            messageId: investigationMessageId,
            http,
            signal: abortController?.signal,
            dataSourceId,
          });
        }),
        takeWhile((message) => !message.response, true)
      )
      .subscribe((message) => {
        if (!message.response) {
          return;
        }
        let responseJson;
        try {
          responseJson = JSON.parse(message.response);
        } catch (error) {
          console.error('Failed to parse response message', message.response);
          return;
        }
        if (!isValidPERAgentInvestigationResponse(responseJson)) {
          console.error('Investigation response not valid', responseJson);
          return;
        }
        storeInvestigationResponse({ payload: responseJson }).catch((e) => {
          console.error('Failed to store investigation response', e);
        });
      });
    return () => {
      subscription.unsubscribe();
      abortController.abort('Data source or message id change');
    };
  }, [investigationMessageId, http, dataSourceId, storeInvestigationResponse]);

  return {
    isInvestigating,
  };
};
