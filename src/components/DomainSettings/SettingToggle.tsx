import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
} from '@mui/material';

interface SettingToggleProps {
  name: string;
  value: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  backgroundColor: string;
  borderColor: string;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  name,
  value,
  onChange,
  title,
  description,
  icon,
  color,
  backgroundColor,
  borderColor,
}) => {
  return (
    <Box sx={{
      p: 2,
      backgroundColor,
      borderRadius: 2,
      border: `1px solid ${borderColor}`,
    }}>
      <FormControlLabel
        control={
          <Switch 
            name={name}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: color,
              },
            }}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {React.cloneElement(icon, { 
              sx: { color: value ? color : '#64748b' } 
            })}
            <Box>
              <Typography sx={{ 
                color: '#f8fafc', 
                fontWeight: 600,
                fontSize: '0.95rem' 
              }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                {description}
              </Typography>
            </Box>
          </Box>
        }
        sx={{ width: '100%', m: 0 }}
      />
    </Box>
  );
}; 