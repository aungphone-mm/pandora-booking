# Booking Search - Debugging Guide

## Issue: Services and Products Not Showing When Searching by Booking ID

### Steps to Debug

#### 1. Open Browser DevTools
- Press `F12` to open Developer Tools
- Go to the **Console** tab

#### 2. Search for a Booking
- Go to `/confirmation` page
- Enter a booking ID
- Click "Search Booking"

#### 3. Check Console Logs
You should see these logs:
```
Searching for booking ID: <your-booking-id>
Search response status: 200
Booking found: {id: "...", customerName: "...", services: [...], products: [...]}
Services: [...]
Products: [...]
Services state set to: [...]
Products state set to: [...]
```

### What to Check

#### A. If Services Array is Empty `[]`
**Possible Causes:**
1. **Migration not run** - The `appointment_services` table doesn't exist
2. **Old booking format** - Booking was created before multi-service support
3. **Database issue** - Service data wasn't saved properly

**Solutions:**
1. Run the database migration:
   ```sql
   -- In Supabase SQL Editor, run:
   -- File: database/migrations/add_multiple_services_support.sql
   ```

2. Check the booking in database:
   ```sql
   -- Check if booking has service_id (old format)
   SELECT id, service_id FROM appointments WHERE id = 'your-booking-id';

   -- Check appointment_services table (new format)
   SELECT * FROM appointment_services WHERE appointment_id = 'your-booking-id';
   ```

#### B. If Products Array is Empty `[]`
**Possible Cause:** No products were added to this booking

**This is normal** if the customer didn't select any add-on products.

#### C. If API Returns 404
**Error:** "Booking not found"

**Possible Causes:**
1. Wrong booking ID
2. Booking doesn't exist in database
3. Database connection issue

**Solutions:**
1. Verify booking ID is correct (full UUID, not just first 8 chars)
2. Check database:
   ```sql
   SELECT id, customer_name FROM appointments WHERE id = 'your-booking-id';
   ```

#### D. If API Returns 500
**Error:** "Failed to fetch booking details"

**Possible Causes:**
1. Database query error
2. Missing tables (`appointment_services` or `appointment_products`)
3. Invalid relationships

**Solutions:**
1. Check server logs in terminal where `npm run dev` is running
2. Run all migrations
3. Check Supabase logs in dashboard

### Visual Indicators

#### Development Mode Debug Info
In development, you'll see a yellow box at the bottom of booking details:
```
Debug: Services: 2, Products: 1
```

This shows how many services and products were loaded.

#### Services Display
- **If services exist:** Shows list with duration and price
- **If no services:** Shows "No services found" in gray italic text

#### Products Display
- **If products exist:** Shows "Add-on Products" section
- **If no products:** Section is hidden (this is normal)

## Common Scenarios

### Scenario 1: Fresh Installation
**Problem:** No `appointment_services` table exists

**Solution:**
1. Run migration: `database/migrations/add_missing_appointments_columns.sql`
2. Run migration: `database/migrations/add_multiple_services_support.sql`
3. Test with a NEW booking (old bookings won't have data in new table)

### Scenario 2: Old Bookings
**Problem:** Bookings created before multi-service support

**What Happens:**
- API automatically falls back to old format
- Fetches service from `service_id` column
- Should still display the service

**If not working:**
- Check server console logs
- Verify `service_id` column has a value:
  ```sql
  SELECT id, service_id, customer_name FROM appointments WHERE id = 'your-booking-id';
  ```

### Scenario 3: New Bookings
**Problem:** Bookings created after migration but services still don't show

**Check:**
1. Was the booking created successfully?
   ```sql
   SELECT * FROM appointments WHERE id = 'your-booking-id';
   ```

2. Were services inserted into `appointment_services`?
   ```sql
   SELECT * FROM appointment_services WHERE appointment_id = 'your-booking-id';
   ```

3. If `appointment_services` is empty, check your booking form code:
   - Is it inserting into `appointment_services` table?
   - File: `components/booking/SinglePageBookingForm.tsx` (line 147-164)

## Quick Test

### Create a Test Booking
1. Go to `/booking`
2. Select at least one service
3. Add at least one product (optional)
4. Fill out form and submit
5. Copy the booking ID from confirmation page
6. Use search to look it up
7. Verify services and products appear

### Manual Database Check
```sql
-- Get booking with all data
SELECT
  a.*,
  (SELECT json_agg(json_build_object(
    'service_name', s.name,
    'price', s.price
  ))
  FROM appointment_services aps
  JOIN services s ON s.id = aps.service_id
  WHERE aps.appointment_id = a.id) as services,
  (SELECT json_agg(json_build_object(
    'product_name', p.name,
    'price', p.price
  ))
  FROM appointment_products app
  JOIN products p ON p.id = app.product_id
  WHERE app.appointment_id = a.id) as products
FROM appointments a
WHERE a.id = 'your-booking-id';
```

## Contact Support

If services and products still don't appear after:
1. Running all migrations
2. Creating a NEW test booking
3. Checking console logs
4. Verifying database has data

Then there may be a deeper issue. Check:
- Server logs (terminal running `npm run dev`)
- Supabase logs (in Supabase dashboard)
- Network tab in DevTools (check API response)
