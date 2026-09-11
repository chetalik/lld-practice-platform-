import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("API", () => {
  it("lists problems", async () => {
    const response = await request(createApp()).get("/api/problems");
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(4);
  });

  it("rejects an empty submission", async () => {
    const response = await request(createApp())
      .post("/api/problems/parking-lot/attempts")
      .send({ content: " " });

    expect(response.status).toBe(400);
  });

  it("creates and evaluates an attempt", async () => {
    const response = await request(createApp())
      .post("/api/problems/parking-lot/attempts")
      .send({
        content: "Vehicle, ParkingSpot, Ticket. AllocationStrategy interface. PricingStrategy. Trade-offs."
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("COMPLETED");
    expect(response.body.evaluation).toBeTruthy();
  });
});
