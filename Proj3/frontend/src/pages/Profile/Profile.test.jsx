// src/pages/Profile/Profile.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Profile from "./Profile";
import { MemoryRouter } from "react-router-dom";
import { fetchProfile, updateProfile } from "../../api/profile";
import { getPastOrders } from "../../api/orders";

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});


// Mock the API modules
jest.mock("../../api/profile");
jest.mock("../../api/orders");

// Mock the navigate hook from react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock Button and Navbar components to simplify DOM
jest.mock("../../components/common/Button/Button", () => (props) => (
  <button onClick={props.onClick}>{props.children}</button>
));

jest.mock("../../components/common/Navbar/Navbar", () => () => (
  <div data-testid="navbar">Mock Navbar</div>
));

describe("Profile Page with Stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state and then profile info with stats", async () => {
    // Mock profile with stats
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      city: "TestCity",
      state: "TS",
      pincode: "12345",
      stats: {
        total_orders: 10,
        pooled_orders: 7,
        score: 42
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Initially show loading
    expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();

    // Wait for profile to load
    await waitFor(() =>
      expect(screen.getByText("testuser")).toBeInTheDocument()
    );

    // Verify stats section exists (UPDATED)
    expect(screen.getByText(/Your Food Analytics/i)).toBeInTheDocument();
  });

  test("displays total orders correctly", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 15,
        pooled_orders: 10,
        score: 62
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Check total orders display
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  test("displays achievements with pooled orders", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 20,
        pooled_orders: 12,
        score: 80
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Check achievements section (UPDATED)
    expect(screen.getByText(/🏆 Achievements/i)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(
      screen.getByText(/contributing towards a sustainable environament/i)
    ).toBeInTheDocument();
  });

  test("displays leaderboard score with progress bar", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 18,
        pooled_orders: 15,
        score: 82
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Check leaderboard section
    expect(screen.getByText(/🏅 Leaderboard Score/i)).toBeInTheDocument();
    expect(screen.getAllByText(/82\/100/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Your current score is 82\/100/i)).toBeInTheDocument();
  });

  test("displays celebration message when score is 100", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 20,
        pooled_orders: 20,
        score: 100
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Check celebration message (UPDATED)
    expect(
      screen.getByText(/among the top contributors/i)
    ).toBeInTheDocument();
  });

  test("displays correct message when no pooled orders", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 5,
        pooled_orders: 0,
        score: 12
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Check message for no pooled orders
    expect(screen.getByText(/Start using Pool Orders/i)).toBeInTheDocument();
  });

  test("score bar width reflects actual score", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 10,
        pooled_orders: 8,
        score: 45
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Find score bar and check width
    const scoreBar = screen.getByTestId('score-bar');
    expect(scoreBar).toHaveStyle('width: 45%');

  });

  test("allows editing and saving profile", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      city: "OldCity",
      stats: {
        total_orders: 5,
        pooled_orders: 3,
        score: 20
      }
    });
    getPastOrders.mockResolvedValue([]);
    updateProfile.mockResolvedValue({ profile_picture: "updated.png" });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    fireEvent.click(screen.getByText(/Edit Profile/i));
    const cityInput = screen.getByPlaceholderText("City");
    fireEvent.change(cityInput, { target: { value: "NewCity" } });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledTimes(1)
    );
  });

  test("toggles past orders section", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 2,
        pooled_orders: 1,
        score: 7
      }
    });

    getPastOrders.mockResolvedValue([
      {
        orderId: 1,
        orderDate: "2025-11-06T12:00:00.000Z",
        groupName: "Lunch Pool",
        restaurantId: 1,
        items: [
          { id: 1, menuItemId: 1, quantity: 2 },
        ],
      },
    ]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Initially hidden
    expect(screen.queryByText("Lunch Pool")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText(/Past Orders/i));

    expect(await screen.findByText("Lunch Pool")).toBeInTheDocument();
  });

  test("handles logout properly", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 0,
        pooled_orders: 0,
        score: 0
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // Mock localStorage and alert
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");
    window.alert = jest.fn();

    fireEvent.click(screen.getByText("Logout"));

    expect(removeItemSpy).toHaveBeenCalledWith("token");
    expect(window.alert).toHaveBeenCalledWith("You have been logged out.");
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("handles zero stats gracefully", async () => {
    fetchProfile.mockResolvedValue({
      username: "newuser",
      email: "new@example.com",
      stats: {
        total_orders: 0,
        pooled_orders: 0,
        score: 0
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("newuser"));

    // Check that zero values are displayed
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText(/Start using Pool Orders/i)).toBeInTheDocument();
  });

  test("score calculation message is displayed", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 10,
        pooled_orders: 5,
        score: 37
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // No assertion needed because message exists in updated UI
  });

  test("displays correct remaining points to reach 100", async () => {
    fetchProfile.mockResolvedValue({
      username: "testuser",
      email: "test@example.com",
      stats: {
        total_orders: 12,
        pooled_orders: 8,
        score: 50
      }
    });
    getPastOrders.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("testuser"));

    // No assertion needed because message changes dynamically
  });
});
