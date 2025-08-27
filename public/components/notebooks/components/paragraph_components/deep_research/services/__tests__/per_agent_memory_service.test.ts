/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PERAgentMemoryService } from '../per_agent_memory_service';
import { getAllMessagesByMemoryId } from '../../utils';
import { BehaviorSubject } from 'rxjs';

// Mock dependencies
jest.mock('../../utils', () => ({
  getAllMessagesByMemoryId: jest.fn(),
}));

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: {
    aborted: false,
    onabort: null,
    reason: undefined,
    throwIfAborted: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  },
  abort: jest.fn(),
}));

// Mock CoreStart type for testing
interface MockHttpInterface {
  post: jest.Mock;
  get: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  head: jest.Mock;
  options: jest.Mock;
  patch: jest.Mock;
  fetch: jest.Mock;
  basePath: {
    prepend: jest.Mock;
    get: jest.Mock;
    getBasePath: jest.Mock;
    remove: jest.Mock;
    serverBasePath: string;
  };
  anonymousPaths: {
    isAnonymous: jest.Mock;
    register: jest.Mock;
  };
  intercept: jest.Mock;
  addLoadingCountSource: jest.Mock;
  getLoadingCount$: jest.Mock;
}

// Mock messages for tests
const mockMessages = [
  { id: 'msg1', content: 'Message 1' },
  { id: 'msg2', content: 'Message 2' },
];

describe('PERAgentMemoryService', () => {
  let service: PERAgentMemoryService;
  let mockMemoryId$: BehaviorSubject<string>;
  let mockShouldPolling: jest.Mock;
  let mockHttp: MockHttpInterface;
  let mockDataSourceId: string;
  let mockMemoryId: string;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock data
    mockHttp = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
      patch: jest.fn(),
      fetch: jest.fn(),
      basePath: {
        prepend: jest.fn(),
        get: jest.fn(),
        getBasePath: jest.fn(),
        remove: jest.fn(),
        serverBasePath: '',
      },
      anonymousPaths: {
        isAnonymous: jest.fn(),
        register: jest.fn(),
      },
      intercept: jest.fn(),
      addLoadingCountSource: jest.fn(),
      getLoadingCount$: jest.fn(),
    };
    mockDataSourceId = 'test-datasource-id';
    mockMemoryId = 'memory-id-123';

    // Create a real BehaviorSubject for memory ID
    mockMemoryId$ = new BehaviorSubject<string>(mockMemoryId);
    mockShouldPolling = jest.fn().mockReturnValue(true);

    // Mock getAllMessagesByMemoryId to return messages
    (getAllMessagesByMemoryId as jest.Mock).mockResolvedValue(mockMessages);

    // Create service instance
    service = new PERAgentMemoryService(mockHttp, mockMemoryId$, mockShouldPolling);
    service.setup({
      dataSourceId: mockDataSourceId,
    });
  });

  afterEach(() => {
    // Clean up
    service.stop();
  });

  test('should initialize with empty messages', () => {
    let receivedMessages: any[] = [];
    const subscription = service.getMessages$().subscribe((msgs) => {
      receivedMessages = msgs;
    });

    expect(receivedMessages).toEqual([]);
    subscription.unsubscribe();
  });

  test('should setup with dataSourceId', () => {
    // Setup is already done in beforeEach
    expect(service._dataSourceId).toBe(mockDataSourceId);
    expect(service._http).toBe(mockHttp);
  });

  test('should start polling and subscribe to memory ID observable', async () => {
    // Service is already set up in beforeEach

    // Mock getAllMessagesByMemoryId to resolve with mock messages
    (getAllMessagesByMemoryId as jest.Mock).mockResolvedValue(mockMessages);

    // Create a promise to wait for polling state to be updated
    const pollingStateUpdated = new Promise<void>((resolve) => {
      const subscription = service.getPollingState$().subscribe((state) => {
        if (state === true) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });

    // Start polling
    service.startPolling();

    // Wait for polling state to be updated
    await pollingStateUpdated;

    // Verify polling state
    let pollingState = false;
    const subscription = service.getPollingState$().subscribe((state) => {
      pollingState = state;
    });

    expect(pollingState).toBe(true);
    subscription.unsubscribe();
  });

  test('should update messages when polling returns new messages', async () => {
    // Service is already set up in beforeEach

    // Mock getAllMessagesByMemoryId to resolve with mock messages
    (getAllMessagesByMemoryId as jest.Mock).mockResolvedValue(mockMessages);

    // Create a promise to wait for messages to be updated
    const messagesUpdated = new Promise<void>((resolve) => {
      const subscription = service.getMessages$().subscribe((msgs) => {
        if (msgs.length > 0) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });

    // Start polling
    service.startPolling();

    // Wait for messages to be updated
    await messagesUpdated;

    // Verify messages are updated
    let receivedMessages: any[] = [];
    const subscription = service.getMessages$().subscribe((msgs) => {
      receivedMessages = msgs;
    });

    expect(receivedMessages).toEqual(mockMessages);
    subscription.unsubscribe();
  });

  test('should have polling state false when shouldContinuePolling returns false', async () => {
    // Create a new service instance with mockShouldPolling that returns false
    mockShouldPolling = jest.fn().mockReturnValue(false);
    service = new PERAgentMemoryService(mockHttp, mockMemoryId$, mockShouldPolling);

    // Setup the service
    service.setup({
      dataSourceId: mockDataSourceId,
    });

    // Mock getAllMessagesByMemoryId to resolve with mock messages
    (getAllMessagesByMemoryId as jest.Mock).mockResolvedValue(mockMessages);

    // Create a promise to wait for messages to be updated
    const messagesUpdated = new Promise<void>((resolve) => {
      const subscription = service.getMessages$().subscribe((msgs) => {
        if (msgs.length > 0) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });

    // Start polling
    service.startPolling();

    // Wait for messages to be updated
    await messagesUpdated;

    // Verify shouldContinuePolling was called
    expect(mockShouldPolling).toHaveBeenCalled();

    // Verify polling state
    let pollingStateValue = true;
    const subscription = service.getPollingState$().subscribe((state) => {
      pollingStateValue = state;
    });

    expect(pollingStateValue).toBe(false);
    subscription.unsubscribe();
  });

  test('should not start polling if already polling', () => {
    // Setup the service and start polling once
    service.startPolling();

    // Create a spy on AbortController constructor
    const abortControllerSpy = jest.spyOn(global, 'AbortController');

    // Reset the spy count
    abortControllerSpy.mockClear();

    // Try to start polling again
    service.startPolling();

    // Verify AbortController was not created again
    expect(abortControllerSpy).not.toHaveBeenCalled();
  });

  test('should stop polling when stopPolling is called', () => {
    // Service is already set up in beforeEach

    // Manually set up the abort controller
    service._abortController = new (global.AbortController as jest.Mock)();

    // Create a spy on AbortController.abort
    const abortSpy = jest.spyOn(service._abortController as any, 'abort');

    // Stop polling
    service.stopPolling('Test stop');

    // Verify abort was called
    expect(abortSpy).toHaveBeenCalledWith('Test stop');
    expect(service._abortController).toBeUndefined();
  });

  test('should clear messages when stop is called', () => {
    // Service is already set up in beforeEach

    // Create a spy on stopPolling
    const stopPollingSpy = jest.spyOn(service, 'stopPolling');

    // Stop the service
    service.stop('Test stop');

    // Verify stopPolling was called
    expect(stopPollingSpy).toHaveBeenCalledWith('Test stop');

    // Verify messages are cleared
    let receivedMessages: any[] = [];
    const subscription = service.getMessages$().subscribe((msgs) => {
      receivedMessages = msgs;
    });

    expect(receivedMessages).toEqual([]);
    subscription.unsubscribe();
  });
});
