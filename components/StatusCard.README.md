# StatusCard Component Usage Guide

The StatusCard component provides a consistent way to display statistical information across the Pandora Beauty Salon admin panel.

## Basic Usage

```tsx
import StatusCard from '@/components/StatusCard'
import StatusCardGrid from '@/components/StatusCardGrid'

// Single Status Card
<StatusCard
  title="Total Revenue"
  value="125,000 Ks"
  type="success"
/>

// Multiple Status Cards in a Grid
<StatusCardGrid columns={4}>
  <StatusCard title="Total Appointments" value={42} type="default" />
  <StatusCard title="Pending" value={11} type="pending" />
  <StatusCard title="Confirmed" value={28} type="confirmed" />
  <StatusCard title="Cancelled" value={3} type="cancelled" />
</StatusCardGrid>
```

## Props

### StatusCard Props

- `title` (string, required): The label displayed above the value
- `value` (string | number, required): The main value to display
- `type` (optional): Determines the color scheme
  - `'default'` - Gray (neutral)
  - `'pending'` or `'warning'` - Yellow
  - `'confirmed'` or `'success'` - Green
  - `'cancelled'` or `'danger'` - Red
  - `'primary'` - Blue
- `icon` (string, optional): An emoji or icon to display
- `className` (string, optional): Additional CSS classes

### StatusCardGrid Props

- `children` (ReactNode, required): StatusCard components
- `columns` (2 | 3 | 4, optional): Number of columns on large screens (default: 4)
- `className` (string, optional): Additional CSS classes

## Examples

### Dashboard Stats
```tsx
<StatusCardGrid>
  <StatusCard title="Today's Revenue" value="45,000 Ks" type="success" icon="💰" />
  <StatusCard title="New Customers" value={12} type="primary" icon="👥" />
  <StatusCard title="Appointments" value={8} type="default" icon="📅" />
  <StatusCard title="Pending Tasks" value={3} type="warning" icon="⚠️" />
</StatusCardGrid>
```

### Staff Performance
```tsx
<StatusCardGrid columns={3}>
  <StatusCard title="Total Staff" value={15} type="primary" />
  <StatusCard title="Active Today" value={12} type="success" />
  <StatusCard title="On Leave" value={3} type="warning" />
</StatusCardGrid>
```

### Service Stats
```tsx
<StatusCardGrid columns={2}>
  <StatusCard title="Active Services" value={24} type="success" />
  <StatusCard title="Inactive Services" value={5} type="danger" />
</StatusCardGrid>
```

## Color Types Guide

- Use `default` for neutral/informational stats
- Use `success`/`confirmed` for positive metrics
- Use `warning`/`pending` for items requiring attention
- Use `danger`/`cancelled` for negative metrics or alerts
- Use `primary` for key business metrics
