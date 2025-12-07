import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import * as api from '../../api/auth';
import '@testing-library/jest-dom';

// Mock window.alert to avoid JSDOM errors
beforeAll(() => {
  window.alert = jest.fn();
});

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock loginUser API
jest.mock('../../api/auth', () => ({
  loginUser: jest.fn(),
}));

describe('Login Page', () => {

  test('renders all inputs and submit button disabled initially', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();

    const loginBtn = screen.getByRole('button', { name: /login/i });
    expect(loginBtn).toBeDisabled();
  });

  test('enables submit button when form is valid', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'user1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass123' },
    });

    expect(screen.getByRole('button', { name: /login/i })).toBeEnabled();
  });

  test('calls loginUser and navigates on success', async () => {
    api.loginUser.mockResolvedValue({ token: 'dummy' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'user1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(api.loginUser).toHaveBeenCalledWith('user1', 'pass123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows error when login fails', async () => {
    api.loginUser.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'wrong' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/Login failed\. Please try again\./i)).toBeInTheDocument();
  });

  test('clicking Sign up link navigates to signup page', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Sign up/i));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

});
