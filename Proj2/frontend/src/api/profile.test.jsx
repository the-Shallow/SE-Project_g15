import API from "./axios";
import { fetchProfile, updateProfile } from "./profile";

jest.mock("./axios");

describe("profile API", () => {
  test("fetchProfile calls /profile and includes stats", async () => {
    API.get.mockResolvedValueOnce({ 
      data: { 
        username: "bob",
        stats: {
          total_orders: 10,
          pooled_orders: 7,
          score: 42
        }
      } 
    });
    const res = await fetchProfile();
    expect(API.get).toHaveBeenCalledWith("/profile");
    expect(res).toEqual({ 
      username: "bob",
      stats: {
        total_orders: 10,
        pooled_orders: 7,
        score: 42
      }
    });
  });

  test("fetchProfile handles missing stats gracefully", async () => {
    API.get.mockResolvedValueOnce({ 
      data: { 
        username: "bob"
      } 
    });
    const res = await fetchProfile();
    expect(API.get).toHaveBeenCalledWith("/profile");
    expect(res).toEqual({ username: "bob" });
  });

  test("updateProfile calls PUT /profile", async () => {
    API.put.mockResolvedValueOnce({ data: { message: "ok" } });
    const data = { full_name: "Bob" };
    const res = await updateProfile(data);
    expect(API.put).toHaveBeenCalledWith("/profile", data, {});
    expect(res).toEqual({ message: "ok" });
  });

  test("updateProfile handles stats in response", async () => {
    API.put.mockResolvedValueOnce({ 
      data: { 
        message: "ok",
        stats: {
          total_orders: 15,
          pooled_orders: 10,
          score: 62
        }
      } 
    });
    const data = { city: "New York" };
    const res = await updateProfile(data);
    expect(API.put).toHaveBeenCalledWith("/profile", data, {});
    expect(res.stats).toBeDefined();
    expect(res.stats.total_orders).toBe(15);
  });
});