import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Box,
  alpha,
  Button,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function MyProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const profile = user?.profile;
  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
    : '?';

  const address = profile?.address;
  const addressStr = address
    ? [address.street, address.city, address.state, address.country, address.zipCode]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif' }}>
          My Profile
        </Typography>
      </Stack>

      <Card
        sx={{
          overflow: 'visible',
          position: 'relative',
          pt: 6,
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 40%)`,
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 80,
            height: 80,
            fontSize: 32,
            bgcolor: 'primary.main',
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            border: (theme) => `4px solid ${theme.palette.background.paper}`,
            boxShadow: 3,
          }}
        >
          {initials}
        </Avatar>

        <CardContent sx={{ textAlign: 'center', pt: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            {profile?.firstName} {profile?.lastName}
          </Typography>
          <Chip
            label={user?.role.toUpperCase()}
            color="primary"
            size="small"
            sx={{ mb: 3 }}
          />

          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2.5} alignItems="flex-start" sx={{ textAlign: 'left' }}>
            <InfoRow icon={<EmailIcon />} label="Email" value={user?.email} />
            <InfoRow icon={<PhoneIcon />} label="Phone" value={profile?.phone} />
            {addressStr && (
              <InfoRow icon={<LocationIcon />} label="Address" value={addressStr} />
            )}
          </Stack>

          {user?.createdAt && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" color="text.secondary">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value ?? '—'}</Typography>
      </Box>
    </Stack>
  );
}
