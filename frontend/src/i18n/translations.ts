// Language translations
export const translations = {
  en: {
    // Navigation
    nav: {
      dashboard: "Dashboard",
      sales: "Sales",
      customers: "Customers",
      borrowings: "Borrowings",
      expenses: "Expenses",
      inventory: "Inventory",
      suppliers: "Suppliers",
      users: "Users",
      settings: "Settings",
      logout: "Logout",
    },
    // Dashboard
    dashboard: {
      title: "Dashboard",
      todaySales: "Today's Sales",
      monthSales: "Monthly Sales",
      pendingUdhaar: "Pending Credit",
      trustableCount: "Trustworthy Customers",
      riskyCount: "Risky Customers",
      insights: "Business Insights",
      noInsights: "No insights available",
    },
    // Sales
    sales: {
      title: "Sales",
      addSale: "Add Sale",
      amount: "Amount",
      paymentMethod: "Payment Method",
      customer: "Customer",
      date: "Date",
      cash: "Cash",
      online: "Online",
      credit: "Credit",
      noSales: "No sales recorded",
    },
    // Customers
    customers: {
      title: "Customers",
      addCustomer: "Add Customer",
      name: "Name",
      phone: "Phone",
      trustScore: "Trust Score",
      totalPurchase: "Total Purchase",
      borrowedAmount: "Borrowed Amount",
      noCustomers: "No customers found",
    },
    // Borrowings
    borrowings: {
      title: "Borrowings (Udhaar)",
      addBorrowing: "Add Borrowing",
      amount: "Amount",
      dueDate: "Due Date",
      status: "Status",
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
      noBorrowings: "No borrowings recorded",
    },
    // Expenses
    expenses: {
      title: "Expenses",
      addExpense: "Add Expense",
      category: "Category",
      amount: "Amount",
      rent: "Rent",
      electricity: "Electricity",
      supplier: "Supplier Payment",
      salary: "Salaries",
      maintenance: "Maintenance",
      totalExpenses: "Total Expenses",
      netProfit: "Net Profit",
    },
    // Inventory
    inventory: {
      title: "Inventory",
      addItem: "Add Item",
      name: "Name",
      quantity: "Quantity",
      minThreshold: "Min Threshold",
      avgDaily: "Avg Daily Sales",
      predictions: "Restock Predictions",
      critical: "Critical Stock",
    },
    // Suppliers
    suppliers: {
      title: "Suppliers",
      addSupplier: "Add Supplier",
      name: "Name",
      phone: "Phone",
      totalOwed: "Total Owed",
      pendingPayments: "Pending Payments",
    },
    // Login
    login: {
      title: "ShopKeeper",
      subtitle: "Manage your sales, customers, and udhaar in one place.",
      username: "Shop Owner Name",
      usernamePlaceholder: "e.g. Rahul Sharma",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      rememberMe: "Remember Me",
      loginButton: "Start Dashboard",
      loggingIn: "Logging in...",
      loginFailed: "Login failed. Please check your credentials.",
      usernameRequired: "Username is required",
      passwordRequired: "Password is required",
      invalidCredentials: "Invalid username or password",
      networkError: "Network error. Please try again.",
    },
    // Common
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      close: "Close",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
      back: "Back",
    },
  },

  hi: {
    // Navigation
    nav: {
      dashboard: "डैशबोर्ड",
      sales: "बिक्रय",
      customers: "ग्राहक",
      borrowings: "उधार",
      expenses: "खर्च",
      inventory: "इन्वेंटरी",
      suppliers: "आपूर्तिकर्ता",
      users: "उपयोगकर्ता",
      settings: "सेटिंग्स",
      logout: "लॉग आउट",
    },
    // Dashboard
    dashboard: {
      title: "डैशबोर्ड",
      todaySales: "आज की बिक्रय",
      monthSales: "मासिक बिक्रय",
      pendingUdhaar: "लंबित उधार",
      trustableCount: "विश्वसनीय ग्राहक",
      riskyCount: "जोखिम भरे ग्राहक",
      insights: "व्यापार अंतर्दृष्टि",
      noInsights: "कोई अंतर्दृष्टि उपलब्ध नहीं",
    },
    // Sales
    sales: {
      title: "बिक्रय",
      addSale: "बिक्रय जोड़ें",
      amount: "राशि",
      paymentMethod: "भुगतान विधि",
      customer: "ग्राहक",
      date: "तारीख",
      cash: "नकद",
      online: "ऑनलाइन",
      credit: "क्रेडिट",
      noSales: "कोई बिक्रय दर्ज नहीं की गई",
    },
    // Customers
    customers: {
      title: "ग्राहक",
      addCustomer: "ग्राहक जोड़ें",
      name: "नाम",
      phone: "फोन",
      trustScore: "विश्वास स्कोर",
      totalPurchase: "कुल खरीद",
      borrowedAmount: "उधार दी गई राशि",
      noCustomers: "कोई ग्राहक नहीं मिले",
    },
    // Borrowings
    borrowings: {
      title: "उधार",
      addBorrowing: "उधार जोड़ें",
      amount: "राशि",
      dueDate: "देय तारीख",
      status: "स्थिति",
      paid: "भुगतान किया",
      pending: "लंबित",
      overdue: "विलंबित",
      noBorrowings: "कोई उधार दर्ज नहीं की गई",
    },
    // Expenses
    expenses: {
      title: "खर्च",
      addExpense: "खर्च जोड़ें",
      category: "श्रेणी",
      amount: "राशि",
      rent: "किराया",
      electricity: "बिजली",
      supplier: "आपूर्तिकर्ता भुगतान",
      salary: "वेतन",
      maintenance: "रखरखाव",
      totalExpenses: "कुल खर्च",
      netProfit: "शुद्ध लाभ",
    },
    // Inventory
    inventory: {
      title: "इन्वेंटरी",
      addItem: "आइटम जोड़ें",
      name: "नाम",
      quantity: "मात्रा",
      minThreshold: "न्यूनतम सीमा",
      avgDaily: "औसत दैनिक बिक्रय",
      predictions: "पुनः स्टॉक भविष्यवाणियां",
      critical: "महत्वपूर्ण स्टॉक",
    },
    // Suppliers
    suppliers: {
      title: "आपूर्तिकर्ता",
      addSupplier: "आपूर्तिकर्ता जोड़ें",
      name: "नाम",
      phone: "फोन",
      totalOwed: "कुल बकाया",
      pendingPayments: "लंबित भुगतान",
    },
    // Common
    common: {
      save: "सहेजें",
      cancel: "रद्द करें",
      delete: "हटाएं",
      edit: "संपादित करें",
      add: "जोड़ें",
      close: "बंद करें",
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफल",
      confirm: "पुष्टि करें",
      back: "वापस",
    },
  },

  mr: {
    // Navigation
    nav: {
      dashboard: "डॅशबोर्ड",
      sales: "विक्रय",
      customers: "ग्राहक",
      borrowings: "कर्ज",
      expenses: "खर्च",
      inventory: "इन्व्हेंटरी",
      suppliers: "पूरवठादार",
      users: "वापरकर्ते",
      settings: "सेटिंग्ज",
      logout: "लॉग आउट",
    },
    // Dashboard
    dashboard: {
      title: "डॅशबोर्ड",
      todaySales: "आजचा विक्रय",
      monthSales: "मासिक विक्रय",
      pendingUdhaar: "प्रलंबित कर्ज",
      trustableCount: "विश्वसनीय ग्राहक",
      riskyCount: "जोखीम भरे ग्राहक",
      insights: "व्यावसायिक अंतर्दृष्टी",
      noInsights: "कोणतीही अंतर्दृष्टी उपलब्ध नाही",
    },
    // Sales
    sales: {
      title: "विक्रय",
      addSale: "विक्रय जोडा",
      amount: "रक्कम",
      paymentMethod: "पेमेंट पद्धत",
      customer: "ग्राहक",
      date: "तारीख",
      cash: "रोख",
      online: "ऑनलाइन",
      credit: "क्रेडिट",
      noSales: "कोणताही विक्रय नोंदणी केली गेली नाही",
    },
    // Customers
    customers: {
      title: "ग्राहक",
      addCustomer: "ग्राहक जोडा",
      name: "नाव",
      phone: "फोन",
      trustScore: "विश्वास गुण",
      totalPurchase: "एकूण खरेदी",
      borrowedAmount: "कर्ज दिलेली रक्कम",
      noCustomers: "कोणताही ग्राहक सापडला नाही",
    },
    // Borrowings
    borrowings: {
      title: "कर्ज",
      addBorrowing: "कर्ज जोडा",
      amount: "रक्कम",
      dueDate: "देय तारीख",
      status: "स्थिती",
      paid: "दिले",
      pending: "प्रलंबित",
      overdue: "विलंबित",
      noBorrowings: "कोणताही कर्ज नोंदणी केली गेली नाही",
    },
    // Expenses
    expenses: {
      title: "खर्च",
      addExpense: "खर्च जोडा",
      category: "वर्ग",
      amount: "रक्कम",
      rent: "भाडे",
      electricity: "वीज",
      supplier: "पूरवठादार भुगतान",
      salary: "वेतन",
      maintenance: "देखभाल",
      totalExpenses: "एकूण खर्च",
      netProfit: "निव्वळ नफा",
    },
    // Inventory
    inventory: {
      title: "इन्व्हेंटरी",
      addItem: "वस्तु जोडा",
      name: "नाव",
      quantity: "प्रमाण",
      minThreshold: "किमान सीमा",
      avgDaily: "सरासरी दैनिक विक्रय",
      predictions: "पुन्हा स्टॉक भविष्यवाणी",
      critical: "गंभीर स्टॉक",
    },
    // Suppliers
    suppliers: {
      title: "पूरवठादार",
      addSupplier: "पूरवठादार जोडा",
      name: "नाव",
      phone: "फोन",
      totalOwed: "एकूण देय",
      pendingPayments: "प्रलंबित भुगतान",
    },
    // Common
    common: {
      save: "जतन करा",
      cancel: "रद्द करा",
      delete: "हटवा",
      edit: "संपादित करा",
      add: "जोडा",
      close: "बंद करा",
      loading: "लोड होत आहे...",
      error: "त्रुटी",
      success: "यशस्वी",
      confirm: "पुष्टी करा",
      back: "परत",
    },
  },

  gu: {
    // Navigation
    nav: {
      dashboard: "ડેશબોર્ડ",
      sales: "વેચાણ",
      customers: "ગ્રાહકો",
      borrowings: "ધાર",
      expenses: "ખર્ચ",
      inventory: "ઇનવેન્ટરી",
      suppliers: "પૂરવઠાકાર",
      users: "વપરાશકર્તાઓ",
      settings: "સેટિંગ્સ",
      logout: "લૉગ આઉટ",
    },
    // Dashboard
    dashboard: {
      title: "ડેશબોર્ડ",
      todaySales: "આજનું વેચાણ",
      monthSales: "માસિક વેચાણ",
      pendingUdhaar: "બાકી ધાર",
      trustableCount: "વિશ્વસનીય ગ્રાહકો",
      riskyCount: "જોખમી ગ્રાહકો",
      insights: "વ્યવસાય આંતરદૃષ્ટિ",
      noInsights: "કોઈ અંતરદૃષ્ટિ ઉપલબ્ધ નથી",
    },
    // Sales
    sales: {
      title: "વેચાણ",
      addSale: "વેચાણ ઉમેરો",
      amount: "રકમ",
      paymentMethod: "ચૂકવણી પદ્ધતિ",
      customer: "ગ્રાહક",
      date: "તારીખ",
      cash: "રોકડ",
      online: "ઓનલાઈન",
      credit: "ક્રેડિટ",
      noSales: "કોઈ વેચાણ નોંધાયું નથી",
    },
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = string;

export function getTranslation(
  lang: Language,
  key: TranslationKey
): string {
  const keys = key.split(".");
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}
