import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { CartProvider } from '../context/CartContext';

test("redirects root to login", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AppRoutes />
    </MemoryRouter>
  );
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});

test("renders dashboard route", () => {
  render(
    <CartProvider>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>
    </CartProvider>
  );
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
