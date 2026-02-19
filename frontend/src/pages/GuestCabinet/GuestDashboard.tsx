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
  EventNote as BookingIcon,
  Hotel as RoomIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

export default function GuestDashboard() {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome banner */}
      <Box
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', mb: 1 }}>
          Welcome, {user?.profile.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your bookings and explore available rooms from your dashboard.
        </Typography>
        <Chip
          label={user?.role.toUpperCase()}
          size="small"
          color="primary"
          sx={{ mt: 1.5 }}
        />
      </Box>

      {/* Quick action cards */}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Quick Actions
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {[
          {
            icon: <BookingIcon sx={{ fontSize: 40 }} />,
            title: 'My Bookings',
            desc: 'View and manage your current and past reservations.',
          },
          {
            icon: <RoomIcon sx={{ fontSize: 40 }} />,
            title: 'Browse Rooms',
            desc: 'Explore available rooms and make a new booking.',
          },
          {
            icon: <PersonIcon sx={{ fontSize: 40 }} />,
            title: 'My Profile',
            desc: 'Update your personal information and preferences.',
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
              <Box sx={{ color: 'primary.main', mb: 2 }}>{card.icon}</Box>
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
    </Container>
  );
}
