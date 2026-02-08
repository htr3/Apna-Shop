import { 
  customers, borrowings, sales,
  type Customer, type InsertCustomer,
  type Borrowing, type InsertBorrowing,
  type Sale, type InsertSale,
  type DashboardStats
} from "@shared/schema";

export interface IStorage {
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer>;

  // Borrowings
  getBorrowings(): Promise<(Borrowing & { customerName: string })[]>;
  createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing>;
  updateBorrowingStatus(id: number, status: "PAID" | "PENDING" | "OVERDUE"): Promise<Borrowing>;

  // Sales
  getSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer>;
  private borrowings: Map<number, Borrowing>;
  private sales: Map<number, Sale>;
  private currentId: { customers: number; borrowings: number; sales: number };

  constructor() {
    this.customers = new Map();
    this.borrowings = new Map();
    this.sales = new Map();
    this.currentId = { customers: 1, borrowings: 1, sales: 1 };
    
    this.seedData();
  }

  private seedData() {
    // Seed Customers
    const initialCustomers: InsertCustomer[] = [
      { name: "Rahul Sharma", phone: "9876543210", trustScore: 85, totalPurchase: "15000", borrowedAmount: "2000", isRisky: false },
      { name: "Anita Desai", phone: "9876543211", trustScore: 45, totalPurchase: "5000", borrowedAmount: "4500", isRisky: true },
      { name: "Vikram Singh", phone: "9876543212", trustScore: 95, totalPurchase: "25000", borrowedAmount: "0", isRisky: false },
      { name: "Priya Patel", phone: "9876543213", trustScore: 30, totalPurchase: "2000", borrowedAmount: "1500", isRisky: true },
      { name: "Amit Kumar", phone: "9876543214", trustScore: 75, totalPurchase: "12000", borrowedAmount: "500", isRisky: false },
    ];

    initialCustomers.forEach(c => this.createCustomer(c));

    // Seed Sales (Last 30 days)
    const today = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - Math.floor(Math.random() * 30));
      this.createSale({
        amount: (Math.floor(Math.random() * 500) + 100).toString(),
        date: date,
        paymentMethod: Math.random() > 0.3 ? "CASH" : "ONLINE",
        customerId: Math.floor(Math.random() * 5) + 1
      });
    }

    // Seed Borrowings
    this.createBorrowing({
      customerId: 1,
      amount: "2000",
      date: new Date(today.getTime() - 86400000 * 5), // 5 days ago
      dueDate: new Date(today.getTime() + 86400000 * 10), // in 10 days
      status: "PENDING",
      notes: "Monthly ration"
    });

    this.createBorrowing({
      customerId: 2,
      amount: "4500",
      date: new Date(today.getTime() - 86400000 * 20),
      dueDate: new Date(today.getTime() - 86400000 * 5), // Overdue by 5 days
      status: "OVERDUE",
      notes: "Promised next week"
    });
    
    this.createBorrowing({
      customerId: 4,
      amount: "1500",
      date: new Date(today.getTime() - 86400000 * 2),
      dueDate: new Date(today.getTime() + 86400000 * 15),
      status: "PENDING",
      notes: ""
    });
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentId.customers++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer> {
    const existing = this.customers.get(id);
    if (!existing) throw new Error("Customer not found");
    const updated = { ...existing, ...updates };
    this.customers.set(id, updated);
    return updated;
  }

  async getBorrowings(): Promise<(Borrowing & { customerName: string })[]> {
    return Array.from(this.borrowings.values()).map(b => {
      const customer = this.customers.get(b.customerId);
      return { ...b, customerName: customer ? customer.name : "Unknown" };
    });
  }

  async createBorrowing(insertBorrowing: InsertBorrowing): Promise<Borrowing> {
    const id = this.currentId.borrowings++;
    const borrowing: Borrowing = { ...insertBorrowing, id };
    this.borrowings.set(id, borrowing);
    return borrowing;
  }

  async updateBorrowingStatus(id: number, status: "PAID" | "PENDING" | "OVERDUE"): Promise<Borrowing> {
    const existing = this.borrowings.get(id);
    if (!existing) throw new Error("Borrowing not found");
    const updated = { ...existing, status };
    this.borrowings.set(id, updated);
    return updated;
  }

  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values()).sort((a, b) => 
      (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
    );
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentId.sales++;
    const sale: Sale = { ...insertSale, id };
    this.sales.set(id, sale);
    return sale;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const salesList = Array.from(this.sales.values());
    const borrowingsList = Array.from(this.borrowings.values());
    const customersList = Array.from(this.customers.values());

    const todaySales = salesList
      .filter(s => s.date && s.date >= startOfDay)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const monthSales = salesList
      .filter(s => s.date && s.date >= startOfMonth)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const pendingUdhaar = borrowingsList
      .filter(b => b.status === "PENDING" || b.status === "OVERDUE")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const trustableCount = customersList.filter(c => (c.trustScore || 0) >= 70).length;
    const riskyCount = customersList.filter(c => (c.trustScore || 0) < 40).length;

    return {
      todaySales,
      monthSales,
      pendingUdhaar,
      trustableCount,
      riskyCount
    };
  }
}

export const storage = new MemStorage();
