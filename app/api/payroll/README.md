# Payroll API Endpoints

Complete REST API for payroll management operations.

## 🔐 Authentication

All endpoints require:
- Valid Supabase authentication
- Admin role (`profiles.is_admin = true`)

**Unauthorized requests return:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not admin

---

## 📍 Endpoints

### 1. Calculate Payroll

**POST** `/api/payroll/calculate`

Calculate monthly payroll for all active staff or a specific staff member.

**Request Body:**
```json
{
  "month": 12,
  "year": 2025,
  "staffId": "optional-staff-uuid"
}
```

**Response (All Staff):**
```json
{
  "success": true,
  "data": {
    "totalStaff": 5,
    "totalGrossPay": 12500.00,
    "totalNetPay": 12500.00,
    "totalCommissions": 4200.00,
    "totalBonuses": 1500.00,
    "totalHours": 320,
    "payrolls": [
      {
        "id": "uuid",
        "staff": { "full_name": "Sarah Johnson", "email": "sarah@salon.com" },
        "period_month": 12,
        "period_year": 2025,
        "total_hours": 45.5,
        "base_pay": 819.00,
        "adjusted_commission": 650.00,
        "total_bonuses": 300.00,
        "gross_pay": 1769.00,
        "net_pay": 1769.00,
        "status": "calculated",
        "performance_tier": { "name": "Gold" }
      }
    ]
  }
}
```

**Response (Single Staff):**
```json
{
  "success": true,
  "data": {
    "staffId": "uuid",
    "staffName": "Sarah Johnson",
    "compensationProfile": {
      "id": "uuid",
      "name": "Balanced",
      "hourlyRate": 18.00,
      "commissionRate": 15.00
    },
    "skillPremiumHourly": 3.00,
    "totalHours": 45.5,
    "appointments": {
      "total": 45,
      "completed": 45,
      "revenue": 4320.00
    },
    "productSales": 560.00,
    "performanceTier": {
      "id": "uuid",
      "name": "Gold",
      "multiplier": 1.50,
      "bonus": 300.00
    },
    "bonuses": {
      "individual": 100.00,
      "team": 50.00,
      "retention": 150.00,
      "skill": 136.50
    },
    "calculations": {
      "basePay": 819.00,
      "baseCommission": 704.00,
      "adjustedCommission": 1056.00,
      "totalBonuses": 736.50,
      "grossPay": 2611.50,
      "deductions": 0.00,
      "netPay": 2611.50
    }
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/payroll/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    month: 12,
    year: 2025
    // staffId: 'optional-uuid'
  })
})

const result = await response.json()
console.log(result.data.totalNetPay) // Total payroll cost
```

---

### 2. Get Payroll Summary

**GET** `/api/payroll/summary?month=12&year=2025`

Retrieve calculated payroll records for a specific period.

**Query Parameters:**
- `month` (required) - Month number (1-12)
- `year` (required) - Year (e.g., 2025)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStaff": 5,
    "totalGrossPay": 12500.00,
    "totalNetPay": 12500.00,
    "totalCommissions": 4200.00,
    "totalBonuses": 1500.00,
    "totalHours": 320,
    "payrolls": [...]
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/payroll/summary?month=12&year=2025')
const result = await response.json()
console.log(result.data.payrolls) // Array of payroll records
```

---

### 3. Approve Payroll

**POST** `/api/payroll/approve`

Approve a payroll record (changes status from "calculated" to "approved").

**Request Body:**
```json
{
  "payrollId": "uuid-of-payroll-record"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payroll approved successfully"
}
```

**Example:**
```javascript
const response = await fetch('/api/payroll/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payrollId: 'abc-123-def-456'
  })
})
```

---

### 4. Mark as Paid

**POST** `/api/payroll/mark-paid`

Mark a payroll record as paid (changes status from "approved" to "paid").

**Request Body:**
```json
{
  "payrollId": "uuid-of-payroll-record"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payroll marked as paid successfully"
}
```

**Example:**
```javascript
const response = await fetch('/api/payroll/mark-paid', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payrollId: 'abc-123-def-456'
  })
})
```

---

### 5. Bonuses - Get

**GET** `/api/payroll/bonuses?staffId=uuid&month=12&year=2025`

Retrieve bonuses for a staff member or all staff.

**Query Parameters:**
- `staffId` (optional) - Filter by staff member
- `month` (optional) - Filter by month
- `year` (optional) - Filter by year

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "staff_id": "uuid",
      "bonus_type": "custom",
      "amount": 150.00,
      "description": "Excellent customer service",
      "awarded_date": "2025-12-01",
      "period_month": 12,
      "period_year": 2025,
      "created_by": "admin-uuid",
      "notes": null,
      "created_at": "2025-12-01T10:30:00Z",
      "staff": {
        "full_name": "Sarah Johnson",
        "email": "sarah@salon.com"
      }
    }
  ]
}
```

**Example:**
```javascript
// Get all bonuses for December 2025
const response = await fetch('/api/payroll/bonuses?month=12&year=2025')

// Get all bonuses for specific staff
const response2 = await fetch('/api/payroll/bonuses?staffId=abc-123')
```

---

### 6. Bonuses - Create

**POST** `/api/payroll/bonuses`

Create a custom bonus for a staff member.

**Request Body:**
```json
{
  "staffId": "uuid",
  "bonusType": "custom",
  "amount": 150.00,
  "description": "Excellent customer service this month",
  "awardedDate": "2025-12-01",
  "periodMonth": 12,
  "periodYear": 2025,
  "notes": "Top-rated stylist this month"
}
```

**Bonus Types:**
- `custom` - Custom bonus (any reason)
- `milestone` - Milestone achievement (100th appointment, anniversary)
- `holiday` - Holiday bonus (working busy days)
- `quality` - Quality bonus (5-star reviews)
- `speed` - Speed bonus (fast service)
- `referral` - Referral bonus (new customers/staff)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "staff_id": "uuid",
    "bonus_type": "custom",
    "amount": 150.00,
    "description": "Excellent customer service this month",
    "awarded_date": "2025-12-01",
    "period_month": 12,
    "period_year": 2025,
    "created_by": "admin-uuid",
    "notes": "Top-rated stylist this month",
    "created_at": "2025-12-01T10:30:00Z"
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/payroll/bonuses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    staffId: 'abc-123',
    bonusType: 'holiday',
    amount: 200.00,
    description: 'Working Christmas week',
    periodMonth: 12,
    periodYear: 2025
  })
})
```

---

### 7. Bonuses - Delete

**DELETE** `/api/payroll/bonuses?id=uuid`

Delete a bonus record.

**Query Parameters:**
- `id` (required) - Bonus UUID to delete

**Response:**
```json
{
  "success": true,
  "message": "Bonus deleted successfully"
}
```

**Example:**
```javascript
const response = await fetch('/api/payroll/bonuses?id=abc-123', {
  method: 'DELETE'
})
```

---

## 🔄 Workflow Example

### Complete Monthly Payroll Process via API

```javascript
// Step 1: Calculate payroll for December 2025
const calcResponse = await fetch('/api/payroll/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ month: 12, year: 2025 })
})
const calcResult = await calcResponse.json()
console.log('Payroll calculated:', calcResult.data.totalNetPay)

// Step 2: Add a holiday bonus
const bonusResponse = await fetch('/api/payroll/bonuses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    staffId: 'sarah-uuid',
    bonusType: 'holiday',
    amount: 150.00,
    description: 'Working Christmas week',
    periodMonth: 12,
    periodYear: 2025
  })
})

// Step 3: Recalculate after adding bonus
await fetch('/api/payroll/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ month: 12, year: 2025 })
})

// Step 4: Get updated summary
const summaryResponse = await fetch('/api/payroll/summary?month=12&year=2025')
const summary = await summaryResponse.json()

// Step 5: Approve each payroll record
for (const payroll of summary.data.payrolls) {
  await fetch('/api/payroll/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payrollId: payroll.id })
  })
}

// Step 6: After actual payment, mark as paid
for (const payroll of summary.data.payrolls) {
  await fetch('/api/payroll/mark-paid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payrollId: payroll.id })
  })
}

console.log('✅ Payroll process complete!')
```

---

## ⚠️ Error Responses

### Common Errors

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```
**Cause**: User not logged in
**Solution**: Ensure valid authentication token

**403 Forbidden:**
```json
{
  "error": "Forbidden"
}
```
**Cause**: User is not admin
**Solution**: Check `profiles.is_admin` flag

**400 Bad Request:**
```json
{
  "error": "Month and year are required"
}
```
**Cause**: Missing required parameters
**Solution**: Include all required fields

**500 Internal Server Error:**
```json
{
  "error": "Failed to calculate payroll"
}
```
**Cause**: Server-side error
**Solution**: Check server logs, verify database connectivity

---

## 🎯 Integration Tips

### React/Next.js Component Example

```typescript
'use client'

import { useState } from 'react'

export default function PayrollCalculator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const calculatePayroll = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: 12,
          year: 2025
        })
      })

      if (!response.ok) {
        throw new Error('Calculation failed')
      }

      const data = await response.json()
      setResult(data.data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to calculate payroll')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={calculatePayroll} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Payroll'}
      </button>

      {result && (
        <div>
          <h3>Total Net Pay: ${result.totalNetPay}</h3>
          <p>Staff Count: {result.totalStaff}</p>
        </div>
      )}
    </div>
  )
}
```

---

## 📊 Rate Limits

Currently, there are **no rate limits** on payroll endpoints.

**Best Practices:**
- Don't spam calculate endpoint
- Cache payroll data on client side
- Use summary endpoint for display
- Calculate only when needed

---

## 🔒 Security Notes

1. **Authentication Required**: All endpoints check for valid user session
2. **Admin Role Required**: All endpoints verify `is_admin` flag
3. **Row Level Security**: Database queries respect RLS policies
4. **Input Validation**: All inputs validated before processing
5. **SQL Injection Prevention**: Using Supabase parameterized queries

---

## 📚 Related Documentation

- **Setup Guide**: [../../../PAYROLL_SETUP_GUIDE.md](../../../PAYROLL_SETUP_GUIDE.md)
- **Technical Docs**: [../../../docs/PAYROLL_SYSTEM.md](../../../docs/PAYROLL_SYSTEM.md)
- **Calculation Engine**: [../../../lib/payroll/engine.ts](../../../lib/payroll/engine.ts)

---

**API Version**: 1.0
**Last Updated**: December 19, 2025
