# Hub LMS — Modern Teacher-First Learning Management System

A sleek, high-fidelity Learning Management System designed from the ground up to minimize administrative friction for educators. Unlike traditional academic portals, Hub LMS focuses on clean visual hierarchy, intuitive dashboards, and rapid micro-analytics for classrooms.

## 🚀 Key Features

* **Centralized Command Center (Overview):** A single-glance dashboard displaying daily schedules, high-level metric summaries (Total Students, Active Classes), and urgent pending grading notifications.
* **Dynamic Course Management (My Classes):** Comprehensive class grids allowing teachers to monitor enrollment metrics and launch deep-dive management screens.
* **Real-Time Assignment Tracking:** Visual progress and submission bars displaying grading pipelines and color-coded statuses.
* **Unified Student Directory:** Searchable roster layouts mapping student emails, course affiliations, and current performance metrics.
* **Account Control Workspace:** Modular settings console featuring editable profile matrices and interactive security controls (2FA toggles).

## 🛠️ Tech Stack

* **Frontend Framework:** React (with TypeScript for robust type-safety)
* **Build Engine:** Vite (for near-instantaneous hot module reloading)
* **Styling Utility:** Tailwind CSS (utility-first CSS engine for clean, maintainable layout designs)
* **Iconography:** Lucide React (minimalist vector icon primitives)

## 📂 Project Architecture

```text
teacher-hub-lms/
├── src/
│   ├── components/       # Modular UI blocks (Sidebar, Header, Tab views)
│   ├── assets/           # Global design layouts and structural styles
│   ├── App.tsx           # Primary application canvas and shell router
│   └── main.tsx          # Application bootstrapper and context engine
├── public/               # Static system vectors and assets
├── tailwind.config.js    # Utility engine compiling constraints
└── package.json          # Core dependency manifest
