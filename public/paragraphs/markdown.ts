/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarkdownParagraph } from '../components/notebooks/components/paragraph_components/markdown';
import { ParagraphRegistryItem } from '../services/paragraph_service';

export const MarkdownParagraphItem: ParagraphRegistryItem = {
  ParagraphComponent: MarkdownParagraph,
  runParagraph: async () => {
    return;
  },
};
