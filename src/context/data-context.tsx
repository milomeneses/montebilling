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
};

type CsvRow = Record<string, string> & { type: string };

type DataContextValue = MonteDataState & {
  addClient: (input: Omit<Client, "id">) => void;
  updateClient: (id: string, input: Partial<Omit<Client, "id">>) => void;
  deleteClient: (id: string) => void;
  addProject: (input: Omit<Project, "id">) => void;
  updateProject: (id: string, input: Partial<Omit<Project, "id" | "allocations">> & { allocations?: Allocation[] }) => void;
  deleteProject: (id: string) => void;
  createInvoice: (input: Omit<Invoice, "id" | "number" | "status"> & { status?: InvoiceStatus }) => Invoice;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  recordPayment: (input: Omit<Payment, "id" | "pettyContribution" | "splits" | "exchangeRate"> & { exchangeRate?: number }) => Payment;
  addExpense: (input: Omit<Expense, "id">) => void;
  toggleExpenseApproval: (id: string) => void;
  addAdjustment: (input: Omit<Adjustment, "id">) => void;
  updatePettyCashRule: (rule: Pick<PettyCashRule, "ruleType" | "value">) => void;
  addExchangeRate: (input: Omit<ExchangeRate, "id">) => void;
  importFromCsv: (rows: CsvRow[]) => { summary: string; imported: number };
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

const STORAGE_KEY = "monte-data-state";

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
  ],
  projects: [
    {
      id: "project-gig-1",
      clientId: "client-winston",
      name: "Campaña Winston 2024",
      description: "Spots animados para campaña global",
      status: "wip",
      startDate: new Date().toISOString().slice(0, 10),
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
          percentage: 40,
        },
        {
          id: "alloc-colab",
          name: "Colaboradores",
          role: "collaborator",
          percentage: 20,
        },
      ],
    },
    {
      id: "project-gig-2",
      clientId: "client-latam",
      name: "Spot streaming regional",
      description: "Localización LATAM",
      status: "planning",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      budget: 12000000,
      currency: "ARS",
      allocations: [
        {
          id: "alloc-milo-2",
          name: "Milo",
          role: "milo",
          percentage: 50,
        },
        {
          id: "alloc-sergio-2",
          name: "Sergio",
          role: "sergio",
          percentage: 30,
        },
        {
          id: "alloc-colab-2",
          name: "Freelancers",
          role: "collaborator",
          percentage: 20,
        },
      ],
    },
  ],
  invoices: [
    {
      id: "invoice-1",
      projectId: "project-gig-1",
      number: "MONTE-0001",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .slice(0, 10),
      subtotal: 15000,
      taxes: 3150,
      total: 18150,
      currency: "USD",
      status: "sent",
      notes: "Primer milestone",
    },
  ],
  payments: [],
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
      date: new Date().toISOString().slice(0, 10),
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
      date: new Date().toISOString().slice(0, 10),
    },
  ],
  pettyCash: {
    ruleType: "percent",
    value: 10,
    balance: 2500,
  },
  balances: {
    Milo: 0,
    Sergio: 0,
    "Colaboradores": 0,
    "Fondo Monte": 2500,
  },
  exchangeRates: [
    {
      id: "rate-ars",
      date: new Date().toISOString().slice(0, 10),
      fromCurrency: "ARS",
      toCurrency: "USD",
      rate: 0.0011,
    },
    {
      id: "rate-cop",
      date: new Date().toISOString().slice(0, 10),
      fromCurrency: "COP",
      toCurrency: "USD",
      rate: 0.00026,
    },
  ],
  nextInvoiceSequence: 2,
};

function cloneState(state: MonteDataState): MonteDataState {
  return {
    ...state,
    clients: [...state.clients],
    projects: state.projects.map((project) => ({
      ...project,
      allocations: project.allocations.map((allocation) => ({ ...allocation })),
    })),
    invoices: state.invoices.map((invoice) => ({ ...invoice })),
    payments: state.payments.map((payment) => ({
      ...payment,
      splits: payment.splits.map((split) => ({ ...split })),
    })),
    expenses: state.expenses.map((expense) => ({ ...expense })),
    adjustments: state.adjustments.map((adjustment) => ({ ...adjustment })),
    pettyCash: { ...state.pettyCash },
    balances: { ...state.balances },
    exchangeRates: state.exchangeRates.map((rate) => ({ ...rate })),
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
      input: Omit<Invoice, "id" | "number" | "status"> & {
        status?: InvoiceStatus;
      },
    ) => {
      let created: Invoice = {
        ...input,
        id: crypto.randomUUID(),
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
                allocations: client.name.includes("Milo")
                  ? [
                      {
                        id: crypto.randomUUID(),
                        name: "Milo",
                        role: "milo",
                        percentage: 50,
                      },
                    ]
                  : [
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
                        percentage: 40,
                      },
                      {
                        id: crypto.randomUUID(),
                        name: "Colaboradores",
                        role: "collaborator",
                        percentage: 20,
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
              const number = `MONTE-${String(draft.nextInvoiceSequence).padStart(4, "0")}`;
              draft.nextInvoiceSequence += 1;
              draft.invoices.push({
                id: crypto.randomUUID(),
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
