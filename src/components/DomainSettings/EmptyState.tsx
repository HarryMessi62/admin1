import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { Domain as DomainIcon } from '@mui/icons-material';

export const EmptyState: React.FC = () => {
  return (
    <Box sx={{ 
      textAlign: 'center', 
      py: 8,
      backgroundColor: '#1e293b',
      borderRadius: 3,
      border: '1px solid rgba(59, 130, 246, 0.1)'
    }}>
      <DomainIcon sx={{ 
        fontSize: 64, 
        color: '#64748b', 
        mb: 2 
      }} />
      <Typography variant="h6" sx={{ color: '#cbd5e1', mb: 2 }}>
        Нет доменов для настройки
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        Сначала создайте домены в разделе "Управление доменами"
      </Typography>
    </Box>
  );
}; 