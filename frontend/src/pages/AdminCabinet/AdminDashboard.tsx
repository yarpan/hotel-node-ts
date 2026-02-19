import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  EventNote as BookingIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Admin banner */}
      <Box
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <DashboardIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Admin Dashboard
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.profile.firstName}. Manage the hotel operations below.
        </Typography>
        <Chip label="ADMIN" size="small" color="warning" sx={{ mt: 1.5 }} />
      </Box>

      {/* Management cards */}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Hotel Management
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        {[
          {
            icon: <RoomIcon sx={{ fontSize: 40 }} />,
            title: 'Room Management',
            desc: 'Add, edit, and manage all hotel rooms and their availability.',
            color: 'primary.main',
          },
          {
            icon: <BookingIcon sx={{ fontSize: 40 }} />,
            title: 'Booking Management',
            desc: 'View all bookings, handle check-ins and check-outs.',
            color: 'info.main',
          },
          {
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            title: 'Guest Management',
            desc: 'View registered guests and their booking history.',
            color: 'success.main',
          },
        ].map((card) => (
          <Card
            key={card.title}
            sx={{
              flex: 1,
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ color: card.color, mb: 2 }}>{card.icon}</Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {card.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.desc}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Placeholder stats */}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Overview
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
        {[
          { label: 'Total Rooms', value: '—', color: 'primary.main' },
          { label: 'Active Bookings', value: '—', color: 'info.main' },
          { label: 'Guests Today', value: '—', color: 'success.main' },
          { label: 'Revenue (Month)', value: '—', color: 'warning.main' },
        ].map((stat) => (
          <Card key={stat.label} sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" sx={{ color: stat.color, fontWeight: 700 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
