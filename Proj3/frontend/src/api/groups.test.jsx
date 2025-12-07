import api from './axios'; // ✅ This is your axios instance
import * as groupsApi from './groups.js';

jest.mock('./axios'); // ✅ mock axios instance

describe('groups API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getUserGroups calls correct endpoint', async () => {
    const mockData = [{ id: 1, name: 'Pizza Lovers' }];
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await groupsApi.getUserGroups();

    expect(api.get).toHaveBeenCalledWith('/groups/my-groups');
    expect(result).toEqual(mockData);
  });

  it('joinGroup calls correct endpoint', async () => {
    const mockResponse = { data: { success: true } };
    api.post.mockResolvedValueOnce(mockResponse);

    const result = await groupsApi.joinGroup(42);

    expect(api.post).toHaveBeenCalledWith('/groups/42/join');
    expect(result).toEqual(mockResponse.data);
  });

  it('createGroup sends correct payload', async () => {
    const groupData = { name: 'Sushi Lovers' };
    const mockResponse = { data: { id: 99, ...groupData } };
    api.post.mockResolvedValueOnce(mockResponse);

    const result = await groupsApi.createGroup(groupData);

    expect(api.post).toHaveBeenCalledWith('/groups', groupData);
    expect(result).toEqual(mockResponse.data);
  });

  it('getGroupDetails retrieves group info', async () => {
    const mockResponse = { data: { id: 1, name: 'Pizza Lovers' } };
    api.get.mockResolvedValueOnce(mockResponse);

    const result = await groupsApi.getGroupDetails(1);

    expect(api.get).toHaveBeenCalledWith('/groups/1');
    expect(result).toEqual(mockResponse.data);
  });

  it('leaveGroup sends username payload', async () => {
    const mockResponse = { data: { success: true } };
    api.post.mockResolvedValueOnce(mockResponse);

    const result = await groupsApi.leaveGroup(1, 'Alice');

    expect(api.post).toHaveBeenCalledWith('/groups/1/leave', { username: 'Alice' });
    expect(result).toEqual(mockResponse.data);
  });
});
