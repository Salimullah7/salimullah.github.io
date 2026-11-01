export const integrations = [
  {
    name: "First Advantage",
    category: "Screening and verification",
    contribution:
      "Implemented JustGo-side asynchronous processing components, callback reconciliation, and credential outcome mapping; no ownership of the provider platform is claimed.",
    status: "Implemented · historical professional account",
  },
  {
    name: "NCSI",
    category: "Screening and verification",
    contribution:
      "Developed JustGo-side webhook processing and reconciliation workers, with sensitive-field handling and credential outcome updates.",
    status: "Implemented · historical professional account",
  },
  {
    name: "Oho",
    category: "Screening and verification",
    contribution:
      "Led JustGo-side integration design, webhook authentication, member correlation, and status mapping; did not build the external screening platform.",
    status: "UAT validated · production deployment not established",
  },
  {
    name: "etrainu",
    category: "Learning systems",
    contribution:
      "Developed JustGo-side adapter and single sign-on work, user mapping, and course-completion synchronization with the external learning platform.",
    status: "Implemented · historical professional account",
  },
  {
    name: "Moodle",
    category: "Learning systems",
    contribution:
      "Contributed to learner synchronization, identity mapping, enrollment processing, API exception handling, and credential-related data exchange; individual module ownership is not established.",
    status: "Contribution reported · professional account",
  },
  {
    name: "LearnUpon",
    category: "Learning systems",
    contribution:
      "Contributed to learner synchronization, identity mapping, enrollment processing, API exception handling, and credential-related data exchange; individual module ownership is not established.",
    status: "Contribution reported · professional account",
  },
  {
    name: "Xero",
    category: "Finance and accounting",
    contribution:
      "Developed JustGo-side invoice and payment processor components, transaction mapping, and accounting reconciliation; supported integration delivery.",
    status: "Implemented · historical professional account",
  },
  {
    name: "Stripe",
    category: "Payment interoperability",
    contribution:
      "Investigated payment reconciliation and credit-note mapping within the Xero integration context; standalone ownership of the payment gateway integration is not established.",
    status: "Reconciliation support · retrospective audit account",
  },
  {
    name: "Adyen",
    category: "Payment interoperability",
    contribution:
      "Contributed to investigation and remediation of asynchronous refund processing involving the external payment gateway; no ownership of the gateway or entire payment integration is claimed.",
    status: "Operational troubleshooting · retrospective audit account",
  },
  {
    name: "Google BigQuery",
    category: "Analytics and data exchange",
    contribution:
      "Built source-side SQL reporting views and advised on completeness, joins, and financial interpretation for downstream analytics; independent ownership of warehouse infrastructure is not established.",
    status: "Source-side implementation and downstream guidance · professional account",
  },
  {
    name: "Dotdigital",
    category: "Analytics and data exchange",
    contribution:
      "Supported data exchange and downstream identity interpretation through reporting and family-relationship work; ownership of the marketing environment is not established.",
    status: "Downstream integration support · professional account",
  },
  {
    name: "Google Wallet",
    category: "Digital credentials",
    contribution:
      "Co-developed and operated bulk credential-generation workflows using the external wallet service, including workload separation and rollout support; the wallet platform was externally provided.",
    status: "Co-developed delivery · historical professional account",
  },
  {
    name: "Apple Wallet",
    category: "Digital credentials",
    contribution:
      "Co-developed and operated bulk credential-generation workflows for externally provided wallet formats; contribution concerns JustGo processing and rollout rather than wallet-platform ownership.",
    status: "Co-developed delivery · historical professional account",
  },
  {
    name: "Integrity Print",
    category: "Secure file delivery",
    contribution:
      "Developed the sending-side scheduled service for SQL extraction, managed secret retrieval, authenticated file transmission, status updates, and failure reporting to an external print provider.",
    status: "Sending-side service delivered · historical professional account",
  },
  {
    name: "Omnipong",
    category: "Partner APIs",
    contribution:
      "Supported JustGo membership and eligibility API onboarding and production-access coordination; no development of the external tournament platform is claimed.",
    status: "Partner API support · retrospective audit account",
  },
  {
    name: "StadiumCompete",
    category: "Partner APIs",
    contribution:
      "Supported JustGo membership and eligibility API onboarding and production-access coordination; no development of the external tournament platform is claimed.",
    status: "Partner API support · retrospective audit account",
  },
  {
    name: "TTAurora",
    category: "Partner APIs",
    contribution:
      "Supported JustGo membership and eligibility API onboarding and production-access coordination; no development of the external tournament platform is claimed.",
    status: "Partner API support · retrospective audit account",
  },
  {
    name: "NATT",
    category: "Partner APIs",
    contribution:
      "Supported JustGo membership and eligibility API onboarding and production-access coordination; no development of the external tournament platform is claimed.",
    status: "Partner API support · retrospective audit account",
  },
  {
    name: "TTConnect",
    category: "Partner APIs",
    contribution:
      "Contributed to membership lookup, rating-data exchange, integration validation, and external developer support; external-platform ownership and a separate launch status are not established.",
    status: "Integration support · professional account",
  },
] as const;
