# Analytics Troubleshooting Guide for Pandora Beauty Salon

## Quick Fixes to Try:

### 1. **Test the Debug Endpoint**
Navigate to: `http://localhost:3000/api/analytics/detailed-debug`
This will give you detailed information about what's failing.

### 2. **Test Database Health**
Navigate to: `http://localhost:3000/admin/health-check`
Run the foreign key integrity check and fix any issues found.

### 3. **Test Basic Analytics First**
Navigate to: `http://localhost:3000/api/analytics`
If this works, the issue is with the detailed analytics complexity.

### 4. **Check Your Database Schema**
Make sure these tables exist and have the expected relationships:
- `appointments` (main table)
- `services` (linked to appointments)
- `appointment_services` (junction table)
- `staff`, `products`, `appointment_products`

### 5. **Use the Fixed Analytics Endpoint**
Navigate to: `http://localhost:3000/api/analytics/detailed-fixed`
This has improved error handling and safer data processing.

## Common Issues and Solutions:

### Issue: "Failed to fetch detailed analytics data"
**Possible Causes:**
- Database connection problems
- Missing foreign key relationships
- Complex joins timing out
- Data type mismatches

**Solutions:**
1. Check your Supabase connection
2. Run the health checker
3. Use the fixed endpoint
4. Check browser console for specific errors

### Issue: 500 Internal Server Error
**Possible Causes:**
- Complex data processing throwing exceptions
- Missing required tables
- Null/undefined data causing processing errors

**Solutions:**
1. Check server logs in terminal running `npm run dev`
2. Use the debug endpoint to isolate the issue
3. Temporarily use the basic analytics endpoint

### Issue: 400 Bad Request
**Possible Causes:**
- Invalid date parameters
- Malformed query parameters
- Authentication issues

**Solutions:**
1. Check date format (should be YYYY-MM-DD)
2. Ensure you're logged in as admin
3. Clear browser cache and cookies

## Steps to Debug:

1. **Start with the debug endpoint**: Visit `/api/analytics/detailed-debug`
2. **Check the browser console**: Look for specific error messages
3. **Check server logs**: Look at your terminal running the dev server
4. **Test database health**: Use the health checker in admin panel
5. **Try simpler queries**: Use the basic analytics endpoint first

## Database Schema Check:

Run this query in your Supabase SQL editor to check table relationships:

```sql
-- Check if appointment_services table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'appointment_services'
);

-- Check foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('appointments', 'appointment_services', 'appointment_products');
```

## Next Steps:

If the issues persist:
1. Use the fixed analytics endpoint (`/detailed-fixed`) 
2. Consider simplifying your analytics queries
3. Add more sample data to test with
4. Check Supabase RLS (Row Level Security) policies
5. Verify your table relationships are properly set up

## Contact Info:
Check your server console logs for more detailed error messages when the analytics fail.
