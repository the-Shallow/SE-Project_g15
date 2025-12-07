import { render, screen, fireEvent } from "@testing-library/react";
import RestaurantCard from "./RestaurantCard";

describe("RestaurantCard", () => {
  const mockRestaurant = {
    name: "Pizza Palace",
    image: "🍕",
    rating: 4.5,
    location: "Downtown",
    offers: "20% off today",
  };
  const mockClick = jest.fn();

  test("renders restaurant details", () => {
    render(<RestaurantCard restaurant={mockRestaurant} onClick={mockClick} />);
    expect(screen.getByText("Pizza Palace")).toBeInTheDocument();
    expect(screen.getByText(/Downtown/)).toBeInTheDocument();
    expect(screen.getByText(/20% off/)).toBeInTheDocument();
  });

  test("calls onClick when clicked", () => {
    render(<RestaurantCard restaurant={mockRestaurant} onClick={mockClick} />);
    fireEvent.click(screen.getByText("Pizza Palace"));
    expect(mockClick).toHaveBeenCalledWith(mockRestaurant);
  });
});
