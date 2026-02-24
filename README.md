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
<img width="1872" height="891" alt="image" src="https://github.com/user-attachments/assets/885b1b0f-4d0e-49d4-8409-c00c1df738d3" />
<img width="1876" height="801" alt="image" src="https://github.com/user-attachments/assets/fcac48c6-0a79-4bc3-ab89-35d71e188341" />
<img width="1775" height="778" alt="image" src="https://github.com/user-attachments/assets/510a4fc7-23fd-4b9f-98e8-463865415a34" />
<img width="1884" height="678" alt="image" src="https://github.com/user-attachments/assets/423abb69-cda0-4a0a-b450-32dfc91237fd" />
<img width="1881" height="726" alt="image" src="https://github.com/user-attachments/assets/1011d197-de2a-4a66-8816-f7ee22f241d7" />
<img width="1884" height="837" alt="image" src="https://github.com/user-attachments/assets/4b46dd8f-e79f-4d07-9a8a-61b87ddabc64" />
<img width="1903" height="878" alt="image" src="https://github.com/user-attachments/assets/c18738da-77e8-4423-b93f-a4d73815c46d" />
<img width="688" height="673" alt="image" src="https://github.com/user-attachments/assets/bf0c427e-9cb5-4720-96f7-5270ab887b43" />


