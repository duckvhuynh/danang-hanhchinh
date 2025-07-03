Sure Đức! Based on the message you shared, here's a well-organized **MVP (Minimum Viable Product)** and **Product Requirement Document (PRD)** tailored for the upcoming **demo with the UBND TP Đà Nẵng**.

* * * * *

🧩 Project Name
---------------

**`danang-admin-centers-map`**

* * * * *

🚀 MVP Overview
---------------

### 🎯 Goal:

Build an interactive web map that visualizes service coverage of administrative centers in Đà Nẵng and former Quảng Nam districts. It helps identify:

-   Coverage zones

-   Overlaps

-   Gaps in service

* * * * *

🛠️ MVP Features
----------------

### 1\. **Three Layers of Administrative Points**

| Layer | Description | Source | Radius |
| --- | --- | --- | --- |
| **A** | 22 administrative service offices (17 old QN districts + 5 DN quận) | Luyện | 7km |
| **B** | 93 centers of new xã | Luyện | 5km |
| **C** | All former xã (excluding Tam Hải, Tân Hiệp if already in A/B) | Luyện | 5km |

* * * * *

### 2\. **Map Visualization**

-   🗺️ Use **Google Maps API** (or Mapbox if needed)

-   📍 Render **point markers** for each location

-   🔵 Draw **radius circles** based on each layer's config

-   🌈 Each layer has its own **distinct color**

* * * * *

### 3\. **Functional Requirements**

-   ✅ Toggle visibility of **each layer**

-   ✅ Show **overlap areas** (use transparency)

-   ✅ Show **empty areas** (gaps not covered)

-   ✅ Allow user to **add a manual circle** from any point

-   ✅ Tooltip or popup on hover/click for point details (e.g. name, location)

* * * * *

📄 PRD --- Product Requirements Document
--------------------------------------

### 1\. **Product Summary**

This tool supports Đà Nẵng city leadership in evaluating the distribution and service coverage of administrative centers after the merger of Đà Nẵng and Quảng Nam. It visualizes coverage zones to help identify service gaps and optimize planning.

* * * * *

### 2\. **Users**

-   UBND Đà Nẵng leadership

-   Urban planning teams

-   Public service department

-   Citizens (later phase, optional)

* * * * *

### 3\. **User Stories**

-   As a city planner, I want to **see the coverage** of admin centers so I can identify areas underserved by public service.

-   As a government official, I want to **compare overlaps and gaps** to make data-backed decisions.

-   As a user, I want to **turn layers on/off** for clearer understanding.

* * * * *

### 4\. **Technical Requirements**

| Feature | Tech Stack |
| --- | --- |
| Frontend | ReactJS or simple HTML+JS if urgent |
| Map API | Google Maps JS API (preferred) or Mapbox |
| Data | JSON or GeoJSON from Luyện |
| Hosting | GitHub Pages / Vercel / Internal server |

* * * * *

### 5\. **Non-Functional Requirements**

-   ⏱️ Fast load time (<3s)

-   📱 Responsive design (for desktop, optionally mobile)

-   🧪 Minimal bug-free demo experience

-   🗂️ Data separation for each layer for easy updates

* * * * *

### 6\. **Timeline (for Demo)**

| Task | Deadline |
| --- | --- |
| Data prep (Luyện) | 03/07/2025 afternoon |
| MVP UI | 03/07/2025 night |
| Core logic (circle render, toggle layers) | 03/07/2025 night |
| Demo polish & testing | 04/07/2025 morning |
| DEMO | 04/07/2025 afternoon |

* * * * *

### 7\. **Stretch Goals (if time allows)**

-   Distance heatmap or grid overlay

-   Admin zone boundaries layer

-   Export PDF or screenshot of map

-   Shareable link for public