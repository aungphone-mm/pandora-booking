# Pandora Beauty Salon Booking System

A modern web application for managing beauty salon appointments built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Features

- **Customer Features:**
  - User registration and authentication
  - Online appointment booking
  - Service selection with categories
  - Product add-ons during booking
  - Real-time availability checking
  - Appointment history viewing

- **Admin Features:**
  - Admin dashboard with statistics
  - Service management (CRUD operations)
  - Product management
  - Time slot configuration
  - Appointment management
  - User management

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Form Handling:** React Hook Form
- **Date Handling:** date-fns

## Project Structure

```
pandora-booking/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── auth/              # Authentication pages
│   ├── booking/           # Booking flow
│   ├── account/           # User account
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility functions
└── public/               # Static assets
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   cd D:\dev\pandora-booking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Create the required database tables (see Database Schema section)
   - Copy your project URL and anon key

4. **Configure environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Visit http://localhost:3000

## Database Schema

Create these tables in your Supabase project:

### profiles
- id (uuid, references auth.users)
- full_name (text)
- phone (text)
- is_admin (boolean, default: false)

### service_categories
- id (uuid, primary key)
- name (text)
- display_order (integer)

### services
- id (uuid, primary key)
- name (text)
- description (text)
- category_id (uuid, references service_categories)
- duration (integer)
- price (decimal)
- is_active (boolean)

### product_categories
- id (uuid, primary key)
- name (text)
- display_order (integer)

### products
- id (uuid, primary key)
- name (text)
- description (text)
- category_id (uuid, references product_categories)
- price (decimal)
- is_active (boolean)

### time_slots
- id (uuid, primary key)
- time (text)
- is_active (boolean)

### appointments
- id (uuid, primary key)
- user_id (uuid, references auth.users, nullable)
- customer_name (text)
- customer_email (text)
- customer_phone (text)
- service_id (uuid, references services)
- appointment_date (date)
- appointment_time (text)
- status (text, default: 'pending')
- notes (text)
- created_at (timestamp)

### appointment_products
- id (uuid, primary key)
- appointment_id (uuid, references appointments)
- product_id (uuid, references products)
- quantity (integer)

## Development

- Run `npm run dev` for development
- Run `npm run build` for production build
- Run `npm start` to start production server

## License

This project is proprietary software for Pandora Beauty Salon.
