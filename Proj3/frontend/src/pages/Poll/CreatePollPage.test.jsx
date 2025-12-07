// src/pages/Poll/CreatePollPage.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreatePollPage from "./CreatePollPage";
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'Guest'),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock API
const mockCreatePoll = jest.fn();
jest.mock("../../api/groups", () => ({
  createPoll: (groupId, pollData) => mockCreatePoll(groupId, pollData)
}));

// Mock Button component
jest.mock("../../components/common/Button/Button", () => ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}>{children}</button>
));

describe("CreatePollPage", () => {
  const group = { id: 1, name: "Test Group" };
  const onBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders page and shows initial inputs", () => {
    render(<CreatePollPage group={group} onBack={onBack} />);

    expect(screen.getByText(`Create Poll for ${group.name}`)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/Option/i)).toHaveLength(2);
  });

  test("adding and removing options works", () => {
    render(<CreatePollPage group={group} onBack={onBack} />);
    
    fireEvent.click(screen.getByText("+ Add Option"));
    expect(screen.getAllByPlaceholderText(/Option/i)).toHaveLength(3);

    const removeButtons = screen.getAllByText("✕");
    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText(/Option/i)).toHaveLength(2);
  });

  test("validation prevents creating poll with empty fields", async () => {
    render(<CreatePollPage group={group} onBack={onBack} />);
    fireEvent.click(screen.getByText("Create Poll"));

    expect(await screen.findByText("Please enter a poll question")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter poll question"), { target: { value: "My Question" } });
    fireEvent.change(screen.getAllByPlaceholderText(/Option/i)[0], { target: { value: "" } });
    fireEvent.change(screen.getAllByPlaceholderText(/Option/i)[1], { target: { value: "Option 2" } });

    fireEvent.click(screen.getByText("Create Poll"));
    expect(await screen.findByText("Please provide at least 2 options")).toBeInTheDocument();
  });

  test("successful poll creation calls API and triggers onBack", async () => {
    mockCreatePoll.mockResolvedValueOnce({});
    render(<CreatePollPage group={group} onBack={onBack} />);

    fireEvent.change(screen.getByPlaceholderText("Enter poll question"), { target: { value: "My Question" } });
    fireEvent.change(screen.getAllByPlaceholderText(/Option/i)[0], { target: { value: "Option 1" } });
    fireEvent.change(screen.getAllByPlaceholderText(/Option/i)[1], { target: { value: "Option 2" } });

    fireEvent.click(screen.getByText("Create Poll"));

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith(group.id, {
        question: "My Question",
        options: ["Option 1", "Option 2"],
        createdBy: "Guest"
      });
      expect(onBack).toHaveBeenCalled();
    });
  });
});
