import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import { Domain as DomainIcon } from '@mui/icons-material';
import { type Domain } from '../../types/api';

interface DomainHeaderProps {
  domain: Domain;
}

export const DomainHeader: React.FC<DomainHeaderProps> = ({ domain }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      <Avatar sx={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        width: 48,
        height: 48,
      }}>
        <DomainIcon />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600, mb: 0.5 }}>
          {domain.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={domain.isActive ? 'Активен' : 'Неактивен'}
            size="small"
            color={domain.isActive ? 'success' : 'error'}
            sx={{ fontSize: '0.75rem' }}
          />
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {domain.stats?.totalArticles || 0} статей
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}; 