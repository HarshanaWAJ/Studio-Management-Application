export type BlockType =
  | "hero"
  | "about"
  | "services"
  | "gallery"
  | "testimonials"
  | "cta"
  | "contact"
  | "booking"
  | "text-image"
  | "custom-text";

export type Block = {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
};

export const BLOCK_LIBRARY: { type: BlockType; label: string; description: string }[] = [
  { type: "hero", label: "Hero", description: "Big title, subtitle, background image and a call-to-action" },
  { type: "about", label: "About", description: "Studio story with an optional photo" },
  { type: "text-image", label: "Text + Image", description: "A custom paragraph next to a photo" },
  { type: "services", label: "Services", description: "Your packages/pricing, pulled live from Packages" },
  { type: "gallery", label: "Gallery", description: "Portfolio grid from your public galleries" },
  { type: "testimonials", label: "Testimonials", description: "Client quotes" },
  { type: "booking", label: "Booking Widget", description: "Lets visitors request a session — creates a real booking" },
  { type: "contact", label: "Contact Form", description: "Lead capture form, saved to your Contact Us inbox" },
  { type: "cta", label: "Call To Action", description: "A banner with a button linking anywhere" },
  { type: "custom-text", label: "Custom Text", description: "Freeform heading + paragraph" },
];

export const defaultBlockData = (type: BlockType): Record<string, unknown> => {
  switch (type) {
    case "hero":
      return { title: "Timeless Stories, Beautifully Told", subtitle: "Wedding & portrait photography", imageUrl: "", buttonText: "Get In Touch", buttonTarget: "#contact" };
    case "about":
      return { heading: "About Us", text: "Tell your story here…", imageUrl: "" };
    case "text-image":
      return { heading: "", text: "", imageUrl: "", imagePosition: "right" };
    case "services":
      return { heading: "Services", intro: "" };
    case "gallery":
      return { heading: "Portfolio", limit: 9 };
    case "testimonials":
      return { heading: "What Clients Say", items: [{ quote: "Amazing experience!", author: "A. Perera" }] };
    case "booking":
      return { heading: "Book a Session", subtitle: "Pick a package and request your date." };
    case "contact":
      return { heading: "Let's Talk", message: "Send us a message and we'll get back to you." };
    case "cta":
      return { heading: "Ready to book your session?", buttonText: "Contact Us", buttonTarget: "#contact" };
    case "custom-text":
      return { heading: "", text: "" };
    default:
      return {};
  }
};
