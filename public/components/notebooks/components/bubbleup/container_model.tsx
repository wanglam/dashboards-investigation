/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
} from '@elastic/eui';
import React from 'react';
import { EmbeddableRenderer } from '../../../../../../../src/plugins/embeddable/public';
import { getEmbeddable } from '../../../../services';
import { BubbleUpInput } from './embeddable/types';

import './bubble_up_viz.scss';

interface BubbleUpModelProps {
  title: string;
  closeModal: () => void;
  bubbleUpSpec: Record<string, unknown>;
}

export const BubbleUpModel = (bubbleUpModelProps: BubbleUpModelProps) => {
  const { title, closeModal, bubbleUpSpec } = bubbleUpModelProps;
  const factory = getEmbeddable().getEmbeddableFactory<BubbleUpInput>('vega_visualization');

  console.log('spec', bubbleUpSpec);

  return (
    <EuiModal onClose={closeModal} style={{ maxWidth: '1200px' }}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>{title}</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
       <EuiModalBody style={{ height: 500, width: 800 }}>
          {bubbleUpSpec && factory && <EmbeddableRenderer
                      factory={factory}
                      input={{ id: 'text2viz', savedObjectId: '', visInput: { spec: bubbleUpSpec } }}
                    />}
        </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={closeModal} fill>
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
