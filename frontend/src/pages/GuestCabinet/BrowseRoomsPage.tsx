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
  Grid,
} from '@mui/material';
import {
  Hotel as RoomIcon,
  People as CapacityIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import roomService from '../../services/room.service';
import type { Room, RoomStatus } from '../../types';

const statusColor: Record<RoomStatus, 'success' | 'error' | 'warning'> = {
  available: 'success',
  occupied: 'error',
  maintenance: 'warning',
};

export default function BrowseRoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    roomService
      .getRooms()
      .then((res) => {
        setRooms(res.data?.rooms ?? []);
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? 'Failed to load rooms.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <RoomIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif' }}>
          Browse Rooms
        </Typography>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && !error && rooms.length === 0 && (
        <Card
          sx={{
            textAlign: 'center',
            py: 8,
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        >
          <CardContent>
            <RoomIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No rooms available at the moment
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {rooms.map((room) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
            <Card
              onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
              }}
            >
              {/* Colour band at top */}
              <Box
                sx={{
                  height: 6,
                  borderRadius: '4px 4px 0 0',
                  background: (theme) =>
                    `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.6)})`,
                }}
              />
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="h6">Room {room.roomNumber}</Typography>
                  <Chip label={room.status} color={statusColor[room.status]} size="small" />
                </Stack>

                <Chip
                  label={room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                  variant="outlined"
                  size="small"
                  sx={{ alignSelf: 'flex-start', mb: 1.5 }}
                />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                  {room.description || 'A comfortable room for your stay.'}
                </Typography>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CapacityIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                    ${room.pricePerNight}
                    <Typography component="span" variant="body2" color="text.secondary">
                      /night
                    </Typography>
                  </Typography>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" fullWidth size="small">
                    Book Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
