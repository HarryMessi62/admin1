import React, { useState } from 'react';
import {
  Box,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { 
  DomainSettingsCard, 
  EmptyState, 
  LoadingState 
} from '../components/DomainSettings';
import { PageHeader } from '../components/UI';

export const DomainSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' 
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Получение доменов
  const { data: domainsData, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => apiService.getDomains({ page: 1, limit: 100 }),
  });

  // Мутация для обновления настроек домена
  const updateDomainMutation = useMutation({
    mutationFn: ({ id, settings }: { 
      id: string; 
      settings: { commentsEnabled: boolean; allowFakePosts: boolean } 
    }) => apiService.updateDomain(id, { 
      settings: {
        ...settings,
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setSnackbar({ 
        open: true, 
        message: 'Настройки домена успешно обновлены', 
        severity: 'success' 
      });
    },
    onError: () => {
      setSnackbar({ 
        open: true, 
        message: 'Ошибка обновления настроек домена', 
        severity: 'error' 
      });
    },
  });

  const handleUpdateDomain = (id: string, settings: { commentsEnabled: boolean; allowFakePosts: boolean }) => {
    updateDomainMutation.mutate({ id, settings });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const domains = domainsData?.data || [];

  return (
    <Box>
      <PageHeader 
        title="Настройки доменов"
        subtitle="Управляйте функциональностью каждого домена"
      />

      {/* Список доменов */}
      {domains.length === 0 ? (
        <EmptyState />
      ) : (
        <Grid container spacing={3}>
          {domains.map((domain) => (
            <Grid item xs={12} md={6} lg={4} key={domain._id}>
              <DomainSettingsCard
                domain={domain}
                onUpdate={handleUpdateDomain}
                isUpdating={updateDomainMutation.isPending}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            backgroundColor: snackbar.severity === 'success' ? '#064e3b' : '#7f1d1d',
            color: '#f8fafc',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 