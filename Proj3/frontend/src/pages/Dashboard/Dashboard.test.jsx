// src/pages/Dashboard/Dashboard.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import '@testing-library/jest-dom';

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((msg) => {
    if (msg.includes('React Router Future Flag Warning')) return;
    console.warn(msg);
  });
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});


// ------------------------
// Mock localStorage FIRST
// ------------------------
const localStorageMock = {
  getItem: jest.fn((key) => {
    if (key === 'username') return 'Guest';
    return null;
  }),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// ------------------------
// Mock CartContext
// ------------------------
const mockAddToCart = jest.fn();
jest.mock("../../context/CartContext.jsx", () => ({
  useCart: () => ({ addToCart: mockAddToCart }),
  __esModule: true,
}));

// ------------------------
// Mock API modules
// ------------------------
const mockGetUserGroups = jest.fn();
const mockGetAllGroups = jest.fn();
const mockGetGroupDetails = jest.fn();
const mockJoinGroup = jest.fn();

jest.mock("../../api/groups", () => ({
  getUserGroups: (username) => mockGetUserGroups(username),
  getAllGroups: () => mockGetAllGroups(),
  getGroupDetails: (id) => mockGetGroupDetails(id),
  joinGroup: (id, username) => mockJoinGroup(id, username),
}));

// ------------------------
// Mock Navbar and CartSidebar
// ------------------------
jest.mock("../../components/common/Navbar/Navbar", () => ({ currentPage, onPageChange }) => (
  <div data-testid="navbar">
    <button onClick={() => onPageChange("home")}>Home</button>
    <button onClick={() => onPageChange("mygroups")}>My Groups</button>
    <button onClick={() => onPageChange("findgroups")}>Find Groups</button>
  </div>
));
jest.mock("../../components/common/Cart/CartSidebar", () => () => <div data-testid="cart-sidebar" />);

// ------------------------
// Mock constants
// ------------------------
jest.mock("../../utils/constants", () => ({
  RESTAURANTS: [
    { id: 1, name: "Test Restaurant 1", image: "🍔", rating: 4.5, location: "Test City", offers: "10% off", items: [{ id: "item1", name: "Burger", price: 10 }, { id: "item2", name: "Fries", price: 5 }] },
    { id: 2, name: "Test Restaurant 2", image: "🍕", rating: 4.0, location: "Test Town", offers: "Free Drink", items: [{ id: "item3", name: "Pizza", price: 12 }] }
  ],
  PAGES: {
    HOME: "home",
    MY_GROUPS: "mygroups",
    FIND_GROUPS: "findgroups",
    EDIT_GROUP: "editgroup",
    CREATE_POLL: "createpoll"
  }
}));

// ------------------------
// Mock GroupCard
// ------------------------
jest.mock('../../components/group/GroupCard', () => ({ group, onAction, actionLabel }) => {
  const React = require('react');
  return React.createElement(
    'div',
    { 'data-testid': `group-card-${group.id}` },
    React.createElement('span', null, group.name),
    React.createElement('button', { onClick: onAction }, actionLabel)
  );
});

// ------------------------
// Mock GroupDetail
// ------------------------
jest.mock('../../components/group/GroupDetail', () => {
  const React = require('react');
  return function MockGroupDetail({ group, onClose, onEditGroup }) {
    return React.createElement(
      'div',
      { 'data-testid': 'group-detail' },
      React.createElement('h2', null, group.name),
      React.createElement('div', null, group.deliveryLocation),
      group.members.map((member, i) => React.createElement('div', { key: i }, member)),
      React.createElement('button', { onClick: () => onEditGroup(group) }, 'Edit'),
      React.createElement('button', { onClick: onClose }, 'Close')
    );
  };
});

// ------------------------
// Mock EditGroupPage
// ------------------------
jest.mock("../../pages/EditGroup/EditGroupPage", () => {
  const React = require("react");
  return function MockEditGroupPage({ group, onSave, onCancel }) {
    return React.createElement(
      "div",
      { "data-testid": "edit-group-page" },
      React.createElement("h2", null, "Edit Group"),
      React.createElement("button", { onClick: () => onSave({ ...group, name: "Updated Group" }) }, "Save"),
      React.createElement("button", { onClick: onCancel }, "Cancel")
    );
  };
});

// ------------------------
// Other component mocks
// ------------------------
jest.mock("../../components/restaurant/RestaurantCard", () => ({ restaurant, onClick }) => (
  <div data-testid={`restaurant-card-${restaurant.id}`} onClick={() => onClick(restaurant)}>
    <span>{restaurant.name}</span>
  </div>
));
jest.mock("../../components/restaurant/MenuItemCard", () => ({ item, onAddToCart }) => (
  <div data-testid={`menu-item-${item.id}`}>
    <span>{item.name}</span>
    <button onClick={() => onAddToCart(item)}>Add to Cart</button>
  </div>
));
jest.mock("../../components/common/Button/Button", () => ({ children, onClick, variant, className }) => (
  <button onClick={onClick} className={`btn btn-${variant} ${className || ''}`} type="button">{children}</button>
));



// ------------------------
// Tests
// ------------------------
describe("Dashboard Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders 'Restaurants Near You' and all restaurant cards", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("Restaurants Near You")).toBeInTheDocument();
    expect(screen.getByText("Test Restaurant 1")).toBeInTheDocument();
    expect(screen.getByText("Test Restaurant 2")).toBeInTheDocument();
  });
});

describe("Dashboard Restaurant Detail Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("clicking Add to Cart calls addToCart", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Open restaurant detail
    fireEvent.click(screen.getByText("Test Restaurant 1"));

    // Wait for menu items to appear
    await waitFor(() => {
      expect(screen.getByText("Burger")).toBeInTheDocument();
    });

    // Click "Add to Cart" for first item
    fireEvent.click(screen.getAllByText(/Add to Cart/i)[0]);
    expect(mockAddToCart).toHaveBeenCalledWith({ id: "item1", name: "Burger", price: 10 });
  });
});

describe("Dashboard Navbar Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configure mocks with test data
    mockGetUserGroups.mockResolvedValue([
      {
        id: 1,
        name: "Office Lunch Crew",
        restaurant: "Pizza Palace",
        members: ["Alice", "Bob"],
        deliveryType: "Doorstep",
        nextOrderTime: new Date(),
        deliveryLocation: "Office Lobby",
        maxMembers: 10
      }
    ]);

    mockGetAllGroups.mockResolvedValue([]);
  });

  test("clicking navbar buttons switches views correctly", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // ===== HOME VIEW =====
    // Verify home view shows restaurants initially
    expect(screen.getByText("Restaurants Near You")).toBeInTheDocument();
    expect(screen.getByText("Test Restaurant 1")).toBeInTheDocument();

    // ===== MY GROUPS VIEW =====
    // Click 'My Groups' button
    fireEvent.click(screen.getByRole("button", { name: "My Groups" }));

    // Wait for the page title to change (use getByRole to be specific)
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "My Groups" })).toBeInTheDocument();
    });

    // Verify getUserGroups was called with correct username
    expect(mockGetUserGroups).toHaveBeenCalled();

    // Wait for the group to appear
    await waitFor(() => {
      expect(screen.getByText("Office Lunch Crew")).toBeInTheDocument();
    });

    // Verify empty state is NOT shown
    expect(screen.queryByText("You haven't joined any groups yet.")).not.toBeInTheDocument();

    // Verify home content is NOT visible
    expect(screen.queryByText("Restaurants Near You")).not.toBeInTheDocument();

    // ===== FIND GROUPS VIEW =====
    // Click 'Find Groups' button
    fireEvent.click(screen.getByRole("button", { name: "Find Groups" }));

    // Wait for Find Groups page title (use getByRole to be specific)
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Find Groups" })).toBeInTheDocument();
    });

    // Verify getAllGroups was called
    expect(mockGetAllGroups).toHaveBeenCalled();

    // Wait for the empty state to appear (since mockGetAllGroups returns empty array)
    await waitFor(() => {
      expect(screen.getByText("No groups available to join right now.")).toBeInTheDocument();
    });

    // Verify My Groups content is NOT visible
    expect(screen.queryByText("Office Lunch Crew")).not.toBeInTheDocument();

    // ===== BACK TO HOME =====
    // Click 'Home' button
    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    // Verify we're back to home view
    await waitFor(() => {
      expect(screen.getByText("Restaurants Near You")).toBeInTheDocument();
    });

    // Verify Find Groups content is NOT visible
    expect(screen.queryByText("No groups available to join right now.")).not.toBeInTheDocument();
  });
});

// ------------------------
// MY_GROUPS API behavior tests
// ------------------------
describe("MY_GROUPS API behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const goToMyGroups = () => {
    fireEvent.click(screen.getByRole("button", { name: "My Groups" }));
  };

  test("shows loading state while fetching user groups", async () => {
    // delay the promise so loading UI appears
    mockGetUserGroups.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 200))
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    goToMyGroups();

    // loading state should appear immediately
    expect(screen.getByText(/Loading your groups/i)).toBeInTheDocument();

    // wait till fetch finishes
    await waitFor(() =>
      expect(mockGetUserGroups).toHaveBeenCalledWith("Guest")
    );
  });

  test("shows error banner when API fails", async () => {
    mockGetUserGroups.mockRejectedValueOnce(new Error("API failed"));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    goToMyGroups();

    await waitFor(() =>
      expect(
        screen.getByText(/Failed to load your groups/i)
      ).toBeInTheDocument()
    );

    // retry button should appear
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  test("shows empty state when zero groups returned", async () => {
    mockGetUserGroups.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    goToMyGroups();

    await waitFor(() =>
      expect(
        screen.getByText("You haven't joined any groups yet.")
      ).toBeInTheDocument()
    );
  });

  test("renders group list on success", async () => {
    mockGetUserGroups.mockResolvedValueOnce([
      { id: 1, name: "Test Group", members: ["Guest"] },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    goToMyGroups();

    await waitFor(() => {
      expect(screen.getByText("Test Group")).toBeInTheDocument();
    });

    // empty message should NOT show
    expect(
      screen.queryByText("You haven't joined any groups yet.")
    ).not.toBeInTheDocument();
  });
});

// ------------------------
// Group Detail View tests
// ------------------------
describe("Group detail behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGroupList = [{ id: 1, name: "Lunch Crew", members: ["Guest"] }];

  const mockGroupDetail = {
    id: 1,
    name: "Lunch Crew",
    members: ["Guest", "Alice"],
    restaurant: "Taco Town",
    deliveryLocation: "Office",
    maxMembers: 5,
  };

  test("clicking View Details loads group details and shows GroupDetail UI", async () => {
    mockGetUserGroups.mockResolvedValueOnce(mockGroupList);
    mockGetGroupDetails.mockResolvedValueOnce(mockGroupDetail);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Navigate to My Groups
    fireEvent.click(screen.getByRole("button", { name: /My Groups/i }));

    // Wait for group card
    await screen.findByText("Lunch Crew");

    // Click View Details
    fireEvent.click(screen.getByRole("button", { name: /View Details/i }));

    // Wait for detail UI
    expect(await screen.findByTestId("group-detail")).toBeInTheDocument();

    // Verify fields exist
    expect(screen.getByText("Lunch Crew")).toBeInTheDocument();
    expect(screen.getByText("Office")).toBeInTheDocument();
    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();

    // Ensure the group list empty state is gone
    expect(screen.queryByText(/You haven't joined any groups yet/i)).not.toBeInTheDocument();
  });
});

// ------------------------
// Edit Group navigation & save/cancel behavior
// ------------------------
describe("Edit Group navigation and save/cancel behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGroupList = [{ id: 1, name: "Lunch Crew", members: ["Guest"] }];
  const mockGroupDetail = { id: 1, name: "Lunch Crew", members: ["Guest"], location: "Office" };

  test("Edit button opens EditGroupPage, Cancel returns, Save refreshes group list", async () => {
  // Initial mocks
  mockGetUserGroups.mockResolvedValue(mockGroupList);
  mockGetGroupDetails.mockResolvedValue(mockGroupDetail);

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  // Go to My Groups page
  fireEvent.click(screen.getByRole("button", { name: /My Groups/i }));

  // Wait for group card to appear
  const groupCard = await screen.findByText("Lunch Crew");

  // Click action button to view details
  const viewDetailsButton = await screen.findByRole("button", { name: /View Details/i });
  fireEvent.click(viewDetailsButton);

  // Wait for GroupDetail to render
  await screen.findByTestId("group-detail");

  // Click Edit
  fireEvent.click(screen.getByRole("button", { name: /Edit/i }));

  // Wait for EditGroupPage
  await screen.findByText(/Edit Group/i);

  // -------- Cancel --------
  fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

  // Reset mock
  mockGetUserGroups.mockResolvedValue(mockGroupList);

  // Wait for My Groups page to appear
  await waitFor(() => expect(screen.getByText("My Groups")).toBeInTheDocument());

  // Ensure EditGroupPage is gone
  expect(screen.queryByText(/Edit Group/i)).not.toBeInTheDocument();

  // -------- Save --------
  // Click Edit again
  fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
  fireEvent.click(screen.getByRole("button", { name: /Save/i }));

  // Wait for My Groups page to appear
  await waitFor(() => expect(screen.getByText("My Groups")).toBeInTheDocument());

  // Verify getUserGroups called twice
  expect(mockGetUserGroups).toHaveBeenCalledTimes(4); // 2 before + 2 after (Cancel + Save)
});
});

describe("Find Groups filtering and join behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true); // Always confirm join
    window.alert = jest.fn();
  });

  const mockGroups = [
    {
      id: 1,
      name: "Open Group",
      members: ["Alice"],
      restaurant_id: 1,
      nextOrderTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours ahead
    },
    {
      id: 2,
      name: "Closing Soon",
      members: ["Alice"],
      restaurant_id: 2,
      nextOrderTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min ahead
    },
    {
      id: 3,
      name: "Expired Group",
      members: ["Alice"],
      restaurant_id: 1,
      nextOrderTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // expired
    },
  ];

  test("filters by status and restaurant correctly", async () => {
    mockGetAllGroups.mockResolvedValue(mockGroups);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Navigate to Find Groups
    fireEvent.click(screen.getByRole("button", { name: /Find Groups/i }));
    await waitFor(() => expect(mockGetAllGroups).toHaveBeenCalled());

    // "All" should show all groups except ones joined by "Guest"
    expect(screen.getByText("Open Group")).toBeInTheDocument();
    expect(screen.getAllByText("Closing Soon")[0]).toBeInTheDocument();

    // Change filter to "closing"
    fireEvent.change(screen.getByDisplayValue("All"), { target: { value: "closing" } });
    await waitFor(() => {
      expect(screen.getAllByText("Closing Soon")[0]).toBeInTheDocument();
      expect(screen.queryByText("Open Group")).not.toBeInTheDocument();
    });

    // Change restaurant filter
    fireEvent.change(screen.getByLabelText("Restaurant:"), { target: { value: "1" } });
    expect(screen.queryByText("Closing Soon")).not.toBeInTheDocument();
  });

  test("joining a group triggers API and success alert", async () => {
    mockGetAllGroups.mockResolvedValue([mockGroups[0]]);
    mockJoinGroup.mockResolvedValueOnce({});
    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: /Find Groups/i }));
    await screen.findByText("Open Group");

    // Click Join Group
    fireEvent.click(screen.getByRole("button", { name: /Join Group/i }));

    await waitFor(() => expect(mockJoinGroup).toHaveBeenCalledWith(1, undefined));
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Successfully joined/i));
  });

  test("join group failure shows alert message", async () => {
    mockGetAllGroups.mockResolvedValue([mockGroups[0]]);
    mockJoinGroup.mockRejectedValueOnce({ response: { data: { error: "Join failed" } } });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: /Find Groups/i }));
    await screen.findByText("Open Group");

    fireEvent.click(screen.getByRole("button", { name: /Join Group/i }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Join failed"));
  });
});
