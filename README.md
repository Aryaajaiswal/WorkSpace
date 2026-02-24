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
