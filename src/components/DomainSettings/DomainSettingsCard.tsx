import React from 'react';
import {
  Card,
  CardContent,
} from '@mui/material';
import { type Domain } from '../../types/api';
import { DomainHeader } from './DomainHeader';
import { DomainSettingsForm } from './DomainSettingsForm';

interface DomainSettingsFormData {
  commentsEnabled: boolean;
  allowFakePosts: boolean;
}

interface DomainSettingsCardProps {
  domain: Domain;
  onUpdate: (id: string, settings: { commentsEnabled: boolean; allowFakePosts: boolean }) => void;
  isUpdating: boolean;
}

export const DomainSettingsCard: React.FC<DomainSettingsCardProps> = ({ 
  domain, 
  onUpdate, 
  isUpdating 
}) => {
  const handleSubmit = (data: DomainSettingsFormData) => {
    onUpdate(domain._id, data);
  };

  const initialValues: DomainSettingsFormData = {
    commentsEnabled: domain.settings?.commentsEnabled || false,
    allowFakePosts: domain.settings?.allowFakePosts || false,
  };

  return (
    <Card sx={{
      backgroundColor: '#1e293b',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      borderRadius: 3,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <DomainHeader domain={domain} />
        <DomainSettingsForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isUpdating={isUpdating}
        />
      </CardContent>
    </Card>
  );
}; 