import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

export const LoadingState: React.FC = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh',
      gap: 2
    }}>
      <CircularProgress sx={{ color: '#3b82f6' }} />
      <Typography variant="h6" sx={{ color: '#cbd5e1' }}>
        Загрузка настроек доменов...
      </Typography>
    </Box>
  );
}; 