import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Pagination,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

interface ArticleStatsManagerProps {
  articleId: string;
  initialStats?: {
    likes?: {
      real?: number;
      fake?: number;
      total?: number;
    } | number;
    comments?: {
      real?: number;
      fake?: number;
      total?: number;
    } | number;
  } | any; // Добавляем any для совместимости с различными форматами
}

interface Comment {
  _id: string;
  userEmail: string;
  text: string;
  userId: string;
  likes: number;
  createdAt: string;
}

export const ArticleStatsManager: React.FC<ArticleStatsManagerProps> = ({
  articleId,
  initialStats
}) => {
  const queryClient = useQueryClient();
  // Поддерживаем разные форматы данных о лайках
  const getInitialLikes = () => {
    // Проверяем stats.likes.total
    if (initialStats?.stats?.likes?.total) return initialStats.stats.likes.total;
    // Проверяем прямое поле likes
    if (initialStats?.likes?.total) return initialStats.likes.total;
    if (typeof initialStats?.likes === 'number') return initialStats.likes;
    return 0;
  };
  
  const [likesCount, setLikesCount] = useState(getInitialLikes());

  // Функция для получения количества комментариев
  const getInitialComments = () => {
    // Проверяем stats.comments.total
    if (initialStats?.stats?.comments?.total) return initialStats.stats.comments.total;
    // Проверяем прямое поле comments
    if (initialStats?.comments?.total) return initialStats.comments.total;
    if (typeof initialStats?.comments === 'number') return initialStats.comments;
    return 0;
  };

  // Обновляем состояние лайков при изменении initialStats
  useEffect(() => {
    console.log('📊 ArticleStatsManager - initialStats:', initialStats);
    console.log('📊 ArticleStatsManager - likesCount:', getInitialLikes());
    console.log('📊 ArticleStatsManager - commentsCount:', getInitialComments());
    setLikesCount(getInitialLikes());
  }, [initialStats]);
  const [addCommentDialogOpen, setAddCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState({
    userEmail: '',
    text: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [commentsPage, setCommentsPage] = useState(1);

  // Загрузка комментариев
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['article-comments', articleId, commentsPage],
    queryFn: () => apiService.getArticleComments(articleId, { page: commentsPage, limit: 10 }),
    enabled: !!articleId,
  });

  // Мутации для обновления лайков
  const updateLikesMutation = useMutation({
    mutationFn: (totalLikes: number) =>
      apiService.updateArticleStats(articleId, { likes: { total: totalLikes } }),
    onSuccess: () => {
      setSuccessMessage('Лайки успешно обновлены');
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Ошибка обновления лайков');
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  // Мутация для добавления комментария
  const addCommentMutation = useMutation({
    mutationFn: (data: { userEmail: string; text: string }) =>
      apiService.addAdminComment(articleId, data),
    onSuccess: () => {
      setSuccessMessage('Комментарий добавлен');
      setAddCommentDialogOpen(false);
      setNewComment({ userEmail: '', text: '' });
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Ошибка добавления комментария');
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  // Мутация для удаления комментария
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiService.deleteAdminComment(commentId),
    onSuccess: () => {
      setSuccessMessage('Комментарий удален');
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Ошибка удаления комментария');
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const handleLikesUpdate = () => {
    updateLikesMutation.mutate(likesCount);
  };

  const handleAddComment = () => {
    if (!newComment.userEmail.trim() || !newComment.text.trim()) {
      setErrorMessage('Заполните все поля');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    addCommentMutation.mutate(newComment);
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  const isAdminComment = (userId: string) => userId.startsWith('admin_');

  return (
    <Box sx={{ mt: 3 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Управление лайками */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ThumbUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Лайки</Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Количество лайков"
                type="number"
                value={likesCount}
                onChange={(e) => setLikesCount(Math.max(0, parseInt(e.target.value) || 0))}
                inputProps={{ min: 0 }}
                sx={{ mb: 2 }}
              />

              <Box>
                <Typography variant="body2" color="textSecondary">
                  Текущее количество лайков: <strong>{likesCount}</strong>
                </Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleLikesUpdate}
                disabled={updateLikesMutation.isPending}
              >
                Сохранить
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Управление комментариями */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <CommentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Комментарии</Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => refetchComments()}
                    sx={{ mr: 1 }}
                  >
                    Обновить
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddCommentDialogOpen(true)}
                  >
                    Добавить
                  </Button>
                </Box>
              </Box>

              {commentsData && (
                <Box>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Всего комментариев: <strong>{commentsData.total}</strong> 
                    {getInitialComments() > 0 && (
                      <span> • В статье: <strong>{getInitialComments()}</strong></span>
                    )}
                  </Typography>

                  {commentsData.comments.length > 0 ? (
                    <>
                      <List dense>
                        {commentsData.comments.map((comment: Comment) => (
                          <ListItem key={comment._id} divider>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {comment.userEmail}
                                  </Typography>
                                  {isAdminComment(comment.userId) && (
                                    <Chip
                                      label="Админ"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {comment.text}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {formatDate(comment.createdAt)} • {comment.likes} лайков
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleDeleteComment(comment._id)}
                                disabled={deleteCommentMutation.isPending}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>

                      {commentsData.totalPages > 1 && (
                        <Box display="flex" justifyContent="center" mt={2}>
                          <Pagination
                            count={commentsData.totalPages}
                            page={commentsPage}
                            onChange={(_, page) => setCommentsPage(page)}
                            size="small"
                          />
                        </Box>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                      Комментарии отсутствуют
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Диалог добавления комментария */}
      <Dialog
        open={addCommentDialogOpen}
        onClose={() => setAddCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Добавить комментарий</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Email пользователя"
              type="email"
              value={newComment.userEmail}
              onChange={(e) => setNewComment(prev => ({ ...prev, userEmail: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Текст комментария"
              multiline
              rows={4}
              value={newComment.text}
              onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
              inputProps={{ maxLength: 1000 }}
              helperText={`${newComment.text.length}/1000 символов`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCommentDialogOpen(false)}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={addCommentMutation.isPending}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 