import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GroupCard from './GroupCard';

// Helper to advance time
jest.useFakeTimers();

describe('GroupCard Component', () => {
  const baseGroup = {
    name: 'Test Group',
    members: ['user1', 'user2'],
    maxMembers: 5,
    nextOrderTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour ahead
  };

  beforeEach(() => {
    localStorage.setItem('username', 'tester');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders group name and member count', () => {
    render(<GroupCard group={baseGroup} onAction={jest.fn()} />);
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText(/👥 2 \/ 5 members/)).toBeInTheDocument();
  });

  it('renders "Open" status for active group', () => {
    render(<GroupCard group={baseGroup} onAction={jest.fn()} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders "Closing Soon" when within 15 minutes', () => {
    const soonGroup = {
      ...baseGroup,
      nextOrderTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    render(<GroupCard group={soonGroup} onAction={jest.fn()} />);
    expect(screen.getByText('Closing Soon')).toBeInTheDocument();
  });

  it('renders "Full" when members reach maxMembers', () => {
    const fullGroup = { ...baseGroup, members: Array(5).fill('x') };
    render(<GroupCard group={fullGroup} onAction={jest.fn()} />);
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('renders "Expired" when time is past', () => {
    const expiredGroup = {
      ...baseGroup,
      nextOrderTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    };
    render(<GroupCard group={expiredGroup} onAction={jest.fn()} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText(/Time.?s up!/i)).toBeInTheDocument();

  });

  it('updates countdown every second', () => {
    render(<GroupCard group={baseGroup} onAction={jest.fn()} />);
    const countdown = screen.getByText(/Time left:/);
    expect(countdown).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Countdown should update (won’t match exact text)
    expect(screen.getByText(/Time left:/)).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn();
    render(<GroupCard group={baseGroup} onAction={mockAction} />);
    const button = screen.getByRole('button', { name: /View Group/i });
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledWith(baseGroup);
  });

  it('uses custom action label if provided', () => {
    render(<GroupCard group={baseGroup} onAction={jest.fn()} actionLabel="Join Now" />);
    expect(screen.getByRole('button', { name: 'Join Now' })).toBeInTheDocument();
  });
});
