export type QueueRow = { ticket: string; counter: string };

export type QueueTableData = {
  title: string;
  rows: QueueRow[];
};

export const queueTables: Record<string, QueueTableData> = {
  sequential: {
    title: "Sequential",
    rows: [
      { ticket: "A-101", counter: "Counter 02" },
      { ticket: "A-102", counter: "Counter 01" },
      { ticket: "A-103", counter: "Counter 05" },
      { ticket: "A-104", counter: "Counter 04" },
    ],
  },
  queueStatus: {
    title: "Queue Status",
    rows: [
      { ticket: "A-104", counter: "Counter 02" },
      { ticket: "A-103", counter: "Counter 01" },
      { ticket: "B-207", counter: "Counter 05" },
      { ticket: "C-301", counter: "Counter 04" },
    ],
  },
  priority: {
    title: "Priority",
    rows: [
      { ticket: "A-101", counter: "Counter 02" },
      { ticket: "A-102", counter: "Counter 01" },
      { ticket: "V - 105", counter: "Counter 05" },
      { ticket: "A-104", counter: "Counter 04" },
    ],
  },
  custom: {
    title: "Custom",
    rows: [
      { ticket: "A-101", counter: "Counter 02" },
      { ticket: "A-105", counter: "Counter 01" },
      { ticket: "A-102", counter: "Counter 05" },
      { ticket: "A-108", counter: "Counter 04" },
    ],
  },
};

export const navLinks = [
  { label: "Home", href: "#", active: true },
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

/* width/height are the SVG's natural (Figma) dimensions */
export const partners = [
  { name: "Protected", file: "partner-protected.svg", width: 191, height: 30 },
  { name: "splatter", file: "partner-splatter.svg", width: 179, height: 46 },
  { name: "Asterisk", file: "partner-asterisk.svg", width: 171, height: 39 },
  { name: "Cloudform", file: "partner-cloudform.svg", width: 191, height: 41 },
  { name: "Chain", file: "partner-chain.svg", width: 161, height: 66 },
  { name: "New Duet", file: "partner-newduet.svg", width: 163, height: 32 },
  { name: "Funnel", file: "partner-funnel.svg", width: 142, height: 39 },
  { name: "Speed", file: "partner-speed.svg", width: 173, height: 42 },
  { name: "Fast Aid", file: "partner-fastaid.svg", width: 142, height: 34 },
  { name: "Ohealth", file: "partner-ohealth.svg", width: 141, height: 28 },
];

export const steps = [
  {
    id: "01",
    title: "Configure",
    body: "Set your preferred number range, choose how numbers will be called, and configure your queue to match your workflow. Whether you need sequential, random, or priority-based calling, setup takes just a few clicks.",
    cardColor: "#d4ccff",
    image: null,
  },
  {
    id: "02",
    title: "Customize Display",
    body: "Personalize the experience with custom themes, display layouts, colors, and voice announcement settings. Create a professional queue screen that reflects your brand and works perfectly for your environment.",
    cardColor: "#c8e5fc",
    image: "/images/step2-photo-a.jpg",
  },
  {
    id: "03",
    title: "Launch Display",
    body: "Open your live queue display on any TV, monitor, projector, or browser-enabled device. No special hardware is required—simply connect your screen and start displaying numbers instantly.",
    cardColor: "#f9c8fc",
    image: "/images/step3-photo-a.jpg",
  },
  {
    id: "04",
    title: "Start Calling",
    body: "Call the next number with a single click and let NumberCaller handle the rest. Numbers are displayed in real time and announced automatically, ensuring a smooth and organized experience for everyone waiting.",
    cardColor: "#fcc8c9",
    image: "/images/step4-photo-b.jpg",
  },
];

export const useCases = [
  {
    icon: "ticket",
    title: "Events",
    body: "Effortlessly call table numbers with a professional, streamlined display for any occasion.",
  },
  {
    icon: "restaurant",
    title: "Restaurants",
    body: "Manage your floor with ease - perfect for calling out table assignments or simplifying waitlists.",
  },
  {
    icon: "retail",
    title: "Retail & Service Counters",
    body: 'Modernize your "take a number" system for delis, banks, and repair shops to cut down perceived wait times.',
  },
  {
    icon: "education",
    title: "Education & Training",
    body: "Randomize student presentations, assign exam seating, or dynamically split workshops into breakout groups.",
  },
];

export const testimonials = [
  {
    quote:
      "NumberCaller completely changed how we manage our restaurant waitlist. Customers always know when it's their turn.",
    author: "Restaurant Manager",
  },
  {
    quote:
      "We used to call out customer names manually, which often created confusion during busy hours. NumberCaller made the entire process effortless.",
    author: "Retail Store Owner",
  },
  {
    quote:
      "We had our queue display running on our existing TV in less than ten minutes. The voice announcements and live display work flawlessly.",
    author: "Operations Coordinator",
  },
  {
    quote:
      "Managing customer flow has never been easier. The system is intuitive, reliable, and has significantly improved our customer experience.",
    author: "Customer Service Manager",
  },
];

export const faqCategories = [
  "Getting Started",
  "Queue Management",
  "Displays & Screens",
  "Voice Announcements",
  "Customization & Branding",
  "Pricing & Billing",
];

export const faqs = [
  {
    question: "What is NumberCaller?",
    answer:
      "NumberCaller is a modern queue management platform that helps businesses organize waiting lines through live number displays and automated voice announcements. It enables staff to call customers efficiently while keeping everyone informed in real time.",
  },
  {
    question: "How does NumberCaller work?",
    answer:
      "Create a queue, connect any TV, monitor, or projector as your live display, and start calling numbers from any device. Each number you call is shown on screen instantly and announced out loud, so customers always know when it's their turn.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most businesses are up and running in under ten minutes. There is no hardware to install—simply open your queue display in a browser, connect it to your screen, and start calling numbers.",
  },
  {
    question: "Do I need to install any software?",
    answer:
      "No. NumberCaller runs entirely in the browser, so it works on any TV, monitor, projector, or browser-enabled device without downloads, apps, or special hardware.",
  },
  {
    question: "Can I try NumberCaller for free?",
    answer:
      "Yes. You can start a free trial with full access to live displays, voice announcements, and all calling modes—no credit card required.",
  },
];

export const footerColumns = [
  {
    title: "Contact",
    links: ["helloconfidency@gmail.com", "+880 1794 106516"],
  },
  {
    title: "Solutions",
    links: ["Events", "Restaurants", "Retail & Service Counters", "Education & Training"],
  },
  {
    title: "Resources",
    links: ["Help Center", "Blog", "System Status", "Contact Support"],
  },
];
