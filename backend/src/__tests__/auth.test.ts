import { describe, it, expect } from "vitest";
import supertest from "supertest";
import express from "express";
import userRoutes from "../routes/userRoutes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/users", userRoutes);

describe("Auth Endpoints", () => {
  it("should return 401 when accessing protected profile without cookie", async () => {
    const res = await supertest(app).get("/api/users/profile");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});