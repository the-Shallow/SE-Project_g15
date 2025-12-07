import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MenuItemCard from "./MenuItemCard";

describe("MenuItemCard Component", () => {
  const mockItem = {
    id: 1,
    name: "Margherita Pizza",
    price: 12,
    description: "Classic cheese pizza with tomato sauce",
  };

  const mockAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders item details correctly", () => {
    render(<MenuItemCard item={mockItem} onAddToCart={mockAddToCart} />);

    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("$12")).toBeInTheDocument();
    expect(screen.getByText("Classic cheese pizza with tomato sauce")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("calls onAddToCart when 'Add to Cart' button is clicked", () => {
    render(<MenuItemCard item={mockItem} onAddToCart={mockAddToCart} />);

    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(mockItem);
  });

  it("renders without crashing even if description is missing", () => {
    const itemWithoutDescription = { id: 2, name: "Burger", price: 8 };
    render(<MenuItemCard item={itemWithoutDescription} onAddToCart={mockAddToCart} />);

    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("$8")).toBeInTheDocument();
  });
});
