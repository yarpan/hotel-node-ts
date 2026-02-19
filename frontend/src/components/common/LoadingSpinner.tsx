import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <CircularProgress
        sx={{
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
        size={48}
        thickness={4}
      />
    </Box>
  );
}
