"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Currency = "USD" | "ARS" | "COP";

type Client = {
  id: string;
  name: string;
  contactEmail: string;
  currency: Currency;
  notes?: string;
};

type Allocation = {
  id: string;
  name: string;
  role: "milo" | "sergio" | "collaborator";
  percentage?: number;
  fixedAmount?: number;
};

type ProjectStatus = "planning" | "wip" | "done";

type Project = {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  currency: Currency;
  allocations: Allocation[];
};

type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "void";

type InvoiceBranding = {
  accentColor: string;
  headerText?: string;
  footerText?: string;
  logoDataUrl?: string;
};

type InvoiceLineItem = {
  id: string;
  description: string;
  amount: number;
};

type Invoice = {
  id: string;
  projectId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxes: number;
  total: number;
  currency: Currency;
  status: InvoiceStatus;
  notes?: string;
  attachments?: string[];
  lineItems: InvoiceLineItem[];
  branding: InvoiceBranding;
  verificationUrl: string;
};

type Payment = {
  id: string;
  invoiceId: string;
  projectId: string;
  date: string;
  amount: number;
  currency: Currency;
  method: string;
  exchangeRate: number;
  createdBy: string;
  appliedTo: string;
  pettyContribution: number;
  splits: { allocationId: string; name: string; amount: number }[];
};

type Expense = {
  id: string;
  projectId?: string;
  userId: string;
  description: string;
  category: string;
  amount: number;
  currency: Currency;
  receiptUrl?: string;
  approved: boolean;
  date: string;
};

type Adjustment = {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: Currency;
  category: string;
  note: string;
  date: string;
};

type PettyCashRule = {
  ruleType: "percent" | "fixed";
  value: number;
  balance: number;
};

type ExchangeRate = {
  id: string;
  date: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
};

type MonteDataState = {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  adjustments: Adjustment[];
  pettyCash: PettyCashRule;
  balances: Record<string, number>;
  exchangeRates: ExchangeRate[];
  nextInvoiceSequence: number;
  integrations: IntegrationSettings;
  appTemplate: AppTemplateSettings;
};

type AppTemplateSettings = {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoDataUrl?: string;
  customHtml?: string;
};

type IntegrationSettings = {
  googleOAuth: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    lastSynced?: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    lastNotification?: string;
  };
  drive: {
    enabled: boolean;
    folderId: string;
    serviceAccount: string;
    lastExport?: string;
  };
  email: {
    enabled: boolean;
    provider: "resend" | "smtp";
    fromEmail: string;
    apiKey?: string;
    smtpHost?: string;
    smtpPort?: number;
  };
};

type CsvRow = Record<string, string> & { type: string };

type DataContextValue = MonteDataState & {
  addClient: (input: Omit<Client, "id">) => void;
  updateClient: (id: string, input: Partial<Omit<Client, "id">>) => void;
  deleteClient: (id: string) => void;
  addProject: (input: Omit<Project, "id">) => void;
  updateProject: (id: string, input: Partial<Omit<Project, "id" | "allocations">> & { allocations?: Allocation[] }) => void;
  deleteProject: (id: string) => void;
  createInvoice: (
    input: Omit<Invoice, "id" | "number" | "status" | "verificationUrl"> & {
      status?: InvoiceStatus;
      verificationUrl?: string;
    },
  ) => Invoice;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  recordPayment: (input: Omit<Payment, "id" | "pettyContribution" | "splits" | "exchangeRate"> & { exchangeRate?: number }) => Payment;
  addExpense: (input: Omit<Expense, "id">) => void;
  toggleExpenseApproval: (id: string) => void;
  addAdjustment: (input: Omit<Adjustment, "id">) => void;
  updatePettyCashRule: (rule: Pick<PettyCashRule, "ruleType" | "value">) => void;
  addExchangeRate: (input: Omit<ExchangeRate, "id">) => void;
  importFromCsv: (rows: CsvRow[]) => { summary: string; imported: number };
  updateIntegrations: (key: keyof IntegrationSettings, input: Partial<IntegrationSettings[typeof key]>) => void;
  updateAppTemplate: (input: Partial<AppTemplateSettings>) => void;
  resetAppTemplate: () => void;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

const STORAGE_KEY = "monte-data-state";

const today = new Date();
const iso = (date: Date) => date.toISOString().slice(0, 10);

const defaultState: MonteDataState = {
  clients: [
    {
      id: "client-winston",
      name: "Winston Media",
      contactEmail: "finance@winston.co",
      currency: "USD",
      notes: "Cliente principal de animación publicitaria",
    },
    {
      id: "client-latam",
      name: "Latam Studios",
      contactEmail: "contabilidad@latamstudios.com",
      currency: "ARS",
      notes: "Facturación mensual con impuestos locales",
    },
    {
      id: "client-indigo",
      name: "Indigo Post",
      contactEmail: "ap@indigopost.tv",
      currency: "USD",
      notes: "Servicios de finishing remoto",
    },
  ],
  projects: [
    {
      id: "project-gig-1",
      clientId: "client-winston",
      name: "Campaña Winston 2024",
      description: "Spots animados para campaña global",
      status: "wip",
      startDate: iso(today),
      endDate: "",
      budget: 45000,
      currency: "USD",
      allocations: [
        {
          id: "alloc-milo",
          name: "Milo",
          role: "milo",
          percentage: 40,
        },
        {
          id: "alloc-sergio",
          name: "Sergio",
          role: "sergio",
          percentage: 35,
        },
        {
          id: "alloc-camila",
          name: "Camila",
          role: "collaborator",
          percentage: 25,
        },
      ],
    },
    {
      id: "project-gig-2",
      clientId: "client-latam",
      name: "Spot streaming regional",
      description: "Localización LATAM",
      status: "planning",
      startDate: iso(today),
      endDate: "",
      budget: 12000000,
      currency: "ARS",
      allocations: [
        {
          id: "alloc-milo-2",
          name: "Milo",
          role: "milo",
          percentage: 45,
        },
        {
          id: "alloc-sergio-2",
          name: "Sergio",
          role: "sergio",
          percentage: 30,
        },
        {
          id: "alloc-julian",
          name: "Julián",
          role: "collaborator",
          percentage: 25,
        },
      ],
    },
    {
      id: "project-gig-3",
      clientId: "client-indigo",
      name: "Series Indigo Post",
      description: "Finalización de episodios",
      status: "done",
      startDate: iso(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() - 3)),
      endDate: iso(today),
      budget: 22000,
      currency: "USD",
      allocations: [
        {
          id: "alloc-milo-3",
          name: "Milo",
          role: "milo",
          percentage: 35,
        },
        {
          id: "alloc-camila-3",
          name: "Camila",
          role: "collaborator",
          percentage: 30,
        },
        {
          id: "alloc-julian-3",
          name: "Julián",
          role: "collaborator",
          percentage: 35,
        },
      ],
    },
  ],
  invoices: [
    {
      id: "invoice-1",
      projectId: "project-gig-1",
      number: "MONTE-0001",
      issueDate: iso(today),
      dueDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25)),
      subtotal: 15000,
      taxes: 3150,
      total: 18150,
      currency: "USD",
      status: "partial",
      notes: "Primer milestone entregado",
      lineItems: [
        { id: "li-1", description: "Storyboard y arte", amount: 9000 },
        { id: "li-2", description: "Animación 2D", amount: 6000 },
      ],
      branding: {
        accentColor: "#10b981",
        headerText: "Monte Animation — Factura oficial",
        footerText: "Gracias por elegirnos. Pagos vía transferencia internacional.",
      },
      verificationUrl: "https://billing.monteanimation.com/verify/invoice-1",
    },
    {
      id: "invoice-2",
      projectId: "project-gig-2",
      number: "MONTE-0002",
      issueDate: iso(new Date(today.getFullYear(), today.getMonth(), 1)),
      dueDate: iso(new Date(today.getFullYear(), today.getMonth(), 30)),
      subtotal: 7500000,
      taxes: 1575000,
      total: 9075000,
      currency: "ARS",
      status: "draft",
      notes: "Pendiente de aprobación impositiva",
      lineItems: [
        { id: "li-3", description: "Producción local", amount: 5200000 },
        { id: "li-4", description: "Localización de audio", amount: 2300000 },
      ],
      branding: {
        accentColor: "#6366f1",
        headerText: "Factura provisional",
        footerText: "Se emitirá versión final con retenciones aplicadas.",
      },
      verificationUrl: "https://billing.monteanimation.com/verify/invoice-2",
    },
    {
      id: "invoice-3",
      projectId: "project-gig-3",
      number: "MONTE-0003",
      issueDate: iso(new Date(today.getFullYear(), today.getMonth() - 1, 15)),
      dueDate: iso(new Date(today.getFullYear(), today.getMonth() - 1, 30)),
      subtotal: 7800,
      taxes: 702,
      total: 8502,
      currency: "USD",
      status: "paid",
      notes: "Proyecto finalizado",
      lineItems: [
        { id: "li-5", description: "Composición y finishing", amount: 4800 },
        { id: "li-6", description: "Corrección de color", amount: 3000 },
      ],
      branding: {
        accentColor: "#0ea5e9",
        headerText: "Factura final",
        footerText: "Incluye acceso a archivos maestros en Drive.",
      },
      verificationUrl: "https://billing.monteanimation.com/verify/invoice-3",
    },
  ],
  payments: [
    {
      id: "payment-1",
      invoiceId: "invoice-1",
      projectId: "project-gig-1",
      date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)),
      amount: 12000,
      currency: "USD",
      method: "Wire transfer",
      exchangeRate: 1,
      createdBy: "owner-milo",
      appliedTo: "Primer hito",
      pettyContribution: 1200,
      splits: [
        { allocationId: "alloc-milo", name: "Milo", amount: 4320 },
        { allocationId: "alloc-sergio", name: "Sergio", amount: 3780 },
        { allocationId: "alloc-camila", name: "Camila", amount: 2700 },
      ],
    },
    {
      id: "payment-2",
      invoiceId: "invoice-3",
      projectId: "project-gig-3",
      date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
      amount: 8502,
      currency: "USD",
      method: "Transferencia",
      exchangeRate: 1,
      createdBy: "owner-milo",
      appliedTo: "Pago final",
      pettyContribution: 850.2,
      splits: [
        { allocationId: "alloc-milo-3", name: "Milo", amount: 2678.13 },
        { allocationId: "alloc-camila-3", name: "Camila", amount: 2295.54 },
        { allocationId: "alloc-julian-3", name: "Julián", amount: 2678.13 },
      ],
    },
  ],
  expenses: [
    {
      id: "expense-1",
      projectId: "project-gig-1",
      userId: "owner-milo",
      description: "Diseño de storyboard",
      category: "Creativo",
      amount: 1200,
      currency: "USD",
      approved: true,
      date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5)),
    },
    {
      id: "expense-2",
      projectId: "project-gig-2",
      userId: "collab-julian",
      description: "Traducción de guiones",
      category: "Servicios",
      amount: 185000,
      currency: "ARS",
      approved: false,
      date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)),
    },
    {
      id: "expense-3",
      projectId: undefined,
      userId: "collab-camila",
      description: "Suscripción Frame.io",
      category: "Software",
      amount: 65,
      currency: "USD",
      approved: true,
      date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
    },
  ],
  adjustments: [
    {
      id: "adj-1",
      from: "Sergio",
      to: "Milo",
      amount: 537,
      currency: "USD",
      category: "Reintegro",
      note: "Reintegro gastos comunes",
      date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
    },
    {
      id: "adj-2",
      from: "Fondo Monte",
      to: "Camila",
      amount: 200,
      currency: "USD",
      category: "Adelanto",
      note: "Adelanto para hardware",
      date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
    },
  ],
  pettyCash: {
    ruleType: "percent",
    value: 10,
    balance: 4550.2,
  },
  balances: {
    Milo: 6998.13,
    Sergio: 4317,
    Camila: 2995.54,
    "Julián": 2678.13,
    "Fondo Monte": 4550.2,
  },
  exchangeRates: [
    {
      id: "rate-ars",
      date: iso(today),
      fromCurrency: "ARS",
      toCurrency: "USD",
      rate: 0.0011,
    },
    {
      id: "rate-cop",
      date: iso(today),
      fromCurrency: "COP",
      toCurrency: "USD",
      rate: 0.00026,
    },
  ],
  nextInvoiceSequence: 4,
  integrations: {
    googleOAuth: {
      enabled: true,
      clientId: "demo-google-client-id.apps.googleusercontent.com",
      clientSecret: "demo-google-secret",
      redirectUri: "https://billing.monteanimation.com/api/auth/callback/google",
      lastSynced: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
    },
    slack: {
      enabled: true,
      webhookUrl: "https://hooks.slack.com/services/demo/demo/demo",
      channel: "#finanzas",
      lastNotification: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
    },
    drive: {
      enabled: true,
      folderId: "1a2b3c4d5e6f",
      serviceAccount: "monte-billing@service-account.iam.gserviceaccount.com",
      lastExport: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)),
    },
    email: {
      enabled: true,
      provider: "resend",
      fromEmail: "finanzas@monteanimation.com",
      apiKey: "re_demo_api_key",
      smtpHost: "",
      smtpPort: undefined,
    },
  },
  appTemplate: {
    primaryColor: "#10b981",
    secondaryColor: "#0f172a",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    logoDataUrl: "",
    customHtml: "",
  },
};

function cloneState(state: MonteDataState): MonteDataState {
  return {
    ...state,
    clients: [...state.clients],
    projects: state.projects.map((project) => ({
      ...project,
      allocations: project.allocations.map((allocation) => ({ ...allocation })),
    })),
    invoices: state.invoices.map((invoice) => ({
      ...invoice,
      lineItems: invoice.lineItems.map((item) => ({ ...item })),
      branding: { ...invoice.branding },
    })),
    payments: state.payments.map((payment) => ({
      ...payment,
      splits: payment.splits.map((split) => ({ ...split })),
    })),
    expenses: state.expenses.map((expense) => ({ ...expense })),
    adjustments: state.adjustments.map((adjustment) => ({ ...adjustment })),
    pettyCash: { ...state.pettyCash },
    balances: { ...state.balances },
    exchangeRates: state.exchangeRates.map((rate) => ({ ...rate })),
    integrations: {
      googleOAuth: { ...state.integrations.googleOAuth },
      slack: { ...state.integrations.slack },
      drive: { ...state.integrations.drive },
      email: { ...state.integrations.email },
    },
    appTemplate: { ...state.appTemplate },
  };
}

function persistState(state: MonteDataState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(): MonteDataState {
  if (typeof window === "undefined") return defaultState;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    persistState(defaultState);
    return defaultState;
  }
  try {
    const parsed = JSON.parse(stored) as MonteDataState;
    return {
      ...defaultState,
      ...parsed,
      balances: { ...defaultState.balances, ...parsed.balances },
      integrations: {
        googleOAuth: {
          ...defaultState.integrations.googleOAuth,
          ...parsed.integrations?.googleOAuth,
        },
        slack: {
          ...defaultState.integrations.slack,
          ...parsed.integrations?.slack,
        },
        drive: {
          ...defaultState.integrations.drive,
          ...parsed.integrations?.drive,
        },
        email: {
          ...defaultState.integrations.email,
          ...parsed.integrations?.email,
        },
      },
      appTemplate: {
        ...defaultState.appTemplate,
        ...parsed.appTemplate,
      },
    };
  } catch (error) {
    console.error("Failed to parse stored Monte data", error);
    return defaultState;
  }
}

function latestRate(state: MonteDataState, currency: Currency): number {
  if (currency === "USD") return 1;
  const match = [...state.exchangeRates]
    .filter(
      (rate) => rate.fromCurrency === currency && rate.toCurrency === "USD",
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return match?.rate ?? 1;
}

function convertToUsd(
  state: MonteDataState,
  amount: number,
  currency: Currency,
  explicitRate?: number,
) {
  if (currency === "USD") return amount;
  const rate = explicitRate ?? latestRate(state, currency);
  return amount * rate;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MonteDataState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadState();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cargamos el estado persistido una sola vez al hidratar
    setState(stored);
    setHydrated(true);
  }, []);

  const mutate = useCallback(
    (updater: (draft: MonteDataState) => MonteDataState) => {
      setState((prev) => {
        const cloned = cloneState(prev);
        const next = updater(cloned);
        persistState(next);
        return next;
      });
    },
    [],
  );

  const addClient = useCallback(
    (input: Omit<Client, "id">) => {
      mutate((draft) => {
        draft.clients.push({ ...input, id: crypto.randomUUID() });
        return draft;
      });
    },
    [mutate],
  );

  const updateClient = useCallback(
    (id: string, input: Partial<Omit<Client, "id">>) => {
      mutate((draft) => {
        const client = draft.clients.find((item) => item.id === id);
        if (client) {
          Object.assign(client, input);
        }
        return draft;
      });
    },
    [mutate],
  );

  const deleteClient = useCallback(
    (id: string) => {
      mutate((draft) => {
        draft.clients = draft.clients.filter((client) => client.id !== id);
        draft.projects = draft.projects.filter(
          (project) => project.clientId !== id,
        );
        draft.invoices = draft.invoices.filter((invoice) => {
          const project = draft.projects.find(
            (project) => project.id === invoice.projectId,
          );
          return project !== undefined;
        });
        return draft;
      });
    },
    [mutate],
  );

  const addProject = useCallback(
    (input: Omit<Project, "id">) => {
      mutate((draft) => {
        draft.projects.push({ ...input, id: crypto.randomUUID() });
        return draft;
      });
    },
    [mutate],
  );

  const updateProject = useCallback(
    (
      id: string,
      input: Partial<Omit<Project, "id" | "allocations">> & {
        allocations?: Allocation[];
      },
    ) => {
      mutate((draft) => {
        const project = draft.projects.find((item) => item.id === id);
        if (project) {
          Object.assign(project, input);
          if (input.allocations) {
            project.allocations = input.allocations.map((allocation) => ({
              ...allocation,
            }));
          }
        }
        return draft;
      });
    },
    [mutate],
  );

  const deleteProject = useCallback(
    (id: string) => {
      mutate((draft) => {
        draft.projects = draft.projects.filter((project) => project.id !== id);
        draft.invoices = draft.invoices.filter(
          (invoice) => invoice.projectId !== id,
        );
        draft.expenses = draft.expenses.filter(
          (expense) => expense.projectId !== id,
        );
        return draft;
      });
    },
    [mutate],
  );

  const createInvoice = useCallback(
    (
      input: Omit<Invoice, "id" | "number" | "status" | "verificationUrl"> & {
        status?: InvoiceStatus;
        verificationUrl?: string;
      },
    ) => {
      const generatedId = crypto.randomUUID();
      const baseBranding: InvoiceBranding = {
        accentColor: input.branding?.accentColor ?? "#10b981",
        headerText: input.branding?.headerText ?? "Factura Monte Animation",
        footerText:
          input.branding?.footerText ??
          "Gracias por confiar en Monte Animation. Pago mediante transferencia bancaria.",
        logoDataUrl: input.branding?.logoDataUrl,
      };
      const normalizedLineItems = (input.lineItems ?? []).map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
      }));
      const defaultVerification =
        input.verificationUrl ??
        (typeof window !== "undefined"
          ? `${window.location.origin}/verify/${generatedId}`
          : `https://billing.monteanimation.com/verify/${generatedId}`);
      let created: Invoice = {
        ...input,
        lineItems: normalizedLineItems,
        branding: baseBranding,
        verificationUrl: defaultVerification,
        id: generatedId,
        number: "",
        status: input.status ?? "draft",
      } as Invoice;
      mutate((draft) => {
        const number = `MONTE-${String(draft.nextInvoiceSequence).padStart(4, "0")}`;
        draft.nextInvoiceSequence += 1;
        created = {
          ...created,
          number,
        };
        draft.invoices.push(created);
        return draft;
      });
      return created;
    },
    [mutate],
  );

  const updateInvoiceStatus = useCallback(
    (id: string, status: InvoiceStatus) => {
      mutate((draft) => {
        const invoice = draft.invoices.find((item) => item.id === id);
        if (invoice) {
          invoice.status = status;
        }
        return draft;
      });
    },
    [mutate],
  );

  const recordPayment = useCallback(
    (
      input: Omit<Payment, "id" | "pettyContribution" | "splits" | "exchangeRate"> & {
        exchangeRate?: number;
      },
    ) => {
      let created: Payment = {
        ...input,
        id: crypto.randomUUID(),
        pettyContribution: 0,
        splits: [],
        exchangeRate: input.exchangeRate ?? 1,
      } as Payment;

      mutate((draft) => {
        const invoice = draft.invoices.find(
          (item) => item.id === input.invoiceId,
        );
        if (!invoice) {
          return draft;
        }
        const project = draft.projects.find(
          (item) => item.id === input.projectId,
        );
        if (!project) {
          return draft;
        }
        const rate = input.exchangeRate ?? latestRate(draft, input.currency);
        const petty = draft.pettyCash.ruleType === "percent"
          ? (input.amount * draft.pettyCash.value) / 100
          : draft.pettyCash.value;
        const pettyApplied = Math.min(petty, input.amount);
        draft.pettyCash.balance += convertToUsd(
          draft,
          pettyApplied,
          input.currency,
          rate,
        );
        draft.balances["Fondo Monte"] = draft.pettyCash.balance;
        const net = input.amount - pettyApplied;
        let remaining = net;
        const splits: { allocationId: string; name: string; amount: number }[] = [];
        const fixedAllocations = project.allocations.filter(
          (allocation) => allocation.fixedAmount,
        );
        const percentAllocations = project.allocations.filter(
          (allocation) => allocation.percentage,
        );
        const totalFixed = fixedAllocations.reduce(
          (acc, allocation) => acc + (allocation.fixedAmount ?? 0),
          0,
        );
        remaining = Math.max(0, remaining - totalFixed);
        fixedAllocations.forEach((allocation) => {
          splits.push({
            allocationId: allocation.id,
            name: allocation.name,
            amount: allocation.fixedAmount ?? 0,
          });
          const usd = convertToUsd(
            draft,
            allocation.fixedAmount ?? 0,
            input.currency,
            rate,
          );
          draft.balances[allocation.name] =
            (draft.balances[allocation.name] ?? 0) + usd;
        });
        const totalPercent = percentAllocations.reduce(
          (acc, allocation) => acc + (allocation.percentage ?? 0),
          0,
        );
        percentAllocations.forEach((allocation) => {
          const ratio = (allocation.percentage ?? 0) / (totalPercent || 1);
          const share = remaining * ratio;
          splits.push({
            allocationId: allocation.id,
            name: allocation.name,
            amount: share,
          });
          const usd = convertToUsd(draft, share, input.currency, rate);
          draft.balances[allocation.name] =
            (draft.balances[allocation.name] ?? 0) + usd;
        });
        const paymentWithSplits: Payment = {
          ...created,
          pettyContribution: pettyApplied,
          splits,
          exchangeRate: rate,
        };
        created = paymentWithSplits;
        draft.payments.push(paymentWithSplits);
        const totalPaid = draft.payments
          .filter((payment) => payment.invoiceId === invoice.id)
          .reduce((acc, payment) => acc + payment.amount, 0);
        if (totalPaid >= invoice.total) {
          invoice.status = "paid";
        } else if (totalPaid > 0) {
          invoice.status = "partial";
        }
        return draft;
      });

      return created;
    },
    [mutate],
  );

  const addExpense = useCallback(
    (input: Omit<Expense, "id">) => {
      mutate((draft) => {
        draft.expenses.push({ ...input, id: crypto.randomUUID() });
        return draft;
      });
    },
    [mutate],
  );

  const toggleExpenseApproval = useCallback(
    (id: string) => {
      mutate((draft) => {
        const expense = draft.expenses.find((item) => item.id === id);
        if (expense) {
          expense.approved = !expense.approved;
        }
        return draft;
      });
    },
    [mutate],
  );

  const addAdjustment = useCallback(
    (input: Omit<Adjustment, "id">) => {
      mutate((draft) => {
        draft.adjustments.push({ ...input, id: crypto.randomUUID() });
        const usd = convertToUsd(draft, input.amount, input.currency);
        draft.balances[input.from] = (draft.balances[input.from] ?? 0) - usd;
        draft.balances[input.to] = (draft.balances[input.to] ?? 0) + usd;
        return draft;
      });
    },
    [mutate],
  );

  const updatePettyCashRule = useCallback(
    (rule: Pick<PettyCashRule, "ruleType" | "value">) => {
      mutate((draft) => {
        draft.pettyCash.ruleType = rule.ruleType;
        draft.pettyCash.value = rule.value;
        return draft;
      });
    },
    [mutate],
  );

  const addExchangeRate = useCallback(
    (input: Omit<ExchangeRate, "id">) => {
      mutate((draft) => {
        draft.exchangeRates.push({ ...input, id: crypto.randomUUID() });
        return draft;
      });
    },
    [mutate],
  );

  const updateIntegrations = useCallback(
    (key: keyof IntegrationSettings, input: Partial<IntegrationSettings[typeof key]>) => {
      mutate((draft) => {
        draft.integrations[key] = {
          ...draft.integrations[key],
          ...input,
        } as IntegrationSettings[typeof key];
        return draft;
      });
    },
    [mutate],
  );

  const updateAppTemplate = useCallback(
    (input: Partial<AppTemplateSettings>) => {
      mutate((draft) => {
        draft.appTemplate = {
          ...draft.appTemplate,
          ...input,
        };
        return draft;
      });
    },
    [mutate],
  );

  const resetAppTemplate = useCallback(() => {
    mutate((draft) => {
      draft.appTemplate = { ...defaultState.appTemplate };
      return draft;
    });
  }, [mutate]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--brand-accent", state.appTemplate.primaryColor);
    root.style.setProperty("--brand-accent-contrast", state.appTemplate.secondaryColor);
    root.style.setProperty("--brand-font-family", state.appTemplate.fontFamily);
  }, [state.appTemplate.fontFamily, state.appTemplate.primaryColor, state.appTemplate.secondaryColor]);

  const importFromCsv = useCallback(
    (rows: CsvRow[]) => {
      let imported = 0;
      mutate((draft) => {
        rows.forEach((row) => {
          const type = row.type?.toLowerCase();
          if (!type) return;
          switch (type) {
            case "client": {
              draft.clients.push({
                id: crypto.randomUUID(),
                name: row.name ?? "Cliente sin nombre",
                contactEmail: row.contactEmail ?? "",
                currency: (row.currency as Currency) ?? "USD",
                notes: row.notes ?? "",
              });
              imported += 1;
              break;
            }
            case "project": {
              const client = draft.clients.find(
                (client) =>
                  client.name.toLowerCase() ===
                  (row.client ?? "").toLowerCase(),
              );
              if (!client) break;
              draft.projects.push({
                id: crypto.randomUUID(),
                clientId: client.id,
                name: row.name ?? "Proyecto sin nombre",
                description: row.description ?? "",
                status: (row.status as ProjectStatus) ?? "planning",
                startDate: row.startDate ?? new Date().toISOString().slice(0, 10),
                endDate: row.endDate ?? "",
                budget: Number(row.budget ?? 0),
                currency: (row.currency as Currency) ?? client.currency,
                allocations: [
                  {
                    id: crypto.randomUUID(),
                    name: "Milo",
                    role: "milo",
                    percentage: 40,
                  },
                  {
                    id: crypto.randomUUID(),
                    name: "Sergio",
                    role: "sergio",
                    percentage: 35,
                  },
                  {
                    id: crypto.randomUUID(),
                    name: "Camila",
                    role: "collaborator",
                    percentage: 25,
                  },
                ],
              });
              imported += 1;
              break;
            }
            case "invoice": {
              const project = draft.projects.find(
                (project) =>
                  project.name.toLowerCase() ===
                  (row.project ?? "").toLowerCase(),
              );
              if (!project) break;
              const invoiceId = crypto.randomUUID();
              const number = `MONTE-${String(draft.nextInvoiceSequence).padStart(4, "0")}`;
              draft.nextInvoiceSequence += 1;
              draft.invoices.push({
                id: invoiceId,
                projectId: project.id,
                number,
                issueDate: row.issueDate ?? new Date().toISOString().slice(0, 10),
                dueDate:
                  row.dueDate ??
                  new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
                    .toISOString()
                    .slice(0, 10),
                subtotal: Number(row.subtotal ?? 0),
                taxes: Number(row.taxes ?? 0),
                total: Number(row.total ?? 0),
                currency: (row.currency as Currency) ?? project.currency,
                status: (row.status as InvoiceStatus) ?? "draft",
                notes: row.notes ?? "",
                lineItems: [
                  {
                    id: crypto.randomUUID(),
                    description: row.description ?? "Concepto importado",
                    amount: Number(row.subtotal ?? row.total ?? 0),
                  },
                ],
                branding: {
                  accentColor: (row.accentColor as string) ?? "#10b981",
                  headerText: row.headerText ?? "Factura Monte Animation",
                  footerText:
                    row.footerText ??
                    "Factura importada desde histórico. Verificar datos antes de enviar.",
                  logoDataUrl: typeof row.logoDataUrl === "string" ? row.logoDataUrl : undefined,
                },
                verificationUrl:
                  (row.verificationUrl as string) ??
                  `https://billing.monteanimation.com/verify/${invoiceId}`,
              });
              imported += 1;
              break;
            }
            case "payment": {
              const invoice = draft.invoices.find(
                (invoice) =>
                  invoice.number.toLowerCase() ===
                  (row.invoice ?? "").toLowerCase(),
              );
              if (!invoice) break;
              const project = draft.projects.find(
                (project) => project.id === invoice.projectId,
              );
              if (!project) break;
              const amount = Number(row.amount ?? 0);
              const currency = (row.currency as Currency) ?? invoice.currency;
              const rate = Number(row.exchangeRate ?? latestRate(draft, currency));
              const petty = draft.pettyCash.ruleType === "percent"
                ? (amount * draft.pettyCash.value) / 100
                : draft.pettyCash.value;
              const pettyApplied = Math.min(petty, amount);
              draft.pettyCash.balance += convertToUsd(
                draft,
                pettyApplied,
                currency,
                rate,
              );
              draft.balances["Fondo Monte"] = draft.pettyCash.balance;
              const net = amount - pettyApplied;
              const fixedAllocations = project.allocations.filter(
                (allocation) => allocation.fixedAmount,
              );
              const percentAllocations = project.allocations.filter(
                (allocation) => allocation.percentage,
              );
              const totalFixed = fixedAllocations.reduce(
                (acc, allocation) => acc + (allocation.fixedAmount ?? 0),
                0,
              );
              const remaining = Math.max(0, net - totalFixed);
              const splits: Payment["splits"] = [];
              fixedAllocations.forEach((allocation) => {
                const share = allocation.fixedAmount ?? 0;
                splits.push({
                  allocationId: allocation.id,
                  name: allocation.name,
                  amount: share,
                });
                const usd = convertToUsd(draft, share, currency, rate);
                draft.balances[allocation.name] =
                  (draft.balances[allocation.name] ?? 0) + usd;
              });
              const totalPercent = percentAllocations.reduce(
                (acc, allocation) => acc + (allocation.percentage ?? 0),
                0,
              );
              percentAllocations.forEach((allocation) => {
                const ratio = (allocation.percentage ?? 0) / (totalPercent || 1);
                const share = remaining * ratio;
                splits.push({
                  allocationId: allocation.id,
                  name: allocation.name,
                  amount: share,
                });
                const usd = convertToUsd(draft, share, currency, rate);
                draft.balances[allocation.name] =
                  (draft.balances[allocation.name] ?? 0) + usd;
              });
              draft.payments.push({
                id: crypto.randomUUID(),
                invoiceId: invoice.id,
                projectId: project.id,
                date: row.date ?? new Date().toISOString().slice(0, 10),
                amount,
                currency,
                method: row.method ?? "transfer",
                exchangeRate: rate,
                createdBy: row.createdBy ?? "Import",
                appliedTo: invoice.number,
                pettyContribution: pettyApplied,
                splits,
              });
              const totalPaid = draft.payments
                .filter((payment) => payment.invoiceId === invoice.id)
                .reduce((acc, payment) => acc + payment.amount, 0);
              if (totalPaid >= invoice.total) {
                invoice.status = "paid";
              } else if (totalPaid > 0) {
                invoice.status = "partial";
              }
              imported += 1;
              break;
            }
            case "expense": {
              const project = draft.projects.find(
                (project) =>
                  project.name.toLowerCase() ===
                  (row.project ?? "").toLowerCase(),
              );
              draft.expenses.push({
                id: crypto.randomUUID(),
                projectId: project?.id,
                userId: row.userId ?? "",
                description: row.description ?? "Gasto",
                category: row.category ?? "General",
                amount: Number(row.amount ?? 0),
                currency: (row.currency as Currency) ?? project?.currency ?? "USD",
                approved: row.approved === "true" || row.approved === "1",
                date: row.date ?? new Date().toISOString().slice(0, 10),
              });
              imported += 1;
              break;
            }
            case "adjustment": {
              draft.adjustments.push({
                id: crypto.randomUUID(),
                from: row.from ?? "Cuenta A",
                to: row.to ?? "Cuenta B",
                amount: Number(row.amount ?? 0),
                currency: (row.currency as Currency) ?? "USD",
                category: row.category ?? "Ajuste",
                note: row.note ?? row.comments ?? "",
                date: row.date ?? new Date().toISOString().slice(0, 10),
              });
              imported += 1;
              break;
            }
            default:
              break;
          }
        });
        return draft;
      });
      return {
        summary: `Importadas ${imported} filas`,
        imported,
      };
    },
    [mutate],
  );

  const value = useMemo(
    () => ({
      ...state,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      createInvoice,
      updateInvoiceStatus,
      recordPayment,
      addExpense,
      toggleExpenseApproval,
      addAdjustment,
      updatePettyCashRule,
      addExchangeRate,
      importFromCsv,
      updateIntegrations,
      updateAppTemplate,
      resetAppTemplate,
    }),
    [
      state,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      createInvoice,
      updateInvoiceStatus,
      recordPayment,
      addExpense,
      toggleExpenseApproval,
      addAdjustment,
      updatePettyCashRule,
      addExchangeRate,
      importFromCsv,
      updateIntegrations,
      updateAppTemplate,
      resetAppTemplate,
    ],
  );

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center">Preparando datos…</div>;
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData debe utilizarse dentro de DataProvider");
  }
  return context;
}
