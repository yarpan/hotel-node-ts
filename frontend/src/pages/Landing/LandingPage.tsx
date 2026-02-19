import { Box, Typography, Button, Container, Stack, alpha } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Search as SearchIcon, Star as StarIcon, Wifi as WifiIcon, Pool as PoolIcon } from '@mui/icons-material';

export default function LandingPage() {
  return (
    <Box>
      {/* ── Hero Section ──────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.08)} 50%, ${theme.palette.background.default} 100%)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: (theme) => alpha(theme.palette.primary.main, 0.05),
            filter: 'blur(80px)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'primary.main',
              letterSpacing: '0.2em',
              mb: 2,
              display: 'block',
              fontSize: '0.85rem',
            }}
          >
            ★ ★ ★ ★ ★  Luxury Accommodation
          </Typography>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem', lg: '4.5rem' },
              mb: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.text.primary} 30%, ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}
          >
            Experience Luxury{' '}
            <Box component="br" sx={{ display: { xs: 'none', md: 'block' } }} />
            Beyond Expectations
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 560,
              mx: 'auto',
              mb: 5,
              fontWeight: 400,
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.15rem' },
            }}
          >
            Discover unparalleled comfort and sophistication at Grand Hotel.
            Where every moment becomes an unforgettable memory.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/register"
              startIcon={<SearchIcon />}
              sx={{ px: 5, py: 1.5, fontSize: '1rem' }}
            >
              Book Your Stay
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/login"
              sx={{ px: 5, py: 1.5, fontSize: '1rem' }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ── Features Section ──────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          textAlign="center"
          sx={{ mb: 6, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
        >
          Why Choose Grand Hotel
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={4}
          justifyContent="center"
        >
          {[
            {
              icon: <StarIcon sx={{ fontSize: 40 }} />,
              title: 'Premium Rooms',
              desc: 'Elegantly designed rooms from singles to presidential suites.',
            },
            {
              icon: <WifiIcon sx={{ fontSize: 40 }} />,
              title: 'Modern Amenities',
              desc: 'High-speed WiFi, smart TVs, and premium toiletries.',
            },
            {
              icon: <PoolIcon sx={{ fontSize: 40 }} />,
              title: 'World-Class Facilities',
              desc: 'Pool, spa, fitness center, and fine-dining restaurants.',
            },
          ].map((feature) => (
            <Box
              key={feature.title}
              sx={{
                flex: 1,
                textAlign: 'center',
                p: 4,
                borderRadius: 3,
                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => `0 12px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.desc}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Container>

      {/* ── Footer ────────────────────────────────────────────── */}
      <Box
        sx={{
          py: 4,
          textAlign: 'center',
          borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Grand Hotel. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
