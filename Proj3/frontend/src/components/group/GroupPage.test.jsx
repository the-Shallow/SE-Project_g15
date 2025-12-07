import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GroupsPage from './GroupPage';
import { getUserGroups } from '../../api/groups';

jest.mock('../../api/groups', () => ({
  getUserGroups: jest.fn(),
}));

// Mock GroupCard to actually render group name
jest.mock('../../components/group/GroupCard', () => ({ group }) => (
  <div data-testid="group-card">{group.name}</div>
));

describe('GroupsPage enhanced coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders header', () => {
    render(<GroupsPage />);
    expect(screen.getByText(/Your Groups/i)).toBeInTheDocument();
  });

  it('renders multiple groups from API', async () => {
    const mockGroups = [
      { id: 1, name: 'Lunch Crew' },
      { id: 2, name: 'Study Group' },
    ];
    getUserGroups.mockResolvedValueOnce(mockGroups);

    render(<GroupsPage />);

    await waitFor(() => {
      expect(getUserGroups).toHaveBeenCalledTimes(1);
      expect(screen.getAllByTestId('group-card')).toHaveLength(2);
      expect(screen.getByText('Lunch Crew')).toBeInTheDocument();
      expect(screen.getByText('Study Group')).toBeInTheDocument();
    });
  });

  it('handles empty groups gracefully', async () => {
    getUserGroups.mockResolvedValueOnce([]);
    render(<GroupsPage />);

    await waitFor(() => expect(getUserGroups).toHaveBeenCalledTimes(1));
    expect(screen.queryAllByTestId('group-card')).toHaveLength(0);
  });

  it('handles API error without crashing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getUserGroups.mockRejectedValueOnce(new Error('API error'));

    render(<GroupsPage />);

    await waitFor(() => expect(getUserGroups).toHaveBeenCalledTimes(1));
    expect(screen.queryAllByTestId('group-card')).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('renders correctly if API returns null or invalid data', async () => {
    getUserGroups.mockResolvedValueOnce(null);
    render(<GroupsPage />);

    await waitFor(() => expect(getUserGroups).toHaveBeenCalledTimes(1));
    expect(screen.queryAllByTestId('group-card')).toHaveLength(0);
  });
});
