# PawConnect Design System

Welcome to the **PawConnect Design System**. This document defines the primary UI/UX guidelines, design tokens, and style definitions for the PawConnect application, directly inspired by the dark, high-contrast, premium design style of the provided reference theme (`PawConnectTheme.png`).

---

## 🎨 Design Language & Inspiration

The reference theme establishes a **sleek, minimalist, premium dark mode** aesthetic. Instead of standard bright/playful designs typical of pet websites, PawConnect adapts this luxurious, emotional design style. By combining a near-black canvas with high-quality pet photography, warm amber-orange accents, and elegant typography, we create a deeply emotional, high-end experience that elevates the importance of pet adoption.

---

## 🌈 Color Palette

All colors are chosen to maintain a consistent dark, warm, and highly readable interface.

| Token Name | Hex Code | Visual Sample / Usage |
| :--- | :--- | :--- |
| **Primary Background** | `#0A0A0A` | Main page canvas (rich, deep charcoal black) |
| **Secondary Background** | `#141414` | Card boxes, navigation bars, modal dialogs, dashboard panels |
| **Secondary Light** | `#1A1A1A` | Input fields, active dropdown items, secondary buttons |
| **Accent Orange** | `#E07A2F` | Primary branding, active links, logos, bullet indicators, primary buttons, highlighted text |
| **Accent Orange Light** | `#F0924F` | Hover states for primary elements, active glows |
| **Text Primary** | `#FFFFFF` | Clear headers, selected navigation items, primary titles |
| **Text Secondary** | `#9E9E9E` | Standard body copy, labels, inactive tabs, captions |
| **Text Muted** | `#525252` | Footers, slide numbering denominators, inactive slider indicators |
| **Border Dark** | `#222222` | Discrete grid lines, card borders, form outlines |
| **Border Focus** | `#444444` | Highlighting interactive focus states, default buttons on hover |

---

## 🔤 Typography & Font Stack

Typography is used in high-contrast combinations to create visual heirarchy and an emotional tone.

*   **Main Font Family (Sans-Serif):** `Inter` or `Montserrat` (Fallback: `system-ui, -apple-system, sans-serif`)
    *   *Usage:* Navigation, button labels, grid cards, forms, secondary titles, body text.
*   **Emphasis Cursive Font Family (Script):** `Playfair Display` (Italics), `Allura`, or `Caveat`
    *   *Usage:* Specific lowercase emotional accent words placed above main headings (e.g., *pure*, *loyal*, *chosen*).
*   **Display / Hero Title Font Stack:**
    *   *Font:* `Montserrat` (Black weight, e.g., 800 or 900)
    *   *Letter Spacing:* `-0.03em` or `-0.05em`
    *   *Styling:* Main keyword in lowercase, ending with an orange dot (e.g., `cuteness.`, `friendship.`, `companionship.`).
*   **Body Text:**
    *   *Size:* `14px` - `16px`
    *   *Line Height:* `1.6` for optimal readability.

---

## ⏹️ Layout Grid & Spacing

*   **Responsive Margins:**
    *   *Desktop (>= 1200px):* `8%` left/right padding.
    *   *Tablet (>= 768px):* `5%` left/right padding.
    *   *Mobile (< 768px):* `16px` flat padding.
*   **Whitespace:** Extremely generous spacing. Sections are separated by `100px` to `140px` padding on desktop to maintain the premium, spacious atmosphere.
*   **Grid System:** Standard CSS Grid `/ Flexbox`. Dashboard grids utilize a standard 2-column or 3-column system with a `24px` gutter.

---

## 📦 Card Designs

Cards (used for pet listings, user profiles, dashboard metrics) follow a strict aesthetic:

```css
.card {
  background-color: #141414;
  border: 1px solid #222222;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}

.card:hover {
  transform: translateY(-6px);
  border-color: #E07A2F;
  box-shadow: 0 12px 30px rgba(224, 122, 47, 0.12);
}
```

*   **Card Images:** Image fills the top portion or sits left/right depending on the screen. The image should have high contrast, blending slightly into the dark card body using subtle linear-gradients (`linear-gradient(to top, #141414 0%, transparent 40%)`).

---

## 🔘 Button Styles

Interaction components have strong, sleek, modern behaviors.

1.  **Primary Action Button:**
    *   *Style:* Solid Accent Orange (`#E07A2F`), white text.
    *   *Transitions:* Hover triggers background color scaling to `#F0924F` and a slight scale up (`scale(1.02)`).
    *   *Border Radius:* `6px` or dynamic rounded pill shapes depending on application.
2.  **Secondary Action Button:**
    *   *Style:* Border `1px solid #FFFFFF`, background transparent.
    *   *Hover:* Background turns white, text turns black OR background turns `#141414` (depending on secondary tier).
3.  **Minimalist Slider Button:**
    *   *Style:* Dual-line arrows (e.g., `<` or `>`), thin stroke (`1px`), clean background, opacity changes (`0.5` normal to `1.0` hover).

---

## 🧭 Navigation & Layout

### Header Styling
*   **Style:** Fixed or sticky floating header, background `#0A0A0A` with a translucent overlay (backdrop-filter: blur) on scroll.
*   **Logo:** Text-based e.g., `paw.` (where "paw" is white and "." is our Accent Orange).
*   **Navigation:** Center-aligned, sentence case links ("Inspiration", "Browse", "Adoptions", "Contact") with low-contrast muted white/grey, hovering to full white.
*   **Right Side:** Minimalist hamburger toggle (two sleek horizontal bars) or profile image badge with a subtle orange border.

### Footer Styling
*   **Style:** Minimalistic, dark background (`#0A0A0A`).
*   **Layout:** Symmetrical, simple columns containing copyright text (`@2026 pawconnect`) on the left, standard icon grids on the right (outlined social icons), and simple links.

---

## 📝 Form & Input Styling

Inputs must blend into the dark canvas without looking jarring:

```css
input, select, textarea {
  width: 100%;
  background-color: #1A1A1A;
  border: 1px solid #222222;
  border-radius: 8px;
  color: #FFFFFF;
  padding: 12px 16px;
  font-family: inherit;
  transition: border-color 0.25s ease;
}

input:focus {
  outline: none;
  border-color: #E07A2F;
  box-shadow: 0 0 8px rgba(224, 122, 47, 0.25);
}
```

---

## ⚡ Animation Guideline

*   **Transitions:** All interactive hover states, clicks, and page navigations use `cubic-bezier(0.4, 0, 0.2, 1)` or custom spring curves.
*   **Micro-interactions:** Navigation links feature a bottom orange underline expanding outward from the center on hover.
*   **Pet Gallery Carousel:** Carousel slides scroll with a smooth horizontal fade and translate entry when arrows are clicked, keeping transitions fluid and premium.

---

This design token blueprint forms the foundation of all pages. Any layout built for **PawConnect** will inherit this modern, dark, pet-centric design theme.
