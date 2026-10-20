import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
  redisClient: { set: vi.fn(), get: vi.fn(), del: vi.fn(), on: vi.fn() },
  transporter: { sendMail: vi.fn() },
  renderFile: vi.fn(),
}));

vi.mock("../../lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../../lib/redis", () => ({
  redisClient: mocks.redisClient,
  getRedis: async () => mocks.redisClient,
}));
vi.mock("../../lib/nodemailer", () => ({ transporter: mocks.transporter }));
vi.mock("ejs", () => ({ default: { renderFile: mocks.renderFile } }));
vi.mock("bcrypt", () => ({
  default: { hash: vi.fn(async () => "hashed-password"), compare: vi.fn() },
}));
vi.mock("../../config", () => ({
  default: {
    salt: 10,
    email_sender: "no-reply@example.com",
    accessTokenSecret: "test",
    refreshTokenSecret: "test",
  },
}));

import userRoutes from "./user.route";
import userService from "./user.service";
import globalError from "../../middleware/globalErrorHandler";
import notFound from "../../middleware/not-found";

const validBody = {
  name: "Rakib",
  email: "rakib@example.com",
  password: "secret123",
  phone: "01712345678",
  address: "Dhaka",
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  app.use(notFound);
  app.use(globalError);
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.user.findUnique.mockResolvedValue(null);
  mocks.redisClient.set.mockResolvedValue("OK");
  mocks.renderFile.mockResolvedValue("<p>otp email</p>");
  mocks.transporter.sendMail.mockResolvedValue({});
});

describe("userService.registerIntoDB (step 1: send verification code)", () => {
  it("rejects with 409 when the email already exists", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u1" });

    await expect(userService.registerIntoDB(validBody)).rejects.toMatchObject({
      statusCode: 409,
      message: "Email already exists!",
    });
    expect(mocks.redisClient.set).not.toHaveBeenCalled();
    expect(mocks.transporter.sendMail).not.toHaveBeenCalled();
  });

  it("stores a 6-digit OTP in Redis with a 5 minute expiry", async () => {
    await userService.registerIntoDB(validBody);

    const otpCall = mocks.redisClient.set.mock.calls.find(
      ([key]) => key === `registration-otp:${validBody.email}`,
    );
    expect(otpCall).toBeDefined();
    expect(typeof otpCall![1]).toBe("string");
    expect(otpCall![1]).toMatch(/^\d{6}$/);
    expect(otpCall![2]).toEqual({ expiration: { type: "EX", value: 300 } });
  });

  it("stores the pending user data with a hashed password, never the plain one", async () => {
    await userService.registerIntoDB(validBody);

    const dataCall = mocks.redisClient.set.mock.calls.find(
      ([key]) => key === `redisUserdata:${validBody.email}`,
    );
    expect(dataCall).toBeDefined();
    const stored = JSON.parse(dataCall![1]);
    expect(stored).toMatchObject({
      name: validBody.name,
      email: validBody.email,
      phone: validBody.phone,
      address: validBody.address,
      password: "hashed-password",
    });
    expect(dataCall![1]).not.toContain(validBody.password);
  });

  it("emails the OTP to the user using the template", async () => {
    await userService.registerIntoDB(validBody);

    const otpCall = mocks.redisClient.set.mock.calls.find(
      ([key]) => key === `registration-otp:${validBody.email}`,
    );
    expect(mocks.renderFile).toHaveBeenCalledWith(
      expect.stringContaining("email-verification.ejs"),
      { otp: Number(otpCall![1]), name: validBody.name },
    );
    expect(mocks.transporter.sendMail).toHaveBeenCalledWith({
      from: "no-reply@example.com",
      to: validBody.email,
      subject: "Verification",
      html: "<p>otp email</p>",
    });
  });

  it("does not create the user in the database yet", async () => {
    await userService.registerIntoDB(validBody);
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("userService.verifyEmail (step 2: confirm code and create user)", () => {
  const pending = JSON.stringify({
    name: validBody.name,
    email: validBody.email,
    password: "hashed-password",
    phone: validBody.phone,
    address: validBody.address,
  });

  it("rejects with 400 when the OTP is missing or expired", async () => {
    mocks.redisClient.get.mockResolvedValue(null);

    await expect(
      userService.verifyEmail(validBody.email, "123456"),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects with 400 'Invalid OTP.' when the code does not match", async () => {
    mocks.redisClient.get.mockResolvedValue("111111");

    await expect(
      userService.verifyEmail(validBody.email, "222222"),
    ).rejects.toMatchObject({ statusCode: 400, message: "Invalid OTP." });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
    expect(mocks.redisClient.del).not.toHaveBeenCalled();
  });

  it("creates a verified user with a profile and clears Redis when the code matches", async () => {
    mocks.redisClient.get.mockImplementation(async (key: string) =>
      key.startsWith("registration-otp:") ? "111111" : pending,
    );
    mocks.prisma.user.create.mockResolvedValue({ id: "u1" });

    const result = await userService.verifyEmail(validBody.email, "111111");

    expect(result).toEqual({ id: "u1" });
    expect(mocks.prisma.user.create).toHaveBeenCalledTimes(1);
    const { data } = mocks.prisma.user.create.mock.calls[0]![0];
    expect(data).toMatchObject({
      name: validBody.name,
      email: validBody.email,
      password: "hashed-password",
      isVerified: true,
    });
    // phone/address live on Profile, not User
    expect(data.profile).toEqual({
      create: { phone: validBody.phone, address: validBody.address },
    });
    expect(mocks.prisma.user.create.mock.calls[0]![0].omit).toEqual({
      password: true,
    });
    expect(data).not.toHaveProperty("phone");
    expect(data).not.toHaveProperty("address");
    expect(mocks.redisClient.del).toHaveBeenCalledWith(
      `registration-otp:${validBody.email}`,
    );
    expect(mocks.redisClient.del).toHaveBeenCalledWith(
      `redisUserdata:${validBody.email}`,
    );
  });
});

describe("POST /api/users (register)", () => {
  it("returns 200 and sends the code for valid data", async () => {
    const res = await request(buildApp()).post("/api/users").send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Verification code sent to your email",
      data: null,
    });
    expect(mocks.transporter.sendMail).toHaveBeenCalledTimes(1);
  });

  it("returns 409 when the email is already registered", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u1" });

    const res = await request(buildApp()).post("/api/users").send(validBody);

    expect(res.status).toBe(409);
    expect(mocks.transporter.sendMail).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid email", { ...validBody, email: "not-an-email" }],
    ["missing name", { ...validBody, name: undefined }],
    ["short password", { ...validBody, password: "123" }],
    ["bad phone", { ...validBody, phone: "12345678901" }],
    ["empty body", {}],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await request(buildApp()).post("/api/users").send(body);

    expect(res.status).toBe(400);
    expect(mocks.transporter.sendMail).not.toHaveBeenCalled();
  });
});

describe("POST /api/users/verified-email", () => {
  it("returns 201 and the created user when the code matches", async () => {
    mocks.redisClient.get.mockImplementation(async (key: string) =>
      key.startsWith("registration-otp:")
        ? "111111"
        : JSON.stringify({
            name: validBody.name,
            email: validBody.email,
            password: "hashed-password",
            phone: validBody.phone,
            address: validBody.address,
          }),
    );
    mocks.prisma.user.create.mockResolvedValue({ id: "u1", isVerified: true });

    const res = await request(buildApp())
      .post("/api/users/verified-email")
      .send({ email: validBody.email, code: "111111" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id: "u1", isVerified: true });
  });

  it("returns 400 'Invalid OTP.' for a wrong code", async () => {
    mocks.redisClient.get.mockResolvedValue("111111");

    const res = await request(buildApp())
      .post("/api/users/verified-email")
      .send({ email: validBody.email, code: "999999" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid OTP.");
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it.each([
    ["otp key", { email: validBody.email, otp: "111111" }],
    ["numeric code", { email: validBody.email, code: 111111 }],
  ])("accepts the code sent as %s", async (_label, body) => {
    mocks.redisClient.get.mockResolvedValue("111111");
    mocks.redisClient.get.mockImplementation(async (key: string) =>
      key.startsWith("registration-otp:")
        ? "111111"
        : JSON.stringify({ name: "Rakib", email: validBody.email }),
    );
    mocks.prisma.user.create.mockResolvedValue({ id: "u1" });

    const res = await request(buildApp())
      .post("/api/users/verified-email")
      .send(body);

    expect(res.status).toBe(201);
  });

  it("returns 400 when the code is missing", async () => {
    const res = await request(buildApp())
      .post("/api/users/verified-email")
      .send({ email: validBody.email });

    expect(res.status).toBe(400);
    expect(mocks.redisClient.get).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed code", async () => {
    const res = await request(buildApp())
      .post("/api/users/verified-email")
      .send({ email: validBody.email, code: "abc" });

    expect(res.status).toBe(400);
    expect(mocks.redisClient.get).not.toHaveBeenCalled();
  });
});
