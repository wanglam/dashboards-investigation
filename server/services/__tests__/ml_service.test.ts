/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MLService } from '../ml_service';
import { OPENSEARCH_ML_COMMONS_API } from '../../../common/constants/ml_commons';

describe('MLService', () => {
  let mlService: MLService;
  let mockTransport: any;
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = { body: { test: 'response' } };
    mockTransport = {
      request: jest.fn().mockResolvedValue(mockResponse),
    };
    mlService = new MLService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTask', () => {
    it('should call transport.request with correct parameters', async () => {
      const taskId = 'test-task-id';
      const expectedPath = OPENSEARCH_ML_COMMONS_API.singleTask.replace('{taskId}', taskId);

      await mlService.getTask({ transport: mockTransport, taskId });

      expect(mockTransport.request).toHaveBeenCalledWith({
        path: expectedPath,
        method: 'GET',
      });
    });

    it('should return the response body', async () => {
      const taskId = 'test-task-id';
      const result = await mlService.getTask({ transport: mockTransport, taskId });

      expect(result).toEqual(mockResponse.body);
    });

    it('should handle errors properly', async () => {
      const taskId = 'test-task-id';
      const error = new Error('Test error');
      mockTransport.request.mockRejectedValueOnce(error);

      await expect(mlService.getTask({ transport: mockTransport, taskId })).rejects.toThrow(error);
    });
  });

  describe('executeAgent', () => {
    it('should call transport.request with correct parameters for sync execution', async () => {
      const agentId = 'test-agent-id';
      const expectedPath = OPENSEARCH_ML_COMMONS_API.agentExecute.replace('{agentId}', agentId);

      await mlService.executeAgent({ transport: mockTransport, agentId });

      expect(mockTransport.request).toHaveBeenCalledWith({
        path: expectedPath,
        method: 'GET',
        querystring: undefined,
      });
    });

    it('should call transport.request with async parameter when async is true', async () => {
      const agentId = 'test-agent-id';
      const expectedPath = OPENSEARCH_ML_COMMONS_API.agentExecute.replace('{agentId}', agentId);

      await mlService.executeAgent({ transport: mockTransport, agentId, async: true });

      expect(mockTransport.request).toHaveBeenCalledWith({
        path: expectedPath,
        method: 'GET',
        querystring: 'async=true',
      });
    });

    it('should return the response directly', async () => {
      const agentId = 'test-agent-id';
      const result = await mlService.executeAgent({ transport: mockTransport, agentId });

      expect(result).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
      const agentId = 'test-agent-id';
      const error = new Error('Test error');
      mockTransport.request.mockRejectedValueOnce(error);

      await expect(mlService.executeAgent({ transport: mockTransport, agentId })).rejects.toThrow(
        error
      );
    });
  });
});
