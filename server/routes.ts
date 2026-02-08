import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Login (Mock)
  app.post(api.auth.login.path, (req, res) => {
    const { username } = req.body;
    // Simple mock auth - just accept any name
    if (username) {
      res.json({ success: true, username });
    } else {
      res.status(400).json({ message: "Username is required" });
    }
  });

  // Dashboard Stats
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Customers
  app.get(api.customers.list.path, async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.post(api.customers.create.path, async (req, res) => {
    try {
      const input = api.customers.create.input.parse(req.body);
      const customer = await storage.createCustomer(input);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.customers.get.path, async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  // Borrowings
  app.get(api.borrowings.list.path, async (req, res) => {
    const borrowings = await storage.getBorrowings();
    res.json(borrowings);
  });

  app.post(api.borrowings.create.path, async (req, res) => {
    try {
      const input = api.borrowings.create.input.parse(req.body);
      const borrowing = await storage.createBorrowing(input);
      res.status(201).json(borrowing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.borrowings.update.path, async (req, res) => {
    const { status } = req.body;
    try {
      const borrowing = await storage.updateBorrowingStatus(Number(req.params.id), status);
      res.json(borrowing);
    } catch (error) {
      res.status(404).json({ message: "Borrowing not found" });
    }
  });

  // Sales
  app.get(api.sales.list.path, async (req, res) => {
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.post(api.sales.create.path, async (req, res) => {
    try {
      const input = api.sales.create.input.parse(req.body);
      const sale = await storage.createSale(input);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
