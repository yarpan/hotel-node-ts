import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  Stack,
  alpha,
} from '@mui/material';
import { Visibility, VisibilityOff, Hotel as HotelIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <HotelIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif' }}>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Join Grand Hotel and start booking
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
              <TextField
                label="First Name"
                autoFocus
                {...register('firstName', { required: 'First name is required' })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
              <TextField
                label="Last Name"
                {...register('lastName', { required: 'Last name is required' })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Stack>

            <TextField
              label="Email Address"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Phone Number"
              {...register('phone', { required: 'Phone number is required' })}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" color="primary">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
