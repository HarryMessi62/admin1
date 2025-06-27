import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, Button, Paper, Typography, Modal, IconButton } from '@mui/material';
import { Preview, Close } from '@mui/icons-material';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/quill-theme.css';
import '../styles/quill-preview.css';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  featuredImage?: string;
  title?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Начните писать контент статьи...',
  height = 400,
  featuredImage = '',
  title = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    // Расширенная конфигурация с множеством возможностей
    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
          ]
    },
    clipboard: {
      matchVisual: false,
        },
        history: {
          delay: 1000,
          maxStack: 50,
          userOnly: true
    }
      },
      formats: [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script',
    'code-block', 'direction'
      ]
    });

    quillRef.current = quill;
    setIsReady(true);

    // Устанавливаем начальное значение
    if (value && value !== quill.root.innerHTML) {
      quill.root.innerHTML = value;
    }

    // Обработчик изменений
    const handleTextChange = () => {
      const content = quill.root.innerHTML;
      if (onChange && content !== value) {
        onChange(content);
      }
    };

    quill.on('text-change', handleTextChange);

    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change', handleTextChange);
        quillRef.current = null;
      }
      setIsReady(false);
    };
  }, []);

  // Обновляем содержимое когда value изменяется извне
  useEffect(() => {
    if (quillRef.current && isReady && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value, isReady]);

  // Обработчик закрытия по Esc
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPreview) {
        setShowPreview(false);
      }
    };

    if (showPreview) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPreview]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Кнопка предпросмотра */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          variant="outlined"
          startIcon={<Preview />}
          onClick={() => setShowPreview(true)}
          sx={{
            color: '#3b82f6',
            borderColor: '#3b82f6',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderColor: '#2563eb'
            }
          }}
        >
          Предпросмотр
        </Button>
      </Box>
      
      {/* Редактор */}
      <Box 
        className="rich-text-editor-container"
        sx={{ 
          width: '100%',
          '& .ql-toolbar': {
            backgroundColor: '#334155',
            borderColor: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '8px 8px 0 0',
            '& .ql-picker': {
              color: '#f8fafc'
            },
            '& .ql-picker-options': {
              backgroundColor: '#1e293b',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '4px'
            },
            '& .ql-picker-item': {
              color: '#f8fafc',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }
            },
            '& .ql-stroke': {
              stroke: '#f8fafc'
            },
            '& .ql-fill': {
              fill: '#f8fafc'
            },
            '& button': {
              color: '#f8fafc',
              '&:hover': {
                color: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              },
              '&.ql-active': {
                color: '#3b82f6'
              }
            }
          },
          '& .ql-container': {
            borderColor: 'rgba(59, 130, 246, 0.2)',
            backgroundColor: '#1e293b',
            borderRadius: '0 0 8px 8px',
            fontFamily: 'inherit'
          },
                      '& .ql-editor': {
            minHeight: '400px',
            fontSize: '16px',
            lineHeight: 1.7,
            color: '#f8fafc',
            backgroundColor: '#1e293b',
            '& p': {
              marginBottom: '12px',
              fontSize: '16px',
              lineHeight: 1.7
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: '#f8fafc',
              fontWeight: 600,
              marginTop: '24px',
              marginBottom: '16px'
            },
            '& h1': { fontSize: '2.25rem', lineHeight: 1.3 },
            '& h2': { fontSize: '1.875rem', lineHeight: 1.3 },
            '& h3': { fontSize: '1.5rem', lineHeight: 1.4 },
            '& h4': { fontSize: '1.25rem', lineHeight: 1.4 },
            '& h5': { fontSize: '1.125rem', lineHeight: 1.5 },
            '& h6': { fontSize: '1rem', lineHeight: 1.5 },
            '& blockquote': {
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '16px',
              margin: '16px 0',
              fontStyle: 'italic',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '12px 16px',
              borderRadius: '0 8px 8px 0',
              color: '#cbd5e1'
            },
            '& pre': {
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: 1.5,
              overflowX: 'auto',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            },
            '& code': {
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            },
            '& .ql-code-block': {
              backgroundColor: '#0f172a !important',
              color: '#e2e8f0 !important',
              padding: '16px !important',
              borderRadius: '8px !important',
              fontSize: '14px !important',
              lineHeight: '1.5 !important',
              border: '1px solid rgba(59, 130, 246, 0.2) !important',
              fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important',
              margin: '16px 0 !important',
              whiteSpace: 'pre-wrap !important',
              wordBreak: 'break-word !important'
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              margin: '10px 0',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            },
            '& iframe': {
              borderRadius: '8px',
              margin: '10px 0',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            },
            '& ul, & ol': {
              paddingLeft: '24px',
              color: '#f8fafc'
            },
            '& li': {
              marginBottom: '8px'
            },
            '& a': {
              color: '#3b82f6',
              textDecoration: 'underline',
              '&:hover': {
                color: '#2563eb'
              }
            },
            '&.ql-blank::before': {
              color: '#64748b',
              fontStyle: 'italic'
            }
          }
        }}
      >
        <div ref={containerRef} />
      </Box>

      {/* Модальное окно предпросмотра */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        aria-labelledby="preview-modal"
        sx={{
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{
          width: '95%',
          maxWidth: '1000px',
          maxHeight: '95%',
          bgcolor: '#0f172a',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Заголовок модального окна с градиентом */}
          <Box sx={{
            background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography sx={{ fontSize: '1.2rem' }}>👁️</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, mb: 0.5 }}>
                  Предпросмотр статьи
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                  Так будет выглядеть ваша статья для читателей
                </Typography>
              </Box>
            </Box>
          <IconButton
              onClick={() => setShowPreview(false)}
            sx={{
                color: '#cbd5e1',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
              '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#f8fafc'
              }
            }}
          >
              <Close />
          </IconButton>
          </Box>
          
          {/* Контент предпросмотра с прокруткой */}
          <Box 
            sx={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#1e293b',
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(59, 130, 246, 0.1)'
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                borderRadius: '4px'
              }
            }}
          >
            <Box sx={{ 
              p: 4,
              maxWidth: '800px',
              mx: 'auto',
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: '#f8fafc',
                fontWeight: 600,
                marginTop: '28px',
                marginBottom: '16px',
                lineHeight: 1.3
              },
              '& h1': { 
                fontSize: '2.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginTop: '16px'
              },
              '& h2': { fontSize: '2rem' },
              '& h3': { fontSize: '1.5rem' },
              '& h4': { fontSize: '1.25rem' },
              '& h5': { fontSize: '1.125rem' },
              '& h6': { fontSize: '1rem' },
              '& p': {
                color: '#f8fafc',
                lineHeight: 1.8,
                marginBottom: '16px',
                fontSize: '16px',
                wordBreak: 'break-word'
              },
              '& blockquote': {
                borderLeft: '4px solid #3b82f6',
                paddingLeft: '20px',
                margin: '24px 0',
                fontStyle: 'italic',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '16px 20px',
                borderRadius: '0 12px 12px 0',
                color: '#cbd5e1',
                fontSize: '18px'
              },
              '& pre': {
                backgroundColor: '#0f172a !important',
                color: '#e2e8f0 !important',
                padding: '20px !important',
                borderRadius: '12px !important',
                fontSize: '14px !important',
                lineHeight: '1.6 !important',
                overflowX: 'auto !important',
                border: '1px solid rgba(59, 130, 246, 0.2) !important',
                margin: '20px 0 !important',
                fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important',
                whiteSpace: 'pre-wrap !important',
                wordBreak: 'break-word !important'
              },
              '& .ql-code-block': {
                backgroundColor: '#0f172a !important',
                color: '#e2e8f0 !important',
                padding: '20px !important',
                borderRadius: '12px !important',
                fontSize: '14px !important',
                lineHeight: '1.6 !important',
                border: '1px solid rgba(59, 130, 246, 0.2) !important',
                fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important',
                margin: '20px 0 !important',
                whiteSpace: 'pre-wrap !important',
                wordBreak: 'break-word !important'
              },
              '& code': {
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                wordBreak: 'break-all'
              },
              '& pre code': {
                backgroundColor: 'transparent',
                color: 'inherit',
                padding: '0',
                borderRadius: '0'
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '12px',
                margin: '24px 0',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              },
              '& iframe': {
                borderRadius: '12px',
                margin: '24px 0',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              },
              '& ul, & ol': {
                paddingLeft: '24px',
                color: '#f8fafc',
                margin: '16px 0'
              },
              '& li': {
                marginBottom: '8px',
                lineHeight: 1.7
              },
              '& ul li::marker': {
                color: '#3b82f6'
              },
              '& ol li::marker': {
                color: '#3b82f6',
                fontWeight: 600
              },
              '& a': {
                color: '#3b82f6',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(59, 130, 246, 0.5)',
                textUnderlineOffset: '3px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#2563eb',
                  textDecorationColor: '#2563eb'
                }
              },
              '& strong': {
                color: '#f8fafc',
                fontWeight: 700
              },
              '& em': {
                color: '#cbd5e1',
                fontStyle: 'italic'
              },
              '& hr': {
                border: 'none',
                height: '2px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                margin: '32px 0',
                borderRadius: '1px'
              }
            }}>
              {/* Заголовок статьи если есть */}
              {title && (
                <Typography variant="h1" sx={{ 
                  fontSize: '2.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                  lineHeight: 1.2
                }}>
                  {title}
                </Typography>
              )}

              {/* Изображение-превью если есть */}
              {featuredImage && (
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={featuredImage}
                    alt="Превью статьи"
                    crossOrigin="anonymous"
                    sx={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'cover',
                      borderRadius: '16px',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)'
                    }}
                    onError={(e) => {
                      console.error('Preview image load error:', e);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </Box>
              )}

              {value ? (
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: value }} />
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  color: '#64748b'
                }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    📝 Контент отсутствует
                  </Typography>
                  <Typography variant="body2">
                    Начните писать в редакторе, чтобы увидеть предпросмотр
                  </Typography>
                </Box>
              )}
            </Box>
      </Box>

          {/* Нижняя панель с информацией */}
          <Box sx={{
            background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
            p: 2,
            borderTop: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
              💡 Нажмите Esc или кликните ❌ чтобы закрыть
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ 
                color: '#64748b',
                fontSize: '0.75rem'
              }}>
                Символов: {value ? value.replace(/<[^>]*>/g, '').length : 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#64748b',
                fontSize: '0.75rem'
              }}>
                Время чтения: ~{Math.max(1, Math.ceil((value ? value.replace(/<[^>]*>/g, '').length : 0) / 1000))} мин
              </Typography>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}; 