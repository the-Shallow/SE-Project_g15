/**
 * @file auth.test.js
 * Unit tests for authentication API functions (signupUser & loginUser).
 * These tests mock axios requests and verify correct request behavior,
 * response handling, and localStorage interactions.
 */

import API from "./axios";
import { signupUser, loginUser } from "./auth";

// Mock the axios instance
jest.mock("./axios");

describe("auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("signupUser", () => {
    it("calls /auth/register with correct payload and returns data", async () => {
      const mockResponse = { data: { message: "User registered" } };
      API.post.mockResolvedValueOnce(mockResponse);

      const result = await signupUser("Alice", "alice@example.com", "pass123");

      expect(API.post).toHaveBeenCalledWith("/auth/register", {
        username: "Alice",
        email: "alice@example.com",
        password: "pass123",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("throws error when signup fails", async () => {
      const errorResponse = {
        response: { data: { message: "Email already exists" } },
      };
      API.post.mockRejectedValueOnce(errorResponse);

      await expect(
        signupUser("Alice", "alice@example.com", "pass123")
      ).rejects.toEqual(errorResponse);

      expect(console.error).toHaveBeenCalled; // Optional
    });
  });

  describe("loginUser", () => {
    it("calls /auth/login with correct payload and stores token & username", async () => {
      const mockResponse = {
        data: { token: "fakeToken", username: "Alice" },
      };
      API.post.mockResolvedValueOnce(mockResponse);

      const result = await loginUser("Alice", "password123");

      expect(API.post).toHaveBeenCalledWith("/auth/login", {
        username: "Alice",
        password: "password123",
      });
      expect(localStorage.getItem("token")).toBe("fakeToken");
      expect(localStorage.getItem("username")).toBe("Alice");
      expect(result).toEqual(mockResponse.data);
    });

    it("does not store anything if token is missing", async () => {
      const mockResponse = { data: { message: "No token" } };
      API.post.mockResolvedValueOnce(mockResponse);

      const result = await loginUser("Bob", "1234");

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("username")).toBeNull();
      expect(result).toEqual(mockResponse.data);
    });

    it("throws server error correctly when login fails", async () => {
      const errorResponse = {
        response: { data: { message: "Invalid credentials" } },
      };
      API.post.mockRejectedValueOnce(errorResponse);

      await expect(loginUser("Alice", "wrong")).rejects.toEqual(
        errorResponse.response.data
      );
    });

    it("throws generic error if no server response", async () => {
      const networkError = new Error("Network error");
      API.post.mockRejectedValueOnce(networkError);

      await expect(loginUser("Alice", "123")).rejects.toEqual({
        message: "Network error",
      });
    });
  });
});
