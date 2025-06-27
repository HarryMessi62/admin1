import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { SettingToggle } from './SettingToggle';

interface DomainSettingsFormData {
  commentsEnabled: boolean;
  allowFakePosts: boolean;
}

interface DomainSettingsFormProps {
  initialValues: DomainSettingsFormData;
  onSubmit: (data: DomainSettingsFormData) => void;
  isUpdating: boolean;
}

export const DomainSettingsForm: React.FC<DomainSettingsFormProps> = ({
  initialValues,
  onSubmit,
  isUpdating,
}) => {
  const { control, handleSubmit, watch } = useForm<DomainSettingsFormData>({
    defaultValues: initialValues,
  });

  const commentsEnabled = watch('commentsEnabled');
  const allowFakePosts = watch('allowFakePosts');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ 
            color: '#f8fafc', 
            fontWeight: 600, 
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <SettingsIcon color="primary" />
            Настройки функций
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="commentsEnabled"
            control={control}
            render={({ field }) => (
              <SettingToggle
                name="commentsEnabled"
                value={field.value}
                onChange={field.onChange}
                title="Комментарии"
                description="Разрешить пользователям комментировать статьи"
                icon={<CommentIcon />}
                color="#3b82f6"
                backgroundColor="rgba(59, 130, 246, 0.05)"
                borderColor="rgba(59, 130, 246, 0.1)"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="allowFakePosts"
            control={control}
            render={({ field }) => (
              <SettingToggle
                name="allowFakePosts"
                value={field.value}
                onChange={field.onChange}
                title="Фейк посты"
                description="Разрешить создание постов с искусственной статистикой"
                icon={<VisibilityIcon />}
                color="#a855f7"
                backgroundColor="rgba(168, 85, 247, 0.05)"
                borderColor="rgba(168, 85, 247, 0.1)"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            disabled={isUpdating}
            fullWidth
            sx={{
              mt: 2,
              py: 1.5,
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
              },
              '&:disabled': {
                background: 'rgba(100, 116, 139, 0.5)',
              }
            }}
          >
            {isUpdating ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}; 