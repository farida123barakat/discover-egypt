/** Site navigation. One source for the header menus, mobile menu and site search. */
export type NavLink = { href: string; label: string; hint?: string };
export type NavGroup = { label: string; href: string; links: NavLink[] };

export const NAV: NavGroup[] = [
  {
    label: "Discover",
    href: "/discover",
    links: [
      { href: "/discover#find", label: "Find your Egypt", hint: "A quiz that matches you with places" },
      { href: "/bucket-list", label: "Egypt bucket list", hint: "Tick off unforgettable experiences" },
      { href: "/watch", label: "Watch & discover", hint: "Short films with captions and sources" },
      { href: "/discover#map", label: "Interactive map", hint: "Every destination, filtered your way" },
      { href: "/discover#beyond", label: "Beyond the pyramids", hint: "Lesser-known places" },
      { href: "/discover#timeline", label: "Walk through time", hint: "5,000 years in one timeline" },
      { href: "/discover#calendar", label: "Events calendar" },
      { href: "/discover#photo", label: "Golden hour finder", hint: "Plan the best light for photos" },
    ],
  },
  {
    label: "Plan",
    href: "/plan",
    links: [
      { href: "/plan#builder", label: "Smart trip builder", hint: "Day-by-day itinerary" },
      { href: "/plan#budget", label: "Budget calculator" },
      { href: "/plan#tools", label: "Currency & packing" },
      { href: "/plan#routes", label: "Suggested routes" },
    ],
  },
  {
    label: "Experience",
    href: "/experience",
    links: [
      { href: "/hieroglyphs", label: "Decode hieroglyphs", hint: "Scan a sign, learn, take the quiz" },
      { href: "/taste", label: "Taste Egypt by region", hint: "What to eat where you are, and recipes" },
      { href: "/experience#decode", label: "Speak a little Egyptian" },
      { href: "/experience#etiquette", label: "Culture & etiquette" },
      { href: "/experience#senses", label: "Egypt through the senses" },
    ],
  },
  {
    label: "Travel Smart",
    href: "/travel-smart",
    links: [
      { href: "/travel-smart#safety", label: "Safety & emergency numbers" },
      { href: "/travel-smart#getting-around", label: "Getting around" },
      { href: "/travel-smart#walks", label: "Walking routes" },
      { href: "/travel-smart#prices", label: "Fair price guide" },
      { href: "/travel-smart#accessibility", label: "Accessibility" },
      { href: "/community#ask", label: "Ask a local" },
    ],
  },
];
