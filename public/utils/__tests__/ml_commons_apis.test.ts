/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getMLCommonsTask,
  getMLCommonsSingleMemory,
  getMLCommonsMemoryMessages,
  getMLCommonsMessageTraces,
  searchMLCommonsAgents,
} from '../ml_commons_apis';
import { OPENSEARCH_ML_COMMONS_API } from '../../../common/constants/ml_commons';

// Mock the CoreStart http service
const mockHttp = {
  post: jest.fn(),
  get: jest.fn(),
};

// Mock AbortSignal
const mockSignal = new AbortController().signal;

describe('ML Commons APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMLCommonsTask', () => {
    it('should call callApiWithProxy with correct parameters', async () => {
      const mockResponse = { task_id: 'test-task-123', status: 'COMPLETED' };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        taskId: 'test-task-123',
        signal: mockSignal,
        dataSourceId: 'test-datasource',
      };

      const result = await getMLCommonsTask(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.singleTask.replace('{taskId}', 'test-task-123'),
          method: 'GET',
          dataSourceId: 'test-datasource',
        },
        signal: mockSignal,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should work without optional parameters', async () => {
      const mockResponse = { task_id: 'test-task-456', status: 'RUNNING' };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        taskId: 'test-task-456',
      };

      const result = await getMLCommonsTask(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.singleTask.replace('{taskId}', 'test-task-456'),
          method: 'GET',
          dataSourceId: undefined,
        },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchMLCommonsAgents', () => {
    it('should call callApiWithProxy with correct parameters', async () => {
      const mockResponse = { hits: { hits: [], total: { value: 0 } } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        signal: mockSignal,
        dataSourceId: 'test-datasource',
        types: ['conversational', 'flow'],
      };

      const result = await searchMLCommonsAgents(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.agentsSearch,
          method: 'POST',
          dataSourceId: 'test-datasource',
        },
        signal: mockSignal,
        body: JSON.stringify({
          query: {
            terms: {
              type: ['conversational', 'flow'],
            },
          },
          size: 10000,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should work with single agent type', async () => {
      const mockResponse = { hits: { hits: [{ _id: 'agent-1' }], total: { value: 1 } } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        types: ['conversational'],
      };

      const result = await searchMLCommonsAgents(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.agentsSearch,
          method: 'POST',
          dataSourceId: undefined,
        },
        signal: undefined,
        body: JSON.stringify({
          query: {
            terms: {
              type: ['conversational'],
            },
          },
          size: 10000,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty types array', async () => {
      const mockResponse = { hits: { hits: [], total: { value: 0 } } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        types: [],
        dataSourceId: 'test-datasource',
      };

      const result = await searchMLCommonsAgents(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.agentsSearch,
          method: 'POST',
          dataSourceId: 'test-datasource',
        },
        signal: undefined,
        body: JSON.stringify({
          query: {
            terms: {
              type: [],
            },
          },
          size: 10000,
        }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMLCommonsSingleMemory', () => {
    it('should call callApiWithProxy with correct parameters', async () => {
      const mockResponse = { memory_id: 'memory-123', name: 'Test Memory' };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        signal: mockSignal,
        dataSourceId: 'test-datasource',
        memoryId: 'memory-123',
      };

      const result = await getMLCommonsSingleMemory(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.singleMemory.replace('{memoryId}', 'memory-123'),
          method: 'GET',
          dataSourceId: 'test-datasource',
        },
        signal: mockSignal,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should work without optional parameters', async () => {
      const mockResponse = { memory_id: 'memory-456', name: 'Another Memory' };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        memoryId: 'memory-456',
      };

      const result = await getMLCommonsSingleMemory(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.singleMemory.replace('{memoryId}', 'memory-456'),
          method: 'GET',
          dataSourceId: undefined,
        },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMLCommonsMemoryMessages', () => {
    it('should call callApiWithProxy with all parameters', async () => {
      const mockResponse = { messages: [], next_token: 'token-123' };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        memoryId: 'memory-123',
        signal: mockSignal,
        dataSourceId: 'test-datasource',
        nextToken: 'prev-token-456',
      };

      const result = await getMLCommonsMemoryMessages(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.memoryMessages.replace('{memoryId}', 'memory-123'),
          method: 'GET',
          dataSourceId: 'test-datasource',
          next_token: 'prev-token-456',
        },
        signal: mockSignal,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should work without nextToken', async () => {
      const mockResponse = { messages: [], next_token: null };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        memoryId: 'memory-789',
        dataSourceId: 'test-datasource',
      };

      const result = await getMLCommonsMemoryMessages(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.memoryMessages.replace('{memoryId}', 'memory-789'),
          method: 'GET',
          dataSourceId: 'test-datasource',
        },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should work with minimal parameters', async () => {
      const mockResponse = { messages: [] };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        memoryId: 'memory-minimal',
      };

      const result = await getMLCommonsMemoryMessages(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.memoryMessages.replace('{memoryId}', 'memory-minimal'),
          method: 'GET',
          dataSourceId: undefined,
        },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMLCommonsMessageTraces', () => {
    it('should call callApiWithProxy with all parameters', async () => {
      const mockResponse = { traces: [], next_token: 123 };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        messageId: 'message-123',
        signal: mockSignal,
        dataSourceId: 'test-datasource',
        nextToken: 456,
      };

      const result = await getMLCommonsMessageTraces(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.messageTraces.replace('{messageId}', 'message-123'),
          method: 'GET',
          dataSourceId: 'test-datasource',
          next_token: 456,
        },
        signal: mockSignal,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should work without optional parameters', async () => {
      const mockResponse = { traces: [] };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        messageId: 'message-789',
      };

      const result = await getMLCommonsMessageTraces(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.messageTraces.replace('{messageId}', 'message-789'),
          method: 'GET',
          dataSourceId: undefined,
          next_token: undefined,
        },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from http.post', async () => {
      const mockError = new Error('Network error');
      mockHttp.post.mockRejectedValue(mockError);

      const params = {
        http: mockHttp as any,
        taskId: 'test-task',
      };

      await expect(getMLCommonsTask(params)).rejects.toThrow('Network error');
    });

    it('should handle AbortError when signal is aborted', async () => {
      const abortController = new AbortController();
      const mockError = new Error('Request aborted');
      mockError.name = 'AbortError';
      mockHttp.post.mockRejectedValue(mockError);

      const params = {
        http: mockHttp as any,
        types: ['conversational'],
        signal: abortController.signal,
      };

      abortController.abort();

      await expect(searchMLCommonsAgents(params)).rejects.toThrow('Request aborted');
    });
  });

  describe('Parameter validation', () => {
    it('should handle empty string memoryId', async () => {
      const mockResponse = { memory_id: '', name: 'Empty Memory' };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        memoryId: '',
      };

      const result = await getMLCommonsSingleMemory(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.singleMemory.replace('{memoryId}', ''),
          method: 'GET',
          dataSourceId: undefined,
        },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle special characters in IDs', async () => {
      const specialId = 'memory-123@#$%';
      const mockResponse = { memory_id: specialId };
      mockHttp.post.mockResolvedValue(mockResponse);

      const params = {
        http: mockHttp as any,
        memoryId: specialId,
      };

      const result = await getMLCommonsSingleMemory(params);

      expect(mockHttp.post).toHaveBeenCalledWith({
        path: '/api/console/proxy',
        query: {
          path: OPENSEARCH_ML_COMMONS_API.singleMemory.replace('{memoryId}', specialId),
          method: 'GET',
          dataSourceId: undefined,
        },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
