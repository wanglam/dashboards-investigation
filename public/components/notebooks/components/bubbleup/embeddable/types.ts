/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EmbeddableOutput,
  SavedObjectEmbeddableInput,
} from '../../../../../../../../src/plugins/embeddable/public';

interface VisInput {
  spec: Object;
  uiState?: string;
}

export interface BubbleUpInput extends SavedObjectEmbeddableInput {
  visInput?: VisInput;
}

export interface BubbleUpOutput extends EmbeddableOutput {
  editPath: string;
  editApp: string;
  editUrl: string;
  visTypeName: string;
}
