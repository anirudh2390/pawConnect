# PawConnect UI/UX Design Blueprint
## Senior UI/UX Designer Specification
### Framework constraints: Bootstrap 5 & React Bootstrap
### Visual Theme: Sleek Premium Dark Mode (derived from `PawConnectTheme.png`)

---

## 1. Complete Design System & Theme Customization

To align the design language of `PawConnectTheme.png` with **Bootstrap 5 / React Bootstrap**, we overwrite default Bootstrap Sass variables. This bridges classic marketplace UI usability (similar to Airbnb and OLX grids) with our premium dark-mode aesthetic.

### A. CSS Custom Properties / Design Tokens
We define global tokens inside css stylesheets to override native styling wrappers:
```css
:root {
  /* Color Palette Tokens */
  --bs-body-bg: #0A0A0A;
  --bs-body-color: #FFFFFF;
  
  --paw-bg-deep: #0A0A0A;
  --paw-bg-card: #141414;
  --paw-bg-input: #1A1A1A;
  
  --paw-primary: #E07A2F;       /* Accent Orange */
  --paw-primary-hover: #F0924F; /* Hover State */
  
  --paw-text-title: #FFFFFF;
  --paw-text-body: #9E9E9E;
  --paw-text-muted: #525252;
  
  --paw-border: #222222;
  --paw-border-active: #444444;

  /* Typography Fonts */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-accent: 'Montserrat', sans-serif;
  --font-cursive: 'Caveat', cursive; /* Used for emotional script accents */

  /* Structural Details */
  --paw-radius-card: 12px;
  --paw-radius-input: 8px;
  --paw-shadow-glow: 0 12px 30px rgba(224, 122, 47, 0.12);
  --paw-transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
```

---

## 2. Bootstrap 5 Utility Mapping

To apply clean dark mode structures across our components, we specify utility mappings for React Bootstrap variables:

| UI Attribute | Bootstrap 5 Equivalence | Custom CSS Modifier |
| :--- | :--- | :--- |
| **Grid Canvas** | `<Container className="bg-dark text-white"...>` | Custom class overrides `.bg-dark` to `--paw-bg-deep` |
| **Card Frame** | `<Card className="border-secondary"...>` | Override card classes with `.paw-card` targeting `--paw-bg-card` |
| **Action Primary** | `<Button variant="primary"...>` | `.btn-primary` mapped override to background `--paw-primary` |
| **Action Secondary**| `<Button variant="outline-light"...>`| `.btn-outline-light` mapped with `border-color: #222222` |
| **Text Secondary** | `className="text-muted"` or `text-secondary` | Mapped to override class values to `--paw-text-body` |
| **Form Inputs** | `<Form.Control className="bg-dark"...>`| `.form-control` customized with background `--paw-bg-input` |
| **Status Badges** | `<Badge bg="primary"...>` | Used for vaccination/vet status with custom padding & style |

---

## 3. Component Library Specifications

### A. Header Navigation Bar (`Navbar`)
*   **Structure:** Floating navbar with background transparency blur.
*   **Logo (`Navbar.Brand`):** `paw.` text layout. "paw" in bold sans-serif `#FFFFFF`, "." in Accent Orange `#E07A2F`.
*   **Navigation Links (`Nav.Link`):** Active nav lists use `--paw-primary` with a bottom orange border micro-animation expanding outwards. Inactive elements use `--paw-text-body`.
*   **Action triggers:** Hamburger menu uses two thin bars (custom CSS replacing standard grid SVG hamburger icon to match `PawConnectTheme.png` style).

### B. Standard Card (`Card`)
*   **Style:** Background `#141414`, border `1px solid #222222`, border-radius `12px`.
*   **Interactivity:** Hover triggers `-6px` scale translateY and border glow using CSS:
    ```css
    .paw-card {
      background-color: var(--paw-bg-card);
      border: 1px solid var(--paw-border);
      border-radius: var(--paw-radius-card);
      transition: var(--paw-transition);
    }
    .paw-card:hover {
      transform: translateY(-6px);
      border-color: var(--paw-primary);
      box-shadow: var(--paw-shadow-glow);
    }
    ```

### C. Buttons (`Button`)
*   **Primary:**
    ```css
    .btn-paw-primary {
      background-color: var(--paw-primary);
      border: none;
      color: #FFFFFF;
      font-weight: 600;
      padding: 10px 24px;
      border-radius: 6px;
      transition: var(--paw-transition);
    }
    .btn-paw-primary:hover {
      background-color: var(--paw-primary-hover);
      transform: scale(1.02);
    }
    ```
*   **Secondary:** Outline borders, white text, subtle orange border on hover.

### D. Input Elements (`Form.Control`)
*   **Style:** Dark background fills (`#1A1A1A`), light text, clean borders (`1px solid #222222`). Focus triggers `--paw-primary` border coloring and subtle workspace ambient lighting.

---

## 4. Screen-by-Screen Layout Strategy

### A. Landing Page Design
Adapts the luxurious, high-contrast slideshow aesthetic directly from `PawConnectTheme.png` while hosting adoption platform discovery features.

```
+--------------------------------------------------------------------------------+
|  paw.                Inspiration     Browse     Adoptions     Contact      =   |
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|     *pure*                                    __  __                           |
|     cuteness.                                (  \/  ) <-- [Featured Pet       |
|                                               \    /       High-Res Cutout     |
|     02/04   A husky is active, loyal           \  /        Image Overlay]      |
|             companionship. Needs active         \/                             |
|             long walks.                                                        |
|                                                                                |
|  <------                                                                -----> |
|                                                                                |
|                            o  ●  o  o                                          |
+--------------------------------------------------------------------------------+
|  @2026 pawconnect                                                          [o] |
+--------------------------------------------------------------------------------+
```
*   **Hero Slide Grid:** Large high-fidelity pet cutout on the right side blending into the dark background, offset by typography on the left.
*   **Typography Accent:** Elegant handwritten text like `*pure*` (using font `--font-cursive` in Accent Orange) sits above the heavy lowercase title text `cuteness.` or `loyalty.` (using font `--font-accent` in bold white).
*   **Interactive Elements:** Outline arrows `<-` and `->` placed left/right of the hero display, with page counts (`02/04`) in orange/gray text and circular indicators at the bottom to trigger slide transitions.
*   **Featured Grid Section (Scroll down):** Clean 4-column React Bootstrap row displaying pet cards with filter tabs.

---

### B. Dashboard Layout
An asynchronous multi-panel view designed for listers and adopters, using tabbed navigation panels inside a clean layout.
```
+--------------------------------------------------------------------------------+
|  USER PROFILE DECK                                                             |
|  +--------------------+  [ Tabs: Active List | Applications | Incoming Messages ]|
|  | User Info Summary  |  +----------------------------------------------------+|
|  | - Bio Details      |  |  [+ Add New Pet Button]                            ||
|  | - Location Data    |  |                                                    ||
|  | - Edit Profile Btn |  |  PET DASHBOARD LIST GRID (4 Cards Wide)            ||
|  +--------------------+  |  +------------+ +------------+ +------------+       ||
|                          |  | Pet Card #1 | | Pet Card #2 | | Pet Card #3 |       ||
|                          |  +------------+ +------------+ +------------+       ||
|                          +----------------------------------------------------+|
+--------------------------------------------------------------------------------+
```
*   **Layout Structure (`Container`):** 2-Column layout.
    *   **Left Column (3 cols wide):** Sticky Profile overview card containing avatar badge, credentials list, stats numbers (Pets listed, adoptions completed).
    *   **Right Column (9 cols wide):** Tabbed component displaying tables of adoption status, active editable listings, or real-time notification alerts.

---

### C. Login Design
```
+---------------------------------------------------+
|                   [ paw. logo ]                   |
|                   Welcome back.                   |
|         +-------------------------------X+        |
|         | Email Address                  |        |
|         | [   Enter your email address   ]        |
|         | Password                       |        |
|         | [   * * * * * * * * * * * *    ]        |
|         |                                |        |
|         | [ ] Keep me logged in          |        |
|         |                                |        |
|         |   [      LOG IN BUTTON      ]  |        |
|         +--------------------------------+        |
|         Don't have an account? Sign Up            |
+---------------------------------------------------+
```
*   **Layout:** Symmetric, vertically centered grid.
*   **Visual Elements:** Set inside a card frame (`.paw-card`) with a subtle glowing orange dot header.
*   **Interactive Inputs:** Focus creates solid orange underlines and clear field highlighting, maintaining a spacious visual layout.

---

### D. Registration Design
```
+---------------------------------------------------+
|               Create your account.                |
|                    Step 1 of 2                    |
|             [=== Progress Bar 50% ===]             |
|         +--------------------------------+        |
|         | Full Name                      |        |
|         | [   Enter your full name       ]        |
|         | Mobile Number                  |        |
|         | [   Enter mobile number        ]        |
|         |                                |        |
|         |   [      NEXT STEP BTN      ]  |        |
|         +--------------------------------+        |
+---------------------------------------------------+
```
*   **Structure:** Multi-step wizard setup.
    *   Step 1: Account credentials (Name, Email, password).
    *   Step 2: Verification details (Location search input, contact preferences, profile avatar upload).
*   **Visual Indicators:** Top CSS progress bar indicating steps in orange (`--paw-primary`).

---

### E. Pet Listing Card Design
The primary item reusable throughout the search result lists, designed for quick reading and modern aesthetic consistency.
```
+--------------------------+
|  [     Pet Image      ]  | <-- High-contrast pet photo with linear bottom fade
|  +--------------------+  |
|  | Vaccinated Class   |  | <-- Rounded badges positioning overlay top-right
|  +--------------------+  |
|                          |
|  *sweet*                 | <-- Accent script text ("sweet", "playful")
|  dharama.                | <-- Bold name header with orange dot
|                          |
|  Husky  |  1.5 Years     | <-- Info metadata metrics block
|  NYC, USA                |
|                          |
|  [ VIEW PROFILE BTN ]    |
+--------------------------+
```
*   **Aspect Ratio:** Image matches `4:3` square container, showing a linear dark fade overlay (`linear-gradient(to top, #141414 0%, transparent 40%)`) so name elements and details sit clearly on user cards.
*   **Top Tags:** Floating pill badges overlaying the top corner indicating status (e.g., `Vaccinated` in green-outline, `New` in orange).

---

### F. Pet Detail Page Design
```
+--------------------------------------------------------------------------------+
|  < Back to listings                                                            |
|                                                                                |
|  +-----------------------------------+  +-----------------------------------+  |
|  |     ACTIVE PET LIGHTBOX IMAGE     |  |  *gentle*                         |  |
|  |                                   |  |  cookie.                          |  |
|  |                                   |  |                                   |  |
|  |                                   |  |  Breed: Golden Retriever          |  |
|  |  +---+ +---+ +---+                |  |  Age: 8 Months                    |  |
|  |  |   | |   | |   |                |  |  Vaccines: Fully Verified         |  |
|  |  +---+ +---+ +---+                |  |  Location: Brooklyn, NY           |  |
|  |  (Thumbnails Row)                 |  |                                   |  |
|  +-----------------------------------+  |  [ ADOPT ME ]  [ INITIATE CHAT ]  |  |
|                                         +-----------------------------------+  |
+--------------------------------------------------------------------------------+
```
*   **Left Section (7 cols wide):** Large high-resolution media viewer with vertical scrolling thumbnail selectors.
*   **Right Section (5 cols wide):** Sticky action column. Features the cursive emotional tag (`*gentle*`) above the pet's name, followed by structured specification rows (Vaccine status, size details) and core call-to-action buttons (`Adopt Me` / `Chat with Owner`).

---

### G. User Profile Design
*   **Layout:** Two-column profile dashboard.
*   **Details Panel:** Simple form fields for contact updates. Below sits a photo collection component showcasing previously listed pets, showing history tabs for active adoptions and verified credentials.

---

### H. Chat Screen Design
Inspired by slack/messenger frameworks to manage rapid responses and details alignment.
```
+--------------------------------------------------------------------------------+
|  MESSAGES                                                                      |
|  +-----------------------------+----------------------------------------------+ |
|  | ACTIVE CHATS SEARCH         |  [Header: Chatting about Cookie (Retriever)]  | |
|  | [   Search conversation  ]  |                                              | |
|  |                             |  (A) Adopter: Is Cookie trained?             | |
|  | User: Sarah (Cookie)  ●     |                                              | |
|  | User: Alex (Max)            |  (B) Lister: Yes, fully housebroken.         | |
|  |                             |                                              | |
|  |                             |  +----------------------------------------+  | |
|  |                             |  | Enter message detail description...    |  | |
|  +-----------------------------+----------------------------------------------+ |
+--------------------------------------------------------------------------------+
```
*   **Left Pane (4 cols wide):** Scrollable conversation lists displaying user icons, names, and active pet listing references. Active rooms show an orange bullet indicator.
*   **Right Pane (8 cols wide):** Current discussion block. Submissions generate clean UI dialog bubbles. System incorporates user context headers highlighting pet summaries at the top.

---

### I. Notification Panel
*   **Layout:** Interactive fly-out sidebar sliding from screen-right when notifications icon gets clicked.
*   **Design elements:** Muted grey cards indicating event types (e.g. "Sarah requested adoption details on Cookie!"). Highlight icons matching categories (Message = Blue, Adoption = Orange, System Alert = Red).

---

### J. Admin Dashboard Design
```
+--------------------------------------------------------------------------------+
|  VETTING DASHBOARD OVERVIEW                                                    |
|  +-------------------+  +-------------------+  +-------------------+           |
|  | Listings: 1,420   |  | Pending Vetting: 8|  | Flagged Scams: 3  |           |
|  +-------------------+  +-------------------+  +-------------------+           |
|                                                                                |
|  SYSTEM REVIEW WORKLIST QUEUE                                                  |
|  +--------------------------------------------------------------------------+  |
|  | PET IMAGE  | NAME   | BREED PREDICTED  | FRAUD SCORE | ACTION TRIGGERS   |  |
|  +------------+--------+------------------+-------------+-------------------+  |
|  | [Image]    | Rex    | German Shepherd  | 0.08 (Low)  | [OK] [Flag] [Ban] |  |
|  +--------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------+
```
*   **Statistical Header:** Dynamic count grid showing active items.
*   **Review Rows:** Layout displaying uploaded pet image, user-selected fields vs AI-predicted fields, computed AI fraud anomaly risk rating, and vetting choices.

---

## 5. Layout Adaptability & Grid Specs

### A. Mobile Layout (<= 576px)
*   **Containers:** Flat `16px` padding (fluid width).
*   **Navbar:** Compact, brand left, hamburger menu right.
*   **Landing Page Carousel:** Content transforms vertically. Headline size shifts to `.display-4`. Image sits stacked below the title text blocks.
*   **Grids (Browse / Dashboards):** All cards scale to full width (`Col` spans the full `12` columns).

### B. Tablet Layout (576px - 992px)
*   **Containers:** `5%` left/right margin limits.
*   **Grid layout:** Search lists adapt to a 2-column dashboard layout structure.
*   **Modals:** Layout scale triggers fullscreen viewports to simplify content viewing on smaller touch interfaces.

### C. Desktop Layout (>= 992px)
*   **Containers:** Fixed `8%` left/right spacing context.
*   **Sidebar layout:** Sticky side filter columns on search sheets, floating chat panels.
*   **Grid ratios:** Detailed 3 or 4 column grids displaying complete lists.

---

## 6. React Bootstrap Component Hierarchy

Below is the concrete hierarchy mapping pages directly to React Bootstrap tags.

```
LandingPage (bg-dark)
  ├── Container
  │     ├── Row (Navbar block)
  │     │     └── Col
  │     │           └── Navbar (bg-transparent, navbar-dark)
  │     │                 ├── Navbar.Brand ("paw.")
  │     │                 └── Navbar.Toggle
  │     └── Row (Hero block with cutout image)
  │           ├── Col (lg={7}) (Left copywriting + carousel controls)
  │           │     ├── Div (cursive label)
  │           │     ├── H1 (display-1, fw-bold: "cuteness.")
  │           │     └── Div (carousel controls & slide number badges)
  │           └── Col (lg={5}) (Right cutout pet photo display)

SearchPage
  ├── Container (py-5)
  │     ├── Row
  │     │     ├── Col (lg={3}) (Side sticky filters panel)
  │     │     │     └── Card (paw-card)
  │     │     │           └── Form (Inputs, SelectDropdowns)
  │     │     └── Col (lg={9}) (Result listings grid)
  │     │           ├── Row (g-4)
  │     │           │     └── Col (md={6}, lg={4})
  │     │           │           └── Card (paw-card)
  │     │           │                 ├── Card.Img
  │     │           │                 └── Card.Body (Name, details metadata)
  │     │           └── Row (Pagination indicators)

DashboardPage
  ├── Container (py-5)
  │     ├── Row
  │     │     ├── Col (lg={3}) (Sticky Profile column)
  │     │     │     └── Card (user-card)
  │     │     └── Col (lg={9}) (Management workspace column)
  │     │           └── Tabs (activeKey, fill, class="paw-tabs")
  │     │                 ├── Tab (title="My Listings")
  │     │                 │     ├── Button (btn-paw-primary, icon="+")
  │     │                 │     └── Table (table-dark, hover)
  │     │                 ├── Tab (title="Adoptions")
  │     │                 └── Tab (title="Settings")

ChatPage
  ├── Container (fluid, py-0)
  │     ├── Row (h-100)
  │           ├── Col (lg={4}, class="border-end") (Thread selection columns)
  │           │     ├── Form.Control (Search box)
  │           │     └── ListGroup (variant="flush")
  │           │           └── ListGroup.Item (Profile icons and active indicators)
  │           └── Col (lg={8}) (Conversation delivery viewport)
  │                 ├── Div (Conversation scroll list)
  │                 └── Form (Bottom attachment input tools)

AdminPage
  ├── Container (py-4)
        ├── Row (Summary card charts stats)
        │     ├── Col (md={4})
        │     │     └── Card (bg-dark)
        │     └── Col (md={4})
        └── Row (Vetting list panel)
              └── Col
                    └── Card (paw-card)
                          └── Table (responsive, table-dark)
```
