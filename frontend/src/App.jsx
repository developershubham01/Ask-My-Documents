import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from '@mui/material';
import ArticleOutlined from '@mui/icons-material/ArticleOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import HealthAndSafetyOutlined from '@mui/icons-material/HealthAndSafetyOutlined';
import SendRounded from '@mui/icons-material/SendRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import { darkTheme, lightTheme } from './theme';
import './App.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 60000,
});

const starterQuestions = [
  'What is this document about?',
  'Summarize the main points with citations.',
  'Which page mentions the key requirements?',
];

function App() {
  const [documents, setDocuments] = useState([]);
  const [health, setHealth] = useState(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Upload one or more PDFs, then ask a question. I will answer from the indexed text and include page citations.',
      sources: [],
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const chatEndRef = useRef(null);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  const refresh = useCallback(async () => {
    const [healthResult, docsResult] = await Promise.all([
      api.get('/health'),
      api.get('/documents'),
    ]);
    setHealth(healthResult.data);
    setDocuments(docsResult.data.documents || []);
  }, []);

  useEffect(() => {
    refresh().catch(() => {
      setNotice({
        severity: 'warning',
        text: 'Backend is not reachable yet. Start FastAPI on port 8000.',
      });
    });
  }, [refresh]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length) {
        setNotice({ severity: 'error', text: 'Only PDF files up to 50MB are supported.' });
        return;
      }
      if (!acceptedFiles.length) return;

      setUploading(true);
      setNotice(null);
      const body = new FormData();
      acceptedFiles.forEach((file) => body.append('files', file));

      try {
        const result = await api.post('/upload', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const count = result.data.documents?.length || acceptedFiles.length;
        setNotice({
          severity: 'success',
          text: `${count} PDF ${count === 1 ? 'is' : 'are'} ready for questions.`,
        });
        await refresh();
      } catch (error) {
        setNotice({ severity: 'error', text: getErrorMessage(error) });
      } finally {
        setUploading(false);
      }
    },
    [refresh],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  });

  async function askQuestion(event) {
    event?.preventDefault();
    const text = query.trim();
    if (!text || busy) return;

    setQuery('');
    setBusy(true);
    setNotice(null);
    setMessages((current) => [...current, { role: 'user', content: text, sources: [] }]);

    try {
      const result = await api.post('/query', { query: text, top_k: 5, threshold: 0 });
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.data.answer,
          sources: result.data.sources || [],
          meta: `${Math.round(result.data.processing_time_ms)} ms - confidence ${Math.round(
            result.data.confidence * 100,
          )}%`,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: getErrorMessage(error), sources: [], error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(documentId) {
    try {
      await api.delete(`/documents/${documentId}`);
      await refresh();
      setNotice({ severity: 'success', text: 'Document removed from the index.' });
    } catch (error) {
      setNotice({ severity: 'error', text: getErrorMessage(error) });
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="appShell">
        <Paper className="sidebar" elevation={0}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Box>
                <Typography variant="h5">Ask My Documents</Typography>
                <Typography variant="body2" color="text.secondary">
                  Local PDF Q&A with citations
                </Typography>
              </Box>
              <Tooltip title={darkMode ? 'Use light mode' : 'Use dark mode'}>
                <IconButton onClick={() => setDarkMode((value) => !value)} size="small">
                  <HealthAndSafetyOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box {...getRootProps()} className={`dropZone ${isDragActive ? 'dropZoneActive' : ''}`}>
              <input {...getInputProps()} />
              <UploadFileRounded color="primary" />
              <Typography variant="subtitle1">Drop PDFs here</Typography>
              <Typography variant="body2" color="text.secondary">
                or click to choose files
              </Typography>
              {uploading && <LinearProgress sx={{ mt: 2, width: '100%' }} />}
            </Box>

            {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${health?.documents ?? documents.length} docs`} size="small" />
              <Chip label={`${health?.chunks ?? 0} chunks`} size="small" />
              <Chip
                label={health ? 'API online' : 'API offline'}
                color={health ? 'success' : 'warning'}
                size="small"
              />
            </Stack>

            <Divider />

            <Stack spacing={1.5} sx={{ minHeight: 0, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Documents
              </Typography>
              <List className="documentList">
                {documents.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No PDFs indexed yet.
                  </Typography>
                )}
                {documents.map((doc) => (
                  <ListItem
                    key={doc.document_id}
                    disablePadding
                    secondaryAction={
                      <Tooltip title="Delete document">
                        <IconButton edge="end" onClick={() => deleteDocument(doc.document_id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ArticleOutlined fontSize="small" className="docIcon" />
                    <ListItemText
                      primary={doc.filename}
                      secondary={`${doc.num_pages} pages - ${doc.num_chunks} chunks`}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          </Stack>
        </Paper>

        <main className="chatPane">
          <Stack className="chatHeader" direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4">Document Chat</Typography>
              <Typography variant="body2" color="text.secondary">
                Answers are grounded in uploaded PDF passages.
              </Typography>
            </Box>
          </Stack>

          <Box className="messages">
            {messages.map((message, index) => (
              <Box key={`${message.role}-${index}`} className={`message ${message.role} ${message.error ? 'error' : ''}`}>
                <Typography component="pre" className="messageText">
                  {message.content}
                </Typography>
                {message.meta && (
                  <Typography variant="caption" color="text.secondary">
                    {message.meta}
                  </Typography>
                )}
                {message.sources?.length > 0 && (
                  <Stack spacing={1} className="sources">
                    {message.sources.map((source, sourceIndex) => (
                      <Paper
                        key={`${source.document_id}-${source.page_number}-${sourceIndex}`}
                        variant="outlined"
                        className="sourceItem"
                      >
                        <Typography variant="caption" color="primary">
                          {source.document_name} - page {source.page_number} -{' '}
                          {Math.round(source.relevance_score * 100)}%
                        </Typography>
                        <Typography variant="body2">{source.chunk_text}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
            {busy && (
              <Box className="message assistant">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography variant="body2">Searching your documents...</Typography>
                </Stack>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Box>

          {documents.length > 0 && (
            <Stack direction="row" spacing={1} className="suggestions">
              {starterQuestions.map((item) => (
                <Button key={item} size="small" variant="outlined" onClick={() => setQuery(item)}>
                  {item}
                </Button>
              ))}
            </Stack>
          )}

          <Box component="form" className="queryBar" onSubmit={askQuestion}>
            <TextField
              fullWidth
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask about your uploaded PDFs..."
              disabled={busy}
              size="small"
            />
            <Tooltip title="Send question">
              <span>
                <IconButton color="primary" type="submit" disabled={!query.trim() || busy}>
                  <SendRounded />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </main>
      </Box>
    </ThemeProvider>
  );
}

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.detail || error?.message || 'Something went wrong.';
}

export default App;
