/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiModal, EuiModalHeader, EuiModalHeaderTitle, EuiEmptyPrompt, EuiLoadingLogo, EuiModalBody, EuiFlexGrid, EuiFlexItem, EuiModalFooter, EuiButton } from '@elastic/eui';
import React from "react";
import { EmbeddableRenderer } from "../../../../../../../src/plugins/embeddable/public";
import { getEmbeddable } from '../../../../services';
import { BubbleUpInput } from "./embeddable/types";

import './bubble_up_viz.scss';

interface BubbleUpModelProps {
  isLoading: boolean;
  closeModal: () => void;
  bubbleUpSpecs: Object[];
}

export const BubbleUpModel = (bubbleUpModelProps: BubbleUpModelProps) => {
    const { isLoading, closeModal, bubbleUpSpecs } = bubbleUpModelProps;
    const factory = getEmbeddable().getEmbeddableFactory<BubbleUpInput>('vega_visualization');
    return (
        <EuiModal onClose={closeModal} style={{ width: '80vw', maxWidth: '1400px' }}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Bubble Up Modal</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
    
          {isLoading ?
            (
              <EuiEmptyPrompt
                icon={<EuiLoadingLogo logo="visPie" size="xl" />}
                title={<h2>Loading Bubble Up Visualization</h2>}
              />
            ) : (
              <EuiModalBody>
                <EuiFlexGrid columns={4} >
                  {bubbleUpSpecs && bubbleUpSpecs.map((spec, index) => (
                    <EuiFlexItem key={index} style={{ height: 300, width: 300 }}>
                      {factory && spec && <EmbeddableRenderer factory={factory} input={{ "id": "text2viz", "savedObjectId": "", "visInput": { "spec": spec } }} />}
                    </EuiFlexItem>
                  ))}
                </EuiFlexGrid>
              </EuiModalBody>
            )
          }
    
          <EuiModalFooter>
            <EuiButton onClick={closeModal} fill>
              Close
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      );
}