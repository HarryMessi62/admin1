import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h3" sx={{ 
        fontWeight: 700,
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 1
      }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
        {subtitle}
      </Typography>
    </Box>
  );
}; 