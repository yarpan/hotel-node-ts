import { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, Card, CardContent,
  Stack, Chip, CircularProgress, Alert, Grid, TextField, Divider, alpha
} from '@mui/material';
import {
  ArrowBack as BackIcon, Hotel as RoomIcon, CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import roomService from '../../services/room.service';
import bookingService from '../../services/booking.service';
import type { Room, CreateBookingData } from '../../types';

export default function RoomDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [requests, setRequests] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    roomService.getRoomById(id)
      .then(res => setRoom(res.data?.room ?? null))
      .catch(err => setError(err.response?.data?.message || 'Failed to load room details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    
    setBookingError(null);
    setBookingLoading(true);

    try {
      const bookingData: CreateBookingData = {
        roomId: Number(room.id || id),
        checkInDate: new Date(checkIn).toISOString(),
        checkOutDate: new Date(checkOut).toISOString(),
        numberOfGuests: guests,
        specialRequests: requests
      };
      await bookingService.createBooking(bookingData);
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/bookings');
      }, 2000);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !room) {
    return (
      <Container sx={{ py: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/dashboard/rooms')} sx={{ mb: 3 }}>
          Back to Rooms
        </Button>
        <Alert severity="error">{error || 'Room not found.'}</Alert>
      </Container>
    );
  }

  // Calculate total price if dates are selected
  let totalPrice = 0;
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    totalPrice = nights * room.pricePerNight;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/dashboard/rooms')} sx={{ mb: 3 }}>
        Back to Rooms
      </Button>

      {bookingSuccess && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Booking confirmed! Redirecting to your bookings...
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Column: Room Details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', mb: 1 }}>
            Room {room.roomNumber}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Chip label={room.type.toUpperCase()} color="primary" />
            <Chip label={room.status} variant="outlined" color={room.status === 'available' ? 'success' : 'default'} />
          </Stack>

          <Card sx={{ mb: 4, overflow: 'hidden' }}>
            {/* Placeholder for Room Image */}
            <Box
              sx={{
                height: 300,
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
              }}
            >
              <RoomIcon sx={{ fontSize: 80, color: 'primary.light', opacity: 0.5 }} />
            </Box>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Description</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                {room.description || 'Experience comfort and luxury in this beautifully appointed room.'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>Amenities</Typography>
              <Grid container spacing={2}>
                {room.amenities?.map((amenity, idx) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={idx}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      <Typography variant="body2">{amenity}</Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Booking Form */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ position: 'sticky', top: 24, boxShadow: 4 }}>
            <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ${room.pricePerNight} <Typography component="span" variant="body1">/ night</Typography>
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {bookingError && <Alert severity="error" sx={{ mb: 3 }}>{bookingError}</Alert>}
              
              <form onSubmit={handleBooking}>
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Check-in"
                      type="date"
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: new Date().toISOString().split('T')[0] }}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                    <TextField
                      label="Check-out"
                      type="date"
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: checkIn || new Date().toISOString().split('T')[0] }}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </Stack>

                  <TextField
                    label="Number of Guests"
                    type="number"
                    required
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: room.capacity } }}
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    helperText={`Maximum capacity: ${room.capacity}`}
                  />

                  <TextField
                    label="Special Requests (Optional)"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Any special needs or preferences?"
                    value={requests}
                    onChange={(e) => setRequests(e.target.value)}
                  />

                  {totalPrice > 0 && (
                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight="600">Total Price:</Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="700">${totalPrice}</Typography>
                      </Stack>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={bookingLoading || room.status !== 'available' || bookingSuccess}
                    sx={{ py: 1.5, fontSize: '1.1rem' }}
                  >
                    {bookingLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Booking'}
                  </Button>

                  {room.status !== 'available' && (
                    <Typography color="error" variant="body2" textAlign="center">
                      This room is currently not available for booking.
                    </Typography>
                  )}
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
