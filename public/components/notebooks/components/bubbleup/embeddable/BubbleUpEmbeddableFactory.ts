/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import {
  EmbeddableFactoryDefinition,
  IContainer,
} from '../../../../../../../../src/plugins/embeddable/public';
import { BubbleUpEmbeddable } from './bubble_up_embeddable';
import { BubbleUpInput } from './types';

export class BubbleUpEmbeddableFactory implements EmbeddableFactoryDefinition {
  public readonly type = 'vega_visualization';

  public async isEditable() {
    return false;
  }

  public getDisplayName() {
    return i18n.translate('vega.displayName', {
      defaultMessage: 'Vega visualization',
    });
  }

  public async create(input: BubbleUpInput, parent?: IContainer) {
    return new BubbleUpEmbeddable(input, parent);
  }
}
