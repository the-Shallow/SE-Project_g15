import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import SignUp from './SignUp';
import * as api from '../../api/auth';

// ----------------------
// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// ----------------------
// Mock signupUser API
jest.mock('../../api/auth', () => ({
    signupUser: jest.fn(),
}));

// ----------------------
// Mock window.alert
beforeAll(() => {
    window.alert = jest.fn();
});

const renderSignUp = () =>
    render(
        <MemoryRouter>
            <CartProvider>
                <SignUp />
            </CartProvider>
        </MemoryRouter>
    );

describe('SignUp Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders all inputs and submit button', () => {
        renderSignUp();

        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();

        // Check button exists and is NOT loading
        const submitBtn = screen.getByRole('button', { name: /Sign Up/i });
        expect(submitBtn).toBeInTheDocument();
        expect(submitBtn).not.toBeDisabled();  // ✅ updated
    });


    test('enables submit button when form is valid', () => {
        renderSignUp();

        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'Dev' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'dev@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '123456' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: '123456' } });

        expect(screen.getByRole('button', { name: /Sign Up/i })).toBeEnabled();
    });

    test('calls signupUser API and navigates on success', async () => {
        const mockData = { message: 'User created' };
        api.signupUser.mockResolvedValue(mockData);

        renderSignUp();

        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'Dev' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'dev@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '123456' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: '123456' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

        await waitFor(() => {
            expect(api.signupUser).toHaveBeenCalledWith('Dev', 'dev@test.com', '123456');
            expect(mockNavigate).toHaveBeenCalledWith('/login');
            expect(window.alert).toHaveBeenCalledWith('Signup successful! You can now login.');
        });
    });

    test('shows error when passwords do not match', async () => {
        renderSignUp();

        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '123456' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: '654321' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match!')).toBeInTheDocument();
        });
    });
});
