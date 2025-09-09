import { Asset, STORAGE_KEY, nextWxId } from "./systemAssets";

export function createDemoSystemAssets(): Asset[] {
  const today = new Date().toISOString();
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const warranty = oneYearLater.toISOString();

  const demoAssets: Asset[] = [
    // Demo Set 1 - High-end gaming setup
    {
      id: "WX-M-001",
      category: "mouse",
      serialNumber: "LOG-MX3-789012",
      vendorName: "Logitech",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-15",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-K-001",
      category: "keyboard",
      serialNumber: "COR-K70-456789",
      vendorName: "Corsair",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-15",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-MB-001",
      category: "motherboard",
      serialNumber: "ASU-B550M-123456",
      vendorName: "ASUS",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-10",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-R-001",
      category: "ram",
      serialNumber: "COR-32GB-789012",
      vendorName: "Corsair",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-10",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-PS-001",
      category: "power-supply",
      serialNumber: "EVG-750W-345678",
      vendorName: "EVGA",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-10",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-H-001",
      category: "headphone",
      serialNumber: "SON-WH1000-567890",
      vendorName: "Sony",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-20",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-C-001",
      category: "camera",
      serialNumber: "LOG-C920-234567",
      vendorName: "Logitech",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-20",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-MN-001",
      category: "monitor",
      serialNumber: "DEL-U2720Q-890123",
      vendorName: "Dell",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-15",
      warrantyEndDate: warranty,
      createdAt: today,
    },

    // Demo Set 2 - Office setup
    {
      id: "WX-M-002",
      category: "mouse",
      serialNumber: "HP-WL-mouse-112233",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-01",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-K-002",
      category: "keyboard",
      serialNumber: "HP-KB-wired-445566",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-01",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-MB-002",
      category: "motherboard",
      serialNumber: "HP-OFFICE-MB-778899",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-01",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-R-002",
      category: "ram",
      serialNumber: "HP-16GB-DDR4-998877",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-01",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-PS-002",
      category: "power-supply",
      serialNumber: "HP-500W-654321",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-01",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-H-002",
      category: "headphone",
      serialNumber: "HP-STEREO-112244",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-05",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-C-002",
      category: "camera",
      serialNumber: "HP-WEB-CAM-556677",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-05",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-MN-002",
      category: "monitor",
      serialNumber: "HP-24inch-334455",
      vendorName: "HP",
      companyName: "Business Corp",
      purchaseDate: "2024-02-01",
      warrantyEndDate: warranty,
      createdAt: today,
    },
    {
      id: "WX-V-001",
      category: "vonage",
      serialNumber: "VON-PHONE-998877",
      vendorName: "Vonage",
      companyName: "Business Corp",
      purchaseDate: "2024-02-10",
      warrantyEndDate: warranty,
      createdAt: today,
      vonageNumber: "+1-555-123-4567",
      vonageExtCode: "101",
      vonagePassword: "demo123!",
    },

    // Storage (SSD/HDD) demo assets
    {
      id: "WX-ST-001",
      category: "storage",
      serialNumber: "SSD-SAM-001",
      vendorName: "Samsung",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-01-12",
      warrantyEndDate: warranty,
      createdAt: today,
      storageType: "SSD",
      storageCapacity: "512GB",
    },
    {
      id: "WX-ST-002",
      category: "storage",
      serialNumber: "HDD-WD-002",
      vendorName: "Western Digital",
      companyName: "Business Corp",
      purchaseDate: "2024-02-03",
      warrantyEndDate: warranty,
      createdAt: today,
      storageType: "HDD",
      storageCapacity: "1TB",
    },

    // Vitel Global demo assets
    {
      id: "WX-VG-001",
      category: "vitel-global",
      serialNumber: "VIT-TRK-1001",
      vendorName: "Vitel Global",
      companyName: "Tech Solutions Inc",
      purchaseDate: "2024-03-01",
      warrantyEndDate: warranty,
      createdAt: today,
      vitelNumber: "+44-20-1234-5678",
      vitelExtCode: "200",
      vitelPassword: "vitelDemo1",
    },
    {
      id: "WX-VG-002",
      category: "vitel-global",
      serialNumber: "VIT-TRK-1002",
      vendorName: "Vitel Global",
      companyName: "Business Corp",
      purchaseDate: "2024-03-05",
      warrantyEndDate: warranty,
      createdAt: today,
      vitelNumber: "+44-20-8765-4321",
      vitelExtCode: "201",
      vitelPassword: "vitelDemo2",
    },
  ];

  return demoAssets;
}

export function loadDemoData() {
  const existing = localStorage.getItem(STORAGE_KEY);
  const currentAssets: Asset[] = existing ? JSON.parse(existing) : [];

  const demoAssets = createDemoSystemAssets();

  // Determine which demo assets are missing by id
  const existingIds = new Set(currentAssets.map((a) => a.id));
  const missing = demoAssets.filter((a) => !existingIds.has(a.id));

  if (missing.length === 0) {
    console.log("Demo data already exists");
    return [];
  }

  const allAssets = [...currentAssets, ...missing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allAssets));
  try {
    fetch("/api/hr/assets/upsert-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "admin" },
      body: JSON.stringify({ items: missing }),
    }).catch(() => {});
  } catch {}
  console.log("Demo system assets loaded (missing added):", missing.length);
  return missing;
}

// --- Demo employees ---
export type DemoEmployee = {
  id: string;
  employeeId: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  birthDate?: string;
  bloodGroup?: string;
  mobileNumber?: string;
  emergencyMobileNumber?: string;
  alternativeMobileNumber?: string;
  email?: string;
  address?: string;
  permanentAddress?: string;
  photo?: string;
  joiningDate?: string;
  department?: string;
  position?: string;
  tableNumber?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankPassbook?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  uanNumber?: string;
  salary?: string;
  aadhaarCard?: string;
  panCard?: string;
  passport?: string;
  drivingLicense?: string;
  resume?: string;
  medicalCertificate?: string;
  educationCertificate?: string;
  experienceLetter?: string;
  status?: string;
};

export function createDemoEmployees(): DemoEmployee[] {
  const img =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAAsTAAALEwEAmpwYAAABKklEQVR4nO3WsQnEIAwF0L7n/6a7lq9gQw5y2U8zJk6h0kQ3mQGx1g9ZgQAAAAAAAAAwGv6f3k1S0l3m1eF7c3QZ3g5rj7m7n+u3wQ8n2FvY8l8n2FvY8l8n2FvY8l8n2FvY8l8n2FvY8l8n2FvY8l8n2FvY8l8n2FvY8l8n2FvY8l8n2FvY8l8n2FfY4r9/sdV2y8AAGAwYwz3Xl8oQAAAABJRU5ErkJggg==";
  const now = Date.now();
  const names = [
    "Rahul Sharma",
    "Priya Verma",
    "Amit Kumar",
    "Sneha Patel",
    "Vikas Gupta",
  ];

  const depts = ["Engineering", "HR", "Sales", "Support", "Finance"];

  const employees: DemoEmployee[] = names.map((name, i) => ({
    id: `${now}-${i}`,
    employeeId: `EMP${(now + i).toString().slice(-4)}`,
    fullName: name,
    fatherName: `Father ${name.split(" ")[0]}`,
    motherName: `Mother ${name.split(" ")[0]}`,
    birthDate: `199${i}-01-0${i + 1}`,
    bloodGroup: i % 2 === 0 ? "O+" : "B+",
    mobileNumber: `+91 90000000${10 + i}`,
    emergencyMobileNumber: `+91 90000000${20 + i}`,
    alternativeMobileNumber: `+91 90000000${30 + i}`,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    address: `${i + 1}, Demo Street, City`,
    permanentAddress: `Permanent Address ${i + 1}`,
    photo: img,
    joiningDate: `2023-0${(i % 9) + 1}-01`,
    department: depts[i % depts.length],
    position: i % 2 === 0 ? "Software Engineer" : "Executive",
    tableNumber: `${i + 1}`,
    accountNumber: `00011122${i}`,
    ifscCode: `IFSC000${i}`,
    bankPassbook: img,
    aadhaarNumber: `1000 2000 30${i}`,
    panNumber: `PAN00${i}XYZ`,
    uanNumber: `UAN00${i}`,
    salary: `${40000 + i * 5000}`,
    aadhaarCard: img,
    panCard: img,
    passport: img,
    drivingLicense: img,
    resume: img,
    medicalCertificate: img,
    educationCertificate: img,
    experienceLetter: img,
    status: "active",
  }));

  return employees;
}

export function loadDemoEmployees() {
  const existing = localStorage.getItem("hrEmployees");
  const current = existing ? JSON.parse(existing) : [];
  if (Array.isArray(current) && current.length >= 5) {
    console.log("Demo employees already present");
    return [];
  }
  const demo = createDemoEmployees();
  const merged = [...demo, ...current];
  localStorage.setItem("hrEmployees", JSON.stringify(merged));
  // also ensure departments exist
  const deptsRaw = localStorage.getItem("departments");
  const depts = deptsRaw ? JSON.parse(deptsRaw) : [];
  const needed = Array.from(new Set(demo.map((d) => d.department))).map(
    (name, idx) => ({ id: `D-${name}`, name }),
  );
  // Merge and dedupe departments by normalized name
  const mergedMap = new Map<string, any>();
  [...needed, ...depts].forEach((d: any) => {
    const name = String(d?.name || "").trim();
    const key = name.toLowerCase();
    if (!mergedMap.has(key))
      mergedMap.set(key, { id: d?.id || `D-${name}`, name });
  });
  const mergedDepts = Array.from(mergedMap.values());
  localStorage.setItem("departments", JSON.stringify(mergedDepts));

  // add demo PC/Laptop assets if not present
  try {
    const pcRaw = localStorage.getItem("pcLaptopAssets");
    const pcCurr = pcRaw ? JSON.parse(pcRaw) : [];
    if (!Array.isArray(pcCurr) || pcCurr.length < 5) {
      const pcs = Array.from({ length: 6 }, (_, i) => ({
        id: `PC-${Date.now().toString().slice(-4)}-${i + 1}`,
        model: `Demo PC ${i + 1}`,
        serialNumber: `SN-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem("pcLaptopAssets", JSON.stringify(pcs));
      try {
        fetch("/api/hr/pc-laptops/upsert-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-role": "admin" },
          body: JSON.stringify({ items: pcs }),
        }).catch(() => {});
      } catch {}
    }
  } catch {}

  // attempt to sync to server for employees
  try {
    for (const e of demo) {
      fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "admin" },
        body: JSON.stringify(e),
      }).catch(() => {});
    }
  } catch {}

  console.log("Demo employees loaded:", demo.length);
  return demo;
}
