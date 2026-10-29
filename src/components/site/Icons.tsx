const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const WhatsAppIcon = () => (
  <svg {...base}>
    <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6L3 21z" />
    <path d="M9 8.5c.3 2.9 2.6 5.2 5.5 5.5l1.2-1.3-2-1-.8.7a4 4 0 0 1-2-2l.7-.8-1-2L9 8.5z" />
  </svg>
);
export const InstagramIcon = () => (
  <svg {...base}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
  </svg>
);
export const MailIcon = () => (
  <svg {...base}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);
export const TruckIcon = () => (
  <svg {...base}>
    <path d="M2 6h11v10H2zM13 10h4l3 3v3h-7" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="16.5" cy="17.5" r="1.8" />
  </svg>
);
export const CartIcon = () => (
  <svg {...base}>
    <path d="M3 4h2.5l2 11h10l2-8H7" />
    <circle cx="9" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </svg>
);
export const UserIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.2-4 4-6 8-6s6.8 2 8 6" />
  </svg>
);
export const MenuIcon = () => (
  <svg {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const CloseIcon = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
