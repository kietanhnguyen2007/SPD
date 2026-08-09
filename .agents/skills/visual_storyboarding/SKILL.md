---
name: visual_storyboarding
description: Translate dry logic or features into a scene-by-scene visual storyboard. Make sure to use this skill whenever the user asks to map out a user flow, design a UI transition, or visualize how a feature actually looks on screen.
---

# Visual Storyboarding: Translating Logic into Temporal Interface Choreography

## Core Philosophy & Critical Understanding

Features described in text specifications, PRDs, or user stories are fundamentally static abstractions. When product managers, engineers, or designers read bullet points like *"User uploads file and views generated report"*, they inevitably construct conflicting, incomplete mental models regarding layout hierarchy, timing, micro-feedback, and edge states. Abstract specifications mask visual friction, missing state transitions, layout jumpiness, and cognitive overload.

**Visual Storyboarding** is the practice of temporal interface choreography. It transforms static logic into a frame-by-frame visual and spatial timeline. It forces the system architect to think not just about *what* the system does, but *how the interface morphs through space and time* as human intent meets system response.

### Key Principles of Temporal Interface Storyboarding

1. **Spatial Continuity**: UI elements do not materialize out of thin air. Interfaces must maintain spatial anchor points (e.g., a primary button expanding into a modal container, a list item shrinking into a toast notification) to preserve user orientation and spatial awareness.
2. **Tripartite Scene Synchronization (Visual + Action + Text)**: Every frame must explicitly synchronize three distinct operational layers:
   - **Visual Blueprint**: What the human eye beholds (viewport grid, spatial hierarchy, active states, component geometry).
   - **Action & Trigger Physics**: What physical action the user performs or what asynchronous trigger the system executes (click velocity, drag vectors, WebSocket pushes, API state resolutions).
   - **Text & Microcopy**: What the brain reads and interprets (headings, button labels, validation feedback, status pills, screen reader announcements).
3. **State Delta Awareness**: The space between frames is as important as the frames themselves. Storyboards must capture loading states, optimistic updates, skeleton shimmers, validation errors, and state mutations.
4. **Cognitive Momentum**: Each scene must communicate clear visual affordances—guiding the user's focus naturally toward the next action without visual noise, ambiguity, or cognitive friction.

---

## Execution Strategy: Step-by-Step Storyboarding Methodology

When tasked with storyboarding a feature, UI transition, or user journey, adopt the mindset of a cinematic UI Director. Execute the following 5-phase workflow:

### Phase 1: Boundary & Goal Definition
- Identify the **Entry Trigger** (e.g., user clicks CTA, system receives webhook, push notification tapped).
- Define the **Target Milestone** (e.g., order confirmed, dataset mapped, team invited, clause approved).
- Determine the minimum sufficient frames (typically 3 to 6 main scenes) required to visualize the core state transformations without skipping critical micro-interactions.

### Phase 2: Spatial Blueprinting (The Visual Layer)
For each scene, construct a precise visual model of the viewport (mobile screen, desktop application, tablet layout, modal overlay, or slide-over drawer):
- Define grid layout and structural containers (sidebars, hero panels, sticky footers, floating action bars).
- Specify component states (default, active, focused, disabled, hovered, loading, success, error).
- Detail visual hierarchy: primary focal point, secondary data cards, background muted elements.
- Incorporate visual feedback cues (e.g., glowing borders, skeleton loader pulses, status badges).

### Phase 3: Action & Trigger Choreography (The Action Layer)
- Identify the exact trigger type:
  - **Direct Human Action**: Click, tap, double-click, long-press, drag-and-drop, key combination, pinch-zoom, swipe gesture.
  - **Automated System Event**: API payload resolution, WebSocket state change, validation debouncing, timer expiration, background worker completion.
- Specify transition physics: slide-in directions, scale transformations, opacity fades, duration (ms), and easing curves.

### Phase 4: Copy & Microcopy Specification (The Text Layer)
- Draft precise on-screen copy: headers, body prompts, field placeholders, button labels, badge counters, tooltips, toast notifications, error banners.
- Ensure microcopy uses active, unambiguous verbs and maintains tone consistency.

### Phase 5: Exception & Boundary State Mapping
- Always account for non-happy paths: network latency delays, empty query results, inline validation errors, permission denials. Include alternative sub-scenes when appropriate.

---

## Required Output Architecture

When generating a visual storyboard, strictly adhere to the following Markdown architecture:

```markdown
# Storyboard: [Feature / User Journey Name]

## Journey Overview
- **Primary Goal**: [Core objective of the user flow]
- **Target Persona**: [User persona / role]
- **Entry Trigger**: [Action or event initiating the sequence]
- **Success Resolution**: [Final state achieved upon flow completion]

---

## Scene Sequence

### Scene 1: [Scene Title]
- **Visual Blueprint**: [Detailed breakdown of viewport grid, UI components, layout placement, visual hierarchy, and active states]
- **Action & Trigger**: [User input or system event initiating state changes]
- **Text & Microcopy**: [Exact copy for headings, buttons, field labels, tooltips, and helper text]
- **Behind-the-Scenes & State Delta**: [Backend logic, state mutations, loading behavior, or animations transitioning to the next scene]

### Scene 2: [Scene Title]
...

---

## Edge Case & Failure Mode Storyboards
### Scene [X.A]: [Error / Edge Case Title]
- **Trigger**: [Condition triggering the edge case]
- **Visual & Copy Adjustment**: [UI mutations, error banners, field highlights, recovery CTAs]
- **Recovery Path**: [Action taking the user back to the main flow]

---

## Developer & Designer Handoff Notes
- **Animation Specs**: [CSS/Framer Motion specs, easing curves, transition durations]
- **Accessibility & ARIA**: [Screen reader announcements, focus management, keyboard navigation routes]
- **State Hooks**: [Key local/global state variables required]
```

---

## Critical Guidelines & Constraints

- **Avoid Vague Visual Descriptions**: Never use ambiguous phrases like "A modal appears" or "The page updates". Specify exact positions, dimensions, overlays, and animation vectors (e.g., "A centered 560px modal overlay fades in over a 40% black backdrop with a subtle drop-shadow (blur: 24px)").
- **Never Skip Intermediate States**: Always illustrate intermediate states like button spinners, skeleton shimmers, upload progress bars, or optimistic UI updates.
- **Maintain Layout & Anchor Consistency**: Ensure persistent layout elements (navbars, sidebars, page titles) remain anchored across scenes so the user understands the context of visual changes.
- **Distinguish Human Actions from System Triggers**: Clearly demarcate deliberate user inputs from asynchronous background jobs or automated UI debouncing.
- **Design for High Contrast & Explicit Affordances**: Ensure text copy explicitly details microcopy contrast, badge counts, and active vs inactive tab states.

---

## Comprehensive Case Studies & Examples

### Case Study 1: AI-Powered Legal Document Clause Extraction

#### Journey Overview
- **Primary Goal**: Upload a multi-page PDF contract, execute automated clause extraction, review flagged high-risk clauses, and export structured data.
- **Target Persona**: Legal Operations Specialist.
- **Entry Trigger**: User clicks "New Clause Analysis" on the workspace dashboard.
- **Success Resolution**: Reviewed clauses approved and synced to Contract Lifecycle Management (CLM) system.

#### Scene Sequence

##### Scene 1: Document Upload & Dropzone Activation
- **Visual Blueprint**: Centered 600px canvas card featuring a dashed indigo drop zone border (`#4F46E5`). Inside: animated document icon with upward pulsing arrow, "Drag & Drop PDF or DOCX" heading, max file size label (50MB), and a secondary "Browse Files" outline button. Background shows dimmed dashboard table.
- **Action & Trigger**: User drags a file named `Master_Services_Agreement_2026.pdf` over the drop zone.
- **Text & Microcopy**: Header: "Upload Contract for Analysis". Subtext: "Supports PDF, DOCX up to 50MB". CTA: "Browse Files". Hover toast: "Drop file to initiate AI processing".
- **Behind-the-Scenes & State Delta**: On drag enter, border shifts from dashed gray to solid indigo with 10% indigo background tint; drop zone scales up 2% on hover.

##### Scene 2: Asynchronous Parsing & Streaming AI Extraction Progress
- **Visual Blueprint**: Drop zone morphs into a file progress card showing file name, 14.2 MB size pill, linear progress bar at 68%, and animated page thumbnail preview strip scanning left to right with a laser beam effect. Below: live streaming extraction log counter ("14 Clauses Identified... 3 High Risk Flagged").
- **Action & Trigger**: System processing file via background OCR & LLM extraction API. User observes progress; "Cancel" text button visible at top right.
- **Text & Microcopy**: Progress label: "Analyzing legal terms and risk compliance... 68%". Counter: "14 Clauses Extracted". Cancellation CTA: "Cancel Processing".
- **Behind-the-Scenes & State Delta**: File payload streamed via WebSocket. Progress bar smooths via CSS `transition: width 300ms ease-in-out`. When complete, view auto-transitions to split review canvas.

##### Scene 3: Dual-Pane Interactive Clause Review Canvas
- **Visual Blueprint**: 50/50 split-screen layout. Left pane: PDF viewer displaying contract page 4 with highlighted yellow bounding box around Section 8.2 (Indemnification). Right pane: Scrollable clause inspection cards. Active card has an amber risk badge ("High Risk: Unlimited Liability"), editable text area containing extracted text, confidence score badge ("98% AI Confidence"), and twin action buttons: "Accept" (green check) and "Edit Clause" (pencil icon).
- **Action & Trigger**: User clicks on the amber "High Risk" card in the right pane.
- **Text & Microcopy**: Left pane toolbar: "Page 4 of 28". Right pane card header: "Section 8.2 — Indemnification Clause". Risk pill: "High Risk: Unlimited Liability". Button labels: "Accept Clause", "Override Text", "Flag for Partner Review".
- **Behind-the-Scenes & State Delta**: Clicking the card triggers auto-scroll on the left PDF viewer to page 4 with a 400ms smooth camera scroll, bringing Section 8.2 into vertical center alignment with a pulsing border highlight.

##### Scene 4: Confirmation & CLM Export Sync
- **Visual Blueprint**: Top banner slides down showing "All 14 clauses reviewed (12 Accepted, 2 Overridden)". Bottom sticky action bar reveals a primary green "Approve & Sync to CLM" button alongside a secondary "Export JSON/CSV" menu button.
- **Action & Trigger**: User clicks "Approve & Sync to CLM".
- **Text & Microcopy**: Banner: "Review Complete — 100% of risk items verified". Primary CTA: "Approve & Sync to CLM". Toast alert: "Contract MSA_2026.pdf successfully synced to Salesforce CLM."
- **Behind-the-Scenes & State Delta**: Button transforms into a checkmark icon with confetti explosion effect, modal closes, workspace table row updates status from "Pending" to "Approved" with green pill badge.

---

### Case Study 2: Mobile E-Commerce One-Click Checkout with Biometric Step-Up

#### Journey Overview
- **Primary Goal**: Complete checkout on a mobile device for a $1,200 purchase with instant 3D Secure biometric confirmation.
- **Target Persona**: Mobile Shopper.
- **Entry Trigger**: User taps "Express Checkout with Apple Pay / Biometrics" in shopping bag.
- **Success Resolution**: Payment authorized, order ID generated, visual delivery tracker initiated.

#### Scene Sequence

##### Scene 1: Sticky Bag Summary & One-Click Sheet Trigger
- **Visual Blueprint**: Mobile screen (390x844px). Top 40%: Product thumbnail (High-End Headphones), price tag ($1,200.00), quantity counter. Bottom 60%: Glassmorphic slide-up bottom sheet displaying pre-filled shipping address (123 Market St), saved payment card (Visa •••• 4242), dynamic shipping speed toggle ("Express - Delivered Tomorrow by 10 AM"), and prominent black "Pay $1,248.00 with FaceID" button.
- **Action & Trigger**: User taps "Pay $1,248.00 with FaceID".
- **Text & Microcopy**: Header: "Quick Checkout". Address subtext: "Deliver to Home (Default)". CTA: "Double Click to Pay — $1,248.00".
- **Behind-the-Scenes & State Delta**: Tapping button triggers native OS biometric modal overlay; background dims to 60% blur.

##### Scene 2: Biometric Verification Modal Overlay
- **Visual Blueprint**: Native iOS system sheet overlays lower half. Central blue/purple vector icon of FaceID scanning camera with radial sonar rings pulsing outward. Text below reads "Verifying Biometrics... Hold Still".
- **Action & Trigger**: Front-facing camera scans user face; OS emits success haptic feedback.
- **Text & Microcopy**: System text: "Face ID for Store Pay". Prompt: "Pay Merchant $1,248.00". Success text: "Done".
- **Behind-the-Scenes & State Delta**: Upon biometric match, authorization token is dispatched to payment gateway API; bottom sheet shows inline spinning ring overlay.

##### Scene 3: Optimistic Order Creation & Delivery Tracking Canvas
- **Visual Blueprint**: Sheet slides down, full screen morphs into order confirmation view. Top section: Green checkmark animation bursting into subtle confetti, order reference `#ORD-99201`. Middle section: Vector map graphic showing route from warehouse to user zip code with animated delivery truck icon. Bottom section: "Add to Apple Wallet" card and "Track Order" button.
- **Action & Trigger**: System auto-loads confirmation view; user taps "Add to Apple Wallet".
- **Text & Microcopy**: Header: "Order Confirmed!". Subtext: "Estimated Delivery: Tomorrow, 10:00 AM via Express Flight". CTA: "Add Pass to Apple Wallet".
- **Behind-the-Scenes & State Delta**: Confirmation email dispatched asynchronously; push notification permission dialog requested after 1.5 seconds.

---

### Case Study 3: Real-Time Collaborative Vector Editor Branch Merge

#### Journey Overview
- **Primary Goal**: Resolve visual design conflicts between two feature branches in a web-based collaborative canvas editor.
- **Target Persona**: UI/UX Designer.
- **Entry Trigger**: User clicks "Merge Branch 'Feature/Dark-Mode' into 'Main'".
- **Success Resolution**: Conflicts resolved, branch merged into Main, live collaborator cursors updated.

#### Scene Sequence

##### Scene 1: Conflict Alert Banner & Differential Split View Initiation
- **Visual Blueprint**: Top editor toolbar displays amber notification bar: "3 Design Conflicts Detected between Branch 'Dark-Mode' and 'Main'". Primary button: "Resolve Conflicts in Split Canvas". Editor workspace dims.
- **Action & Trigger**: User clicks "Resolve Conflicts in Split Canvas".
- **Text & Microcopy**: Amber Bar: "Cannot auto-merge branch 'Feature/Dark-Mode'". Action CTA: "Launch Visual Diff Tool".
- **Behind-the-Scenes & State Delta**: Canvas camera zooms out smoothly (300ms cubic-bezier) and splits viewport into two parallel artboards side by side.

##### Scene 2: Visual Diff Overlay & Property Inspection
- **Visual Blueprint**: Left artboard (`Main`): Hero Card button displayed in Royal Blue (`#2563EB`) with 8px radius. Right artboard (`Dark-Mode`): Hero Card button displayed in Neon Cyan (`#06B6D4`) with 16px radius. Overlay highlight: Red tinted bounding box on Left, Green tinted bounding box on Right. Floating central control widget displays radio choice: "Keep Main (#2563EB)" vs "Use Branch (#06B6D4)".
- **Action & Trigger**: User selects radio button for "Use Branch (#06B6D4)" and clicks "Apply Selection".
- **Text & Microcopy**: Central Widget Header: "Conflict 1 of 3: Primary CTA Background Color & Radius". Option A: "Main Branch: Royal Blue / 8px". Option B: "Feature Branch: Neon Cyan / 16px". CTA: "Accept Selected Property".
- **Behind-the-Scenes & State Delta**: Selecting Option B instantly morphs the left artboard to match Neon Cyan/16px radius with a pulse glow effect; conflict counter decrements from 3 to 2.

##### Scene 3: Final Merge Resolution & Live Cursor Sync
- **Visual Blueprint**: Split view collapses back to single full-screen canvas view (`Main` branch). Success toast notification appears at top right: "Branch 'Feature/Dark-Mode' merged successfully". Live multiplayer cursors (with team member avatars "Sarah" and "Alex") float back onto the updated artboard.
- **Action & Trigger**: System completes merge commit via WebSocket broadcast.
- **Text & Microcopy**: Toast: "Branch merged into Main. 3 conflicts resolved." Header status pill: "Main (Up to date)".
- **Behind-the-Scenes & State Delta**: Canvas state saved to cloud repository; undo history stack reset; remote collaborators receive updated DOM tree via CRDT sync.
