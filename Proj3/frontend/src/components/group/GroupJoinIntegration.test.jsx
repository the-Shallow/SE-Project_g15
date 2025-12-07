// src/components/group/__tests__/GroupJoinIntegration.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GroupPage from './GroupPage';
import * as groupsApi from '../../api/groups.js';

jest.mock('./GroupPage', () => {
  const React = require('react');
  const GroupCard = require('./GroupCard').default;
  return function MockedGroupPage() {
    const mockGroup = {
      id: 1,
      name: 'Pizza Lovers',
      members: ['Alice'],
      maxMembers: 3,
      restaurant_id: 101,
      organizer: 'Alice',
      deliveryType: 'Pickup',
      nextOrderTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    return (
      <div>
        <GroupCard
          group={mockGroup}
          actionLabel="Join Group"
          onAction={() => {}}
        />
      </div>
    );
  };
});

// ✅ Mock the getUserGroups API
jest.mock('../../api/groups.js', () => ({
  getUserGroups: jest.fn(),
  joinGroup: jest.fn(),
}));


describe('👥 Group Join Integration', () => {
  const mockGroups = [
  {
    id: 1,
    name: 'Pizza Lovers',
    members: ['SomeoneElse'], // ✅ user not in group
    maxMembers: 3,
    restaurant_id: 101,
    organizer: 'SomeoneElse',
    deliveryType: 'Pickup',
    nextOrderTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
];


  beforeEach(() => {
    groupsApi.getUserGroups.mockResolvedValue(mockGroups);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders groups and handles join action', async () => {
    render(<GroupPage />);

    // Wait for the mock groups to load
    expect(await screen.findByText('Pizza Lovers')).toBeInTheDocument();

    // Simulate a "Join Group" button if your GroupCard has one
    // (adjust text to match your real component)
    const joinButton = screen.getByText(/Join Group/i);
    expect(joinButton).toBeInTheDocument();

    // Mock joinGroup API call
    groupsApi.joinGroup.mockResolvedValue({
      ...mockGroups[0],
      members: ['Alice', 'Bob'],
    });

    fireEvent.click(joinButton);

    await waitFor(() =>
      expect(groupsApi.joinGroup).toHaveBeenCalledWith(1)
    );

    // After join, verify that Bob (the test user) appears in members
    await waitFor(() => {
      expect(screen.getByText(/Alice, Bob/)).toBeInTheDocument();
    });
  });
});
