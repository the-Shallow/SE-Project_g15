// src/pages/EditGroup/EditGroupPage.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditGroupPage from "./EditGroupPage";
import '@testing-library/jest-dom';

const mockUpdateGroup = jest.fn();
jest.mock("../../api/groups", () => ({
  updateGroup: (id, data) => mockUpdateGroup(id, data)
}));

jest.mock("../../utils/constants", () => ({
  RESTAURANTS: [
    { id: 1, name: "Test Restaurant", image: "🍔" },
    { id: 2, name: "Other Restaurant", image: "🍕" }
  ]
}));

jest.mock("../../components/common/Button/Button", () => ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}>{children}</button>
));

describe("EditGroupPage", () => {
  const group = {
    id: 1,
    restaurant_id: 1,
    deliveryLocation: "Office",
    nextOrderTime: new Date().toISOString(),
    maxMembers: 10
  };
  const onSave = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  test("renders form with initial values", () => {
    render(<EditGroupPage group={group} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByDisplayValue("Office")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  test("changing values and saving calls API", async () => {
    mockUpdateGroup.mockResolvedValueOnce({ ...group, maxMembers: 12 });
    render(<EditGroupPage group={group} onSave={onSave} onCancel={onCancel} />);

    fireEvent.change(screen.getByLabelText("Max Members"), { target: { value: 12 } });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdateGroup).toHaveBeenCalledWith(group.id, expect.objectContaining({ maxMembers: 12 }));
      expect(onSave).toHaveBeenCalled();
    });
  });

  test("cancel button triggers onCancel", () => {
    render(<EditGroupPage group={group} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
