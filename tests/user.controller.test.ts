import { db } from "../src/db/index.js";
import {
  createUser,
  deleteUser,
  fetchAllUsers,
  fetchUserByAccountID,
  updateUser,
} from "../src/controllers/user.controller.ts";

jest.mock("../src/db/index.js", () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const createReply = () => {
  const reply: any = {
    statusCode: 0,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: unknown) {
      this.payload = body;
      return this;
    },
  };

  return reply;
};

describe("user.controller", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchAllUsers", () => {
    it("returns paginated users for explicit query", async () => {
      const offset = jest.fn().mockResolvedValueOnce([
        {
          id: "1",
          lastname: "Doe",
          firstname: "John",
          email: "john@example.com",
          accountType: { title: "Admin" },
        },
      ]);
      const limit = jest.fn().mockReturnValue({ offset });
      const orderBy = jest.fn().mockReturnValue({ limit });
      const leftJoin = jest.fn().mockReturnValue({ orderBy });
      const fromUsers = jest.fn().mockReturnValue({ leftJoin });
      const fromCount = jest.fn().mockResolvedValue([{ count: 1 }]);

      (db.select as jest.Mock)
        .mockReturnValueOnce({ from: fromUsers })
        .mockReturnValueOnce({ from: fromCount });

      const req: any = {
        query: { page: "1", limit: "10", sortOrder: "asc", sortBy: "lastname" },
      };
      const reply = createReply();

      await fetchAllUsers(req, reply);

      expect(reply.statusCode).toBe(200);
      expect(reply.payload.data.total).toBe(1);
      expect(reply.payload.data.page).toBe(1);
      expect(reply.payload.data.limit).toBe(10);
      expect(reply.payload.data.pageTotal).toBe(1);
    });

    it("uses defaults when query is empty", async () => {
      const offset = jest.fn().mockResolvedValueOnce([]);
      const limit = jest.fn().mockReturnValue({ offset });
      const orderBy = jest.fn().mockReturnValue({ limit });
      const leftJoin = jest.fn().mockReturnValue({ orderBy });
      const fromUsers = jest.fn().mockReturnValue({ leftJoin });
      const fromCount = jest.fn().mockResolvedValue([{ count: 0 }]);

      (db.select as jest.Mock)
        .mockReturnValueOnce({ from: fromUsers })
        .mockReturnValueOnce({ from: fromCount });

      const req: any = { query: {} };
      const reply = createReply();

      await fetchAllUsers(req, reply);

      expect(reply.statusCode).toBe(200);
      expect(reply.payload.data.total).toBe(0);
      expect(reply.payload.data.page).toBe(1);
      expect(reply.payload.data.limit).toBe(10);
      expect(reply.payload.data.pageTotal).toBe(0);
    });

    it("returns 500 on database error", async () => {
      (db.select as jest.Mock).mockImplementation(() => {
        throw new Error("db failed");
      });

      const req: any = { query: {} };
      const reply = createReply();

      await fetchAllUsers(req, reply);

      expect(reply.statusCode).toBe(500);
      expect(reply.payload.message).toBe("Server error");
    });
  });

  describe("fetchUserByAccountID", () => {
    it("returns 404 when user not found", async () => {
      const where = jest.fn().mockResolvedValue([]);
      const leftJoin = jest.fn().mockReturnValue({ where });
      const from = jest.fn().mockReturnValue({ leftJoin });
      (db.select as jest.Mock).mockReturnValue({ from });

      const req: any = { params: { id: "missing-id" } };
      const reply = createReply();

      await fetchUserByAccountID(req, reply);

      expect(reply.statusCode).toBe(404);
      expect(reply.payload.message).toBe("User not found");
    });

    it("returns 200 when user exists", async () => {
      const where = jest
        .fn()
        .mockResolvedValue([{ id: "u1", firstname: "John" }]);
      const leftJoin = jest.fn().mockReturnValue({ where });
      const from = jest.fn().mockReturnValue({ leftJoin });
      (db.select as jest.Mock).mockReturnValue({ from });

      const req: any = { params: { id: "u1" } };
      const reply = createReply();

      await fetchUserByAccountID(req, reply);

      expect(reply.statusCode).toBe(200);
      expect(reply.payload.message).toBe("Get user with ID u1");
      expect(reply.payload.data).toBeDefined();
    });

    it("returns 500 on database error", async () => {
      const where = jest.fn().mockRejectedValue(new Error("db failed"));
      const leftJoin = jest.fn().mockReturnValue({ where });
      const from = jest.fn().mockReturnValue({ leftJoin });
      (db.select as jest.Mock).mockReturnValue({ from });

      const req: any = { params: { id: "u1" } };
      const reply = createReply();

      await fetchUserByAccountID(req, reply);

      expect(reply.statusCode).toBe(500);
      expect(reply.payload.message).toBe("Server error");
    });
  });

  describe("createUser", () => {
    it("returns 400 when email is missing", async () => {
      const req: any = { body: { password: "p" } };
      const reply = createReply();

      await createUser(req, reply);

      expect(reply.statusCode).toBe(400);
      expect(reply.payload.message).toBe("Email and password required");
    });

    it("returns 400 when password is missing", async () => {
      const req: any = { body: { email: "user@example.com" } };
      const reply = createReply();

      await createUser(req, reply);

      expect(reply.statusCode).toBe(400);
      expect(reply.payload.message).toBe("Email and password required");
    });

    it("returns 400 when user already exists", async () => {
      const where = jest.fn().mockResolvedValue([{ id: "u1" }]);
      const from = jest.fn().mockReturnValue({ where });
      (db.select as jest.Mock).mockReturnValue({ from });

      const req: any = {
        body: { email: "user@example.com", password: "pass" },
      };
      const reply = createReply();

      await createUser(req, reply);

      expect(reply.statusCode).toBe(400);
      expect(reply.payload.message).toBe("User already exists");
    });

    it("returns 201 when user can be created", async () => {
      const where = jest.fn().mockResolvedValue([]);
      const from = jest.fn().mockReturnValue({ where });
      (db.select as jest.Mock).mockReturnValue({ from });

      const req: any = {
        body: { email: "user@example.com", password: "pass" },
      };
      const reply = createReply();

      await createUser(req, reply);

      expect(reply.statusCode).toBe(201);
      expect(reply.payload.message).toBe("User registered successfully");
    });

    it("returns 500 on database error", async () => {
      const where = jest.fn().mockRejectedValue(new Error("db failed"));
      const from = jest.fn().mockReturnValue({ where });
      (db.select as jest.Mock).mockReturnValue({ from });

      const req: any = {
        body: { email: "user@example.com", password: "pass" },
      };
      const reply = createReply();

      await createUser(req, reply);

      expect(reply.statusCode).toBe(500);
      expect(reply.payload.message).toBe("Server error");
    });
  });

  describe("updateUser", () => {
    it("returns 400 when user_id is missing", async () => {
      const req: any = { params: { user_id: "" }, body: {} };
      const reply = createReply();

      await updateUser(req, reply);

      expect(reply.statusCode).toBe(400);
      expect(reply.payload.message).toBe("user_id is required");
    });

    it("returns 200 when update succeeds", async () => {
      const where = jest.fn().mockResolvedValue(undefined);
      const set = jest.fn().mockReturnValue({ where });
      (db.update as jest.Mock).mockReturnValue({ set });

      const req: any = {
        params: { user_id: "u1" },
        body: { firstname: "Updated" },
      };
      const reply = createReply();

      await updateUser(req, reply);

      expect(reply.statusCode).toBe(200);
      expect(reply.payload.message).toBe("User with ID u1 updated");
    });

    it("returns 404 for ER_ROW_IS_REFERENCED_2 error", async () => {
      const where = jest
        .fn()
        .mockRejectedValue({ code: "ER_ROW_IS_REFERENCED_2" });
      const set = jest.fn().mockReturnValue({ where });
      (db.update as jest.Mock).mockReturnValue({ set });

      const req: any = {
        params: { user_id: "u1" },
        body: { firstname: "Updated" },
      };
      const reply = createReply();

      await updateUser(req, reply);

      expect(reply.statusCode).toBe(404);
      expect(reply.payload.message).toBe("User not found");
    });

    it("returns 500 for other errors", async () => {
      const where = jest.fn().mockRejectedValue(new Error("db failed"));
      const set = jest.fn().mockReturnValue({ where });
      (db.update as jest.Mock).mockReturnValue({ set });

      const req: any = {
        params: { user_id: "u1" },
        body: { firstname: "Updated" },
      };
      const reply = createReply();

      await updateUser(req, reply);

      expect(reply.statusCode).toBe(500);
      expect(reply.payload.message).toBe("Server error");
    });
  });

  describe("deleteUser", () => {
    it("returns 400 when user_id is missing", async () => {
      const req: any = { params: { user_id: "" } };
      const reply = createReply();

      await deleteUser(req, reply);

      expect(reply.statusCode).toBe(400);
      expect(reply.payload.message).toBe("user_id is required");
    });

    it("returns 200 when delete succeeds", async () => {
      const where = jest.fn().mockResolvedValue(undefined);
      (db.delete as jest.Mock).mockReturnValue({ where });

      const req: any = { params: { user_id: "1" } };
      const reply = createReply();

      await deleteUser(req, reply);

      expect(reply.statusCode).toBe(200);
      expect(reply.payload.message).toBe("User with ID 1 deleted");
    });

    it("returns 500 on database error", async () => {
      const where = jest.fn().mockRejectedValue(new Error("db failed"));
      (db.delete as jest.Mock).mockReturnValue({ where });

      const req: any = { params: { user_id: "1" } };
      const reply = createReply();

      await deleteUser(req, reply);

      expect(reply.statusCode).toBe(500);
      expect(reply.payload.message).toBe("Server error");
    });
  });
});
