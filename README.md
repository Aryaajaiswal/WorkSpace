# WorkSpace — Seat Booking System

A full-stack seat allocation and booking system built for Wissen Technology technical assignment.

## 🚀 Tech Stack
- React
- Node.js
- Express
- PostgreSQL

##**Architecture Overview**

-**Three-Tier Architecture**
The system follows a clear separation of concerns:
React (Presentation Layer) → Express API (Application Layer) → PostgreSQL (Data Layer).

-**Backend-Centric Business Logic**
All booking rules (3 PM restriction, tomorrow-only booking, weekend/holiday checks, batch rotation logic) are enforced on the server to ensure security and data integrity.

-**Separated Allocation & Booking Lifecycle**
seat_allocations (system-generated designated seats) and seat_bookings (user-created floater bookings) are stored in separate tables to maintain clarity and prevent logic conflicts.

-**Transactional Concurrency Control**
Floater seat booking uses database transactions with row-level locking (FOR UPDATE) to prevent race conditions and double-booking.

-**Database-Level Constraints for Safety**
Unique constraints, foreign keys, and checks ensure one seat per user per day and prevent invalid or duplicate assignments, adding an additional protection layer beyond API validation.

##**Workflow**

Below are the visuals included in the project README, with short captions describing each image.

![Workflow — 1](https://github.com/user-attachments/assets/885b1b0f-4d0e-49d4-8409-c00c1df738d3)

*Figure 1 — High-level system workflow: components and data flow between frontend, API, and database.*

![Workflow — 2](https://github.com/user-attachments/assets/fcac48c6-0a79-4bc3-ab89-35d71e188341)

*Figure 2 — Booking lifecycle: steps for creating a floater booking and allocation rules.*

![Workflow — 3](https://github.com/user-attachments/assets/510a4fc7-23fd-4b9f-98e8-463865415a34)

*Figure 3 — Allocation logic: how designated seats and batch rotations are computed.*

![Workflow — 4](https://github.com/user-attachments/assets/423abb69-cda0-4a0a-b450-32dfc91237fd)

*Figure 4 — Concurrency and transaction flow: row-level locking and transactional guarantees used to prevent double-booking.*

![Workflow — 5](https://github.com/user-attachments/assets/1011d197-de2a-4a66-8816-f7ee22f241d7)

*Figure 5 — Database schema overview: key tables and constraints (seat_allocations, seat_bookings, users).*

![Workflow — 6](https://github.com/user-attachments/assets/4b46dd8f-e79f-4d07-9a8a-61b87ddabc64)

*Figure 6 — API sequence: request/response sequence for booking and allocation endpoints.*

![Workflow — 7](https://github.com/user-attachments/assets/c18738da-77e8-4423-b93f-a4d73815c46d)

*Figure 7 — Frontend mockups: UI flows for searching, booking, and managing seats.*

![Workflow — 8](https://github.com/user-attachments/assets/bf0c427e-9cb5-4720-96f7-5270ab887b43)

*Figure 8 — Edge cases & validations: weekend/holiday checks and booking cutoff enforcement illustrated.*


