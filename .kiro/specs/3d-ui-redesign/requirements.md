# Requirements Document

## Introduction

This feature redesigns the Finance Tracker application's UI with a cohesive 3D design system. The existing app (React + TypeScript + Tailwind CSS + Supabase) has partial 3D CSS classes already defined in `index.css`, but the pages and components are inconsistently styled — some still use flat light-mode classes. The goal is to unify all UI surfaces under a single, immersive 3D dark-theme design language: depth through layered shadows, glassmorphism cards, extruded buttons, inset inputs, and subtle motion — while preserving full accessibility and performance.

The redesign covers:
- The global design token system (Tailwind config + CSS custom properties)
- UI primitives: Button, Card, Input, Modal
- Feature components: TransactionList, AddTransactionModal
- Pages: Dashboard, Login, Signup
- Loading and empty states
- Accessibility and reduced-motion support

---

## Glossary

- **Design_System**: The set of Tailwind tokens, CSS utility classes, and component conventions that define the 3D visual language.
- **Button**: The `Button` React component in `src/components/ui/Button.tsx`.
- **Card**: The `Card` React component in `src/components/ui/Card.tsx`.
- **Input**: The `Input` React component in `src/components/ui/Input.tsx`.
- **Modal**: The `Modal` React component in `src/components/ui/Modal.tsx`.
- **TransactionList**: The `TransactionList` React component in `src/components/TransactionList.tsx`.
- **AddTransactionModal**: The `AddTransactionModal` React component in `src/components/AddTransactionModal.tsx`.
- **Dashboard**: The `Dashboard` page in `src/pages/Dashboard.tsx`.
- **Login**: The `Login` page in `src/pages/Login.tsx`.
- **Signup**: The `Signup` page in `src/pages/Signup.tsx`.
- **Stat_Card**: A summary card on the Dashboard displaying a single financial metric (balance, income, or expenses).
- **Transaction_Item**: A single row in the TransactionList representing one transaction.
- **Type_Toggle**: The Expense / Income selector inside AddTransactionModal.
- **Depth_Shadow**: A multi-layer `box-shadow` that simulates a surface raised above the background.
- **Inset_Shadow**: A `box-shadow` with a negative spread that simulates a surface pressed into the background.
- **Glassmorphism**: A visual style combining a semi-transparent background, `backdrop-filter: blur`, and a subtle border to simulate frosted glass.
- **Reduced_Motion**: The `prefers-reduced-motion: reduce` CSS media query, used to disable or minimise animations for users who have requested it.
- **WCAG_AA**: Web Content Accessibility Guidelines 2.1 Level AA contrast and interaction requirements.

---

## Requirements

### Requirement 1: Design Token System

**User Story:** As a developer, I want a single source of truth for all 3D design tokens, so that every component uses consistent colours, shadows, radii, and transitions without duplicating values.

#### Acceptance Criteria

1. THE Design_System SHALL define a dark base palette in `tailwind.config.js` using CSS custom properties for background layers (`--color-surface-0` through `--color-surface-3`), accent blue, success green, and danger red.
2. THE Design_System SHALL expose Tailwind utility aliases (`shadow-raise-sm`, `shadow-raise-md`, `shadow-raise-lg`, `shadow-inset`) that map to the multi-layer Depth_Shadow and Inset_Shadow values.
3. THE Design_System SHALL define a single `transition-3d` utility that applies `transition: transform 150ms ease-out, box-shadow 150ms ease-out, opacity 150ms ease-out`.
4. WHEN the `prefers-reduced-motion: reduce` media query is active, THE Design_System SHALL override all transition durations to `0ms` and disable transform-based animations.
5. THE Design_System SHALL define border-radius tokens (`rounded-surface` = 16px, `rounded-control` = 10px, `rounded-pill` = 9999px) used consistently across all components.

---

### Requirement 2: Button Component

**User Story:** As a user, I want buttons that visually "pop out" from the surface so that interactive controls are immediately recognisable and satisfying to press.

#### Acceptance Criteria

1. THE Button SHALL render with a Depth_Shadow (`shadow-raise-md`) and a top-edge highlight (`inset 0 1px 0 rgba(255,255,255,0.18)`) to simulate a raised surface.
2. WHEN the cursor hovers over the Button, THE Button SHALL translate upward by 2px and increase its Depth_Shadow to `shadow-raise-lg` within 150ms.
3. WHEN the Button is in the active (pressed) state, THE Button SHALL translate downward by 1px and apply an Inset_Shadow to simulate being pushed in.
4. WHEN the Button `disabled` prop is true, THE Button SHALL render at 40% opacity and SHALL NOT apply hover or active transforms.
5. THE Button SHALL support `variant` values of `primary` (blue gradient), `secondary` (slate gradient), `danger` (red gradient), and `ghost` (transparent with border).
6. THE Button SHALL support `size` values of `sm`, `md`, and `lg` with minimum touch target sizes of 32px, 40px, and 48px height respectively.
7. THE Button SHALL expose a `loading` boolean prop; WHEN `loading` is true, THE Button SHALL render a spinner icon in place of children and set `aria-busy="true"`.
8. THE Button SHALL maintain a minimum contrast ratio of 4.5:1 between label text and button background for all variants, in compliance with WCAG_AA.

---

### Requirement 3: Card Component

**User Story:** As a user, I want content panels that appear to float above the background so that information hierarchy is clear at a glance.

#### Acceptance Criteria

1. THE Card SHALL render with a Glassmorphism background (`bg-white/8 backdrop-blur-xl`), a 1px border at `rgba(255,255,255,0.12)`, and a Depth_Shadow (`shadow-raise-md`).
2. THE Card SHALL support a `variant` prop with values `default` (neutral surface) and `stat` (coloured accent glow matching the stat type: blue for balance, green for income, red for expense).
3. WHEN the `variant` is `stat`, THE Card SHALL render a coloured ambient glow via an additional `box-shadow` layer using the accent colour at 15% opacity.
4. THE Card SHALL support `padding` values of `sm` (16px), `md` (24px), and `lg` (32px).
5. THE Card SHALL NOT apply hover transforms by default; WHEN a `hoverable` boolean prop is true, THE Card SHALL translate upward by 4px on hover.

---

### Requirement 4: Input Component

**User Story:** As a user, I want form fields that look recessed into the surface so that I can clearly distinguish editable areas from static content.

#### Acceptance Criteria

1. THE Input SHALL render with an Inset_Shadow (`shadow-inset`), a semi-transparent dark background (`bg-black/20`), and a 1px border at `rgba(255,255,255,0.12)`.
2. WHEN the Input receives focus, THE Input SHALL transition its border colour to the accent blue and add an outer glow (`0 0 0 3px rgba(59,130,246,0.35)`) within 150ms.
3. WHEN the `error` prop is set, THE Input SHALL render its border in danger red and display the error message below the field in danger red text at 14px.
4. THE Input SHALL render an associated `<label>` element with `htmlFor` pointing to the input's `id` when the `label` prop is provided.
5. THE Input SHALL support a `leftIcon` prop; WHEN provided, THE Input SHALL render the icon inside the left padding of the field and adjust the text padding to prevent overlap.
6. THE Input SHALL maintain a minimum contrast ratio of 4.5:1 between placeholder text and input background in compliance with WCAG_AA.

---

### Requirement 5: Modal Component

**User Story:** As a user, I want dialogs that emerge from the background with depth so that I understand I am in a focused interaction context.

#### Acceptance Criteria

1. WHEN `isOpen` transitions from false to true, THE Modal SHALL animate in by scaling from 0.95 to 1.0 and fading from opacity 0 to 1 over 200ms using a spring-like easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
2. WHEN `isOpen` transitions from true to false, THE Modal SHALL animate out by scaling to 0.95 and fading to opacity 0 over 150ms.
3. THE Modal SHALL render a backdrop with `bg-black/50 backdrop-blur-sm`; WHEN the backdrop is clicked, THE Modal SHALL call `onClose`.
4. THE Modal content panel SHALL use Glassmorphism styling consistent with the Card component and a Depth_Shadow of `shadow-raise-lg`.
5. THE Modal SHALL trap keyboard focus within the dialog while open, and SHALL restore focus to the previously focused element when closed.
6. THE Modal SHALL render with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title element.
7. WHEN the Escape key is pressed while the Modal is open, THE Modal SHALL call `onClose`.

---

### Requirement 6: TransactionList Component

**User Story:** As a user, I want each transaction row to feel like a physical card I can interact with so that the list is engaging and easy to scan.

#### Acceptance Criteria

1. THE TransactionList SHALL render each Transaction_Item as a Glassmorphism surface with a Depth_Shadow (`shadow-raise-sm`) and `rounded-control` border radius.
2. WHEN the cursor hovers over a Transaction_Item, THE Transaction_Item SHALL translate right by 2px and increase its Depth_Shadow to `shadow-raise-md` within 150ms.
3. THE Transaction_Item SHALL display the category icon container as a circular badge with a coloured ambient glow matching the category colour at 20% opacity.
4. THE Transaction_Item SHALL display the transaction amount in green (`+`) for income and red (`-`) for expenses, with a font weight of 700.
5. WHEN the TransactionList contains zero transactions, THE TransactionList SHALL render an empty-state illustration (icon + heading + subtext) centred within the list area.
6. THE TransactionList SHALL render a delete button per Transaction_Item using the `danger` Button variant; WHEN clicked, THE TransactionList SHALL display a confirmation before calling `onDelete`.

---

### Requirement 7: AddTransactionModal Component

**User Story:** As a user, I want the transaction form to feel cohesive with the 3D design system so that adding a transaction is a smooth, visually consistent experience.

#### Acceptance Criteria

1. THE AddTransactionModal SHALL use the Modal component for its container, inheriting all Modal accessibility and animation requirements.
2. THE Type_Toggle SHALL render as two adjacent buttons using the Button component; WHEN `expense` is selected, THE Type_Toggle SHALL apply the `danger` variant to the active button; WHEN `income` is selected, THE Type_Toggle SHALL apply the `primary` variant to the active button; the inactive button SHALL use the `ghost` variant.
3. THE AddTransactionModal SHALL use the Input component for all text and number fields, and a styled `<select>` element consistent with the Input visual style (same background, border, inset shadow, and focus ring) for the category field.
4. THE AddTransactionModal SHALL use a `<textarea>` styled consistently with the Input component for the Notes field.
5. WHEN a form submission error occurs, THE AddTransactionModal SHALL display the error in a styled alert surface using the danger colour palette.
6. WHEN the form is submitting, THE AddTransactionModal SHALL disable all inputs and show the `loading` state on the submit Button.

---

### Requirement 8: Dashboard Page

**User Story:** As a user, I want the dashboard to feel like a premium financial cockpit so that I am motivated to engage with my financial data.

#### Acceptance Criteria

1. THE Dashboard SHALL render a full-viewport dark background using the `--color-surface-0` token with a subtle radial gradient overlay to add depth.
2. THE Dashboard SHALL render a sticky header using Glassmorphism styling with a bottom border at `rgba(255,255,255,0.08)` and a `shadow-raise-sm` shadow.
3. THE Dashboard header SHALL display the app logo icon, app name as gradient text, the authenticated user's email, and a sign-out button.
4. THE Dashboard SHALL render three Stat_Cards in a responsive grid (1 column on mobile, 3 columns on tablet and above), each using the `stat` Card variant with the appropriate accent colour.
5. WHEN financial data is loading, THE Dashboard SHALL render three Stat_Card skeleton placeholders and a transaction list skeleton using a pulsing animation.
6. THE Dashboard SHALL render the TransactionList inside a Card with a header row containing the section title and the "Add Transaction" Button.
7. WHEN the "Add Transaction" Button is clicked, THE Dashboard SHALL open the AddTransactionModal.

---

### Requirement 9: Login Page

**User Story:** As a user, I want the login screen to feel immersive and trustworthy so that I feel confident entering my credentials.

#### Acceptance Criteria

1. THE Login SHALL render a full-viewport background matching the Dashboard background token for visual continuity.
2. THE Login SHALL render the sign-in form inside a Card centred on the viewport, with a maximum width of 448px.
3. THE Login Card SHALL display the app logo icon with a blue ambient glow, the app name as gradient text, and a subtitle.
4. THE Login SHALL use the Input component for the email and password fields.
5. WHEN a sign-in error occurs, THE Login SHALL display the error in a styled alert surface using the danger colour palette.
6. WHEN the form is submitting, THE Login SHALL show the `loading` state on the submit Button and disable all inputs.
7. THE Login SHALL render a link to the Signup page; WHEN clicked, THE Login SHALL call `onToggleAuth`.

---

### Requirement 10: Signup Page

**User Story:** As a user, I want the signup screen to match the login screen's design so that the onboarding flow feels consistent.

#### Acceptance Criteria

1. THE Signup SHALL apply the same full-viewport background, Card layout, logo, and gradient text treatment as the Login page.
2. THE Signup SHALL use the Input component for the email, password, and confirm-password fields.
3. WHEN the submitted passwords do not match, THE Signup SHALL display a danger alert without submitting to the server.
4. WHEN account creation succeeds, THE Signup SHALL replace the form with a success state: a green-glowing logo icon, a confirmation heading, and a "Go to Sign In" Button.
5. WHEN a server error occurs during signup, THE Signup SHALL display the error in a styled danger alert surface.
6. WHEN the form is submitting, THE Signup SHALL show the `loading` state on the submit Button and disable all inputs.

---

### Requirement 11: Accessibility

**User Story:** As a user with a disability, I want the redesigned UI to remain fully operable so that I can manage my finances without barriers.

#### Acceptance Criteria

1. THE Design_System SHALL ensure all interactive elements have a visible focus indicator with a minimum 3px outline in the accent blue colour.
2. WHEN the `prefers-reduced-motion: reduce` media query is active, THE Design_System SHALL disable all CSS animations and transitions with duration greater than 0ms.
3. THE Design_System SHALL ensure all text elements meet a minimum contrast ratio of 4.5:1 against their background in compliance with WCAG_AA.
4. THE Design_System SHALL ensure all interactive elements have a minimum touch target size of 44×44px in compliance with WCAG_AA success criterion 2.5.5.
5. THE Modal SHALL implement focus trapping so that keyboard navigation does not leave the dialog while it is open.
6. THE TransactionList delete confirmation SHALL be implemented as a native `window.confirm` dialog or an accessible inline confirmation, not a silent action.

---

### Requirement 12: Performance

**User Story:** As a user on a mid-range device, I want the 3D effects to render smoothly so that the interface does not feel sluggish.

#### Acceptance Criteria

1. THE Design_System SHALL restrict animated properties to `transform` and `opacity` only, so that the browser can promote animated elements to their own compositor layer without triggering layout or paint.
2. THE Design_System SHALL NOT use CSS `filter: blur` on elements that animate, to avoid GPU overdraw on low-end devices.
3. WHEN `backdrop-filter` is applied to a Glassmorphism surface, THE Design_System SHALL limit the number of simultaneously blurred surfaces visible on screen to a maximum of 4 to avoid compositing cost.
4. THE Design_System SHALL NOT define any animation with a duration greater than 400ms, to keep interactions feeling responsive.
