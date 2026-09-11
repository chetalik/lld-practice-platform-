import type { Problem } from "./domain.js";

export const problems: Problem[] = [
  {
    id: "parking-lot",
    slug: "parking-lot",
    title: "Parking Lot",
    difficulty: "Medium",
    description:
      "Design a parking lot that supports multiple vehicle types, multiple floors, spot allocation, entry/exit, and fee calculation.",
    requirements: [
      { id: "vehicle-types", text: "Support multiple vehicle types.", requiredSignals: ["vehicle"] },
      { id: "spots", text: "Support different parking spot types and availability.", requiredSignals: ["spot"] },
      { id: "allocation", text: "Allocate a suitable spot when a vehicle enters.", requiredSignals: ["allocate", "strategy"] },
      { id: "entry-exit", text: "Model entry and exit with a ticket or equivalent.", requiredSignals: ["ticket", "entry", "exit"] },
      { id: "fees", text: "Calculate parking fees using an extensible policy.", requiredSignals: ["fee", "pricing", "strategy"] }
    ],
    criteria: [
      { id: "responsibility", name: "Responsibilities", description: "Classes have focused responsibilities.", weight: 25 },
      { id: "abstraction", name: "Abstraction", description: "Changing allocation/pricing rules does not require broad rewrites.", weight: 25 },
      { id: "relationships", name: "Relationships", description: "Object relationships are explicit and sensible.", weight: 20 },
      { id: "extensibility", name: "Extensibility", description: "New vehicle/spot/pricing behaviour can be added cleanly.", weight: 20 },
      { id: "tradeoffs", name: "Trade-offs", description: "The design explains meaningful trade-offs.", weight: 10 }
    ]
  },
  {
    id: "elevator",
    slug: "elevator",
    title: "Elevator System",
    difficulty: "Hard",
    description:
      "Design an elevator system with multiple elevators, floor requests, scheduling, movement, and door state.",
    requirements: [
      { id: "requests", text: "Support external and internal floor requests.", requiredSignals: ["request"] },
      { id: "scheduler", text: "Use an explicit scheduling/dispatch strategy.", requiredSignals: ["strategy", "scheduler", "dispatch"] },
      { id: "state", text: "Model elevator movement and door states.", requiredSignals: ["state", "door", "floor"] },
      { id: "multiple", text: "Support multiple elevators.", requiredSignals: ["elevator"] },
      { id: "extensible", text: "Make scheduling behaviour replaceable.", requiredSignals: ["interface", "strategy"] }
    ],
    criteria: [
      { id: "state", name: "State modelling", description: "Elevator states and transitions are clear.", weight: 25 },
      { id: "dispatch", name: "Dispatch design", description: "Dispatch/scheduling is separated from elevator behaviour.", weight: 30 },
      { id: "coupling", name: "Coupling", description: "Components avoid unnecessary knowledge of one another.", weight: 20 },
      { id: "extensibility", name: "Extensibility", description: "Alternative strategies can be introduced.", weight: 15 },
      { id: "tradeoffs", name: "Trade-offs", description: "The design explains decisions.", weight: 10 }
    ]
  },
  {
    id: "vending-machine",
    slug: "vending-machine",
    title: "Vending Machine",
    difficulty: "Easy",
    description:
      "Design a vending machine that handles inventory, money insertion, item selection, dispensing, refunds, and out-of-stock states.",
    requirements: [
      { id: "inventory", text: "Track products and quantities.", requiredSignals: ["inventory", "product"] },
      { id: "money", text: "Accept money and calculate change.", requiredSignals: ["money", "change"] },
      { id: "states", text: "Model relevant machine states.", requiredSignals: ["state"] },
      { id: "dispense", text: "Dispense an item only when the purchase is valid.", requiredSignals: ["dispense"] },
      { id: "refund", text: "Support cancellation/refund.", requiredSignals: ["refund", "cancel"] }
    ],
    criteria: [
      { id: "state", name: "State pattern", description: "State-dependent behaviour is explicit.", weight: 30 },
      { id: "responsibility", name: "Responsibilities", description: "Inventory/payment/dispensing concerns are separated.", weight: 25 },
      { id: "edge-cases", name: "Edge cases", description: "Out-of-stock and insufficient funds are handled.", weight: 25 },
      { id: "extensibility", name: "Extensibility", description: "Payment or pricing behaviour can evolve.", weight: 20 }
    ]
  },
  {
    id: "library",
    slug: "library",
    title: "Library Management",
    difficulty: "Medium",
    description:
      "Design a library system supporting books, members, search, borrowing, returns, and overdue policies.",
    requirements: [
      { id: "catalog", text: "Represent books and searchable catalogue data.", requiredSignals: ["book", "catalog"] },
      { id: "members", text: "Represent members and borrowing limits.", requiredSignals: ["member"] },
      { id: "borrow", text: "Support borrow and return operations.", requiredSignals: ["borrow", "return"] },
      { id: "availability", text: "Track item availability.", requiredSignals: ["available", "inventory"] },
      { id: "policy", text: "Make overdue/fee policy replaceable.", requiredSignals: ["policy", "strategy", "fee"] }
    ],
    criteria: [
      { id: "model", name: "Domain model", description: "Core entities and value flows are clear.", weight: 25 },
      { id: "responsibility", name: "Responsibilities", description: "Services/entities have focused roles.", weight: 25 },
      { id: "policy", name: "Policies", description: "Overdue rules are not hard-coded into unrelated classes.", weight: 25 },
      { id: "extensibility", name: "Extensibility", description: "Policies and search can evolve.", weight: 25 }
    ]
  }
];
