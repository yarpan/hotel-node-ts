import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Box,
  alpha,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import {
  EventNote as BookingIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/booking.service';
import type { Booking } from '../../types';

const statusColor: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  'checked-in': 'success',
  checked_in: 'success',
  'checked-out': 'default',
  checked_out: 'default',
  cancelled: 'error',
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bookingService
      .getBookings()
      .then((res) => {
        setBookings(res.data?.bookings ?? []);
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? 'Failed to load bookings.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <BookingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif' }}>
          My Bookings
        </Typography>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && !error && bookings.length === 0 && (
        <Card
          sx={{
            textAlign: 'center',
            py: 8,
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        >
          <CardContent>
            <CalendarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No bookings yet
            </Typography>
            <Button variant="contained" onClick={() => navigate('/dashboard/rooms')}>
              Browse Rooms
            </Button>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2}>
        {bookings.map((booking: any) => (
          <Card
            key={booking.id}
            sx={{
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                spacing={1}
              >
                <Box>
                  <Typography variant="h6">
                    Booking #{String(booking.id).padStart(6, '0')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(booking.checkInDate).toLocaleDateString()} →{' '}
                    {new Date(booking.checkOutDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    ${booking.totalPrice}
                  </Typography>
                  <Chip
                    label={booking.status}
                    color={statusColor[booking.status]}
                    size="small"
                  />
                </Stack>
              </Stack>
              {booking.specialRequests && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Note:</strong> {booking.specialRequests}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
