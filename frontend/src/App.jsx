import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { LoginPage, SignUpPage } from './components/AuthPages';
import { WelcomeVideo } from './components/WelcomeVideo';
import { useDropzone } from 'react-dropzone';
import GitHubIcon from '@mui/icons-material/GitHub';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  CssBaseline,
  IconButton,
  LinearProgress,
  Slider,
  Stack,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from '@mui/material';
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import AnalyticsRounded from '@mui/icons-material/AnalyticsRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ArticleOutlined from '@mui/icons-material/ArticleOutlined';
import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CloudDoneRounded from '@mui/icons-material/CloudDoneRounded';
import CloudRounded from '@mui/icons-material/CloudRounded';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorRounded from '@mui/icons-material/ErrorRounded';
import FilterListRounded from '@mui/icons-material/FilterListRounded';
import ForumRounded from '@mui/icons-material/ForumRounded';
import FullscreenRounded from '@mui/icons-material/FullscreenRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import MemoryRounded from '@mui/icons-material/MemoryRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import PlayCircleRounded from '@mui/icons-material/PlayCircleRounded';
import PsychologyRounded from '@mui/icons-material/PsychologyRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import SmartToyRounded from '@mui/icons-material/SmartToyRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import TerminalRounded from '@mui/icons-material/TerminalRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import { lightTheme } from './theme';
import './App.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 60000,
});

const starterQuestions = [
  'What is this document about?',
  'Summarize the main points with citations.',
  'Which page mentions key requirements?',
];

const topTabs = [
  { id: 'library', label: 'Workspace' },
  { id: 'modelLab', label: 'Model Lab' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

const modelCards = [
  {
    id: 'llama3',
    name: 'Llama 3 8B',
    type: 'Local (Ollama)',
    status: 'Active',
    rating: 4,
    icon: MemoryRounded,
    description:
      'Optimized for rapid extraction and summarization on consumer-grade hardware. Excellent privacy focus.',
  },
  {
    id: 'gemini',
    name: 'Gemini 1.5 Flash',
    type: 'Cloud (Google AI)',
    status: 'Connected',
    rating: 5,
    icon: CloudRounded,
    description:
      'Fast cloud reasoning for citation-heavy document analysis and grounded Q&A over indexed PDFs.',
  },
  {
    id: 'mistral',
    name: 'Mistral 7B v0.2',
    type: 'Local (GGUF)',
    status: 'Idle',
    rating: 3,
    icon: SettingsRounded,
    description:
      'Balanced performance for general document queries. Efficient use of memory during concurrent processing.',
  },
];

const marketModels = [
  { id: 'codestral', name: 'Codestral 22B', description: 'Fine-tuned for Python' },
  { id: 'legalmistral', name: 'LegalMistral 7B', description: 'Dataset: EU Regulations' },
  { id: 'phi3', name: 'Phi-3 Mini', description: 'Compact reasoning model' },
];

const sideItems = [
  { id: 'library', label: 'All Documents', icon: ArticleOutlined },
  { id: 'history', label: 'Recently Analyzed', icon: HistoryRounded },
  { id: 'starred', label: 'Starred', icon: StarRounded },
  { id: 'trash', label: 'Trash', icon: DeleteIcon },
];

function Workspace() {
  const [view, setView] = useState('library');
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [health, setHealth] = useState(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [starredIds, setStarredIds] = useState(() => readJson('docanalyzer-starred', []));
  const [recentIds, setRecentIds] = useState(() => readJson('docanalyzer-recent', []));
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
  const [settings, setSettings] = useState({
    engine: 'gemini',
    temperature: 0.7,
    contextLength: 4096,
    strictCitations: true,
    hallucinationGuard: false,
    apiKeyVisible: false,
  });
  const [selectedModelId, setSelectedModelId] = useState('gemini');
  const [playgroundPrompt, setPlaygroundPrompt] = useState('');
  const [playgroundMessages, setPlaygroundMessages] = useState([
    {
      role: 'user',
      content: 'Explain the core difference between Llama 3 and Mistral regarding document context handling.',
    },
    {
      role: 'assistant',
      content:
        'Llama 3 uses grouped-query attention for efficient long-context reasoning, while Mistral 7B is tuned for balanced throughput and memory use. For document analysis, Llama tends to keep coherence better across longer retrieved sections.',
    },
  ]);
  const [marketProgress, setMarketProgress] = useState({ phi3: 45 });
  const [metrics, setMetrics] = useState({
    latency: 42,
    vram: 65,
    throughput: 65,
    bars: [30, 60, 45, 80, 100, 70],
  });
  const messagesRef = useRef(null);
  const queryInputRef = useRef(null);

  const selectedDocument =
    documents.find((doc) => doc.document_id === selectedDocumentId) || documents[0] || null;

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let scoped = documents;
    if (view === 'starred') {
      scoped = documents.filter((doc) => starredIds.includes(doc.document_id));
    }
    if (view === 'history') {
      const recentSet = new Set(recentIds);
      scoped = documents
        .filter((doc) => recentSet.has(doc.document_id))
        .sort((a, b) => recentIds.indexOf(a.document_id) - recentIds.indexOf(b.document_id));
    }
    if (normalizedSearch) {
      scoped = scoped.filter((doc) => doc.filename.toLowerCase().includes(normalizedSearch));
    }
    return scoped;
  }, [documents, recentIds, search, starredIds, view]);

  const refresh = useCallback(async () => {
    const [healthResult, docsResult] = await Promise.all([
      api.get('/health'),
      api.get('/documents'),
    ]);
    const nextDocuments = docsResult.data.documents || [];
    setHealth(healthResult.data);
    setDocuments(nextDocuments);
    setSelectedDocumentId((current) => {
      if (nextDocuments.some((doc) => doc.document_id === current)) return current;
      return nextDocuments[0]?.document_id || null;
    });
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
    localStorage.setItem('docanalyzer-starred', JSON.stringify(starredIds));
  }, [starredIds]);

  useEffect(() => {
    localStorage.setItem('docanalyzer-recent', JSON.stringify(recentIds));
  }, [recentIds]);

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) return;
    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, busy, view]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMetrics((current) => ({
        latency: Math.max(24, Math.min(68, current.latency + Math.round(Math.random() * 10 - 5))),
        vram: Math.max(42, Math.min(82, current.vram + Math.round(Math.random() * 8 - 4))),
        throughput: Math.max(48, Math.min(92, current.throughput + Math.round(Math.random() * 12 - 6))),
        bars: current.bars.map(() => Math.floor(Math.random() * 80) + 20),
      }));
      setMarketProgress((current) => {
        const currentPhi = current.phi3 ?? 0;
        return { ...current, phi3: Math.min(100, currentPhi + 1) };
      });
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

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
        const uploaded = result.data.documents || [];
        const count = uploaded.length || acceptedFiles.length;
        setSelectedDocumentId(uploaded[0]?.document_id || null);
        setView('library');
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

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024,
    multiple: true,
    noClick: true,
  });

  async function askQuestion(event) {
    event?.preventDefault();
    const text = query.trim();
    if (!text || busy) return;

    setView('chat');
    setQuery('');
    setBusy(true);
    setNotice(null);
    setMessages((current) => [...current, { role: 'user', content: text, sources: [] }]);

    try {
      const result = await api.post('/query', { query: text, top_k: 5, threshold: 0 });
      const sources = result.data.sources || [];
      if (sources[0]?.document_id) {
        selectDocument(sources[0].document_id, false);
      }
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.data.answer,
          sources,
          meta: `${Math.round(result.data.processing_time_ms)} ms · confidence ${Math.round(
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

  function handleQueryKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    askQuestion(event);
  }

  async function deleteDocument(documentId) {
    try {
      await api.delete(`/documents/${documentId}`);
      setStarredIds((current) => current.filter((id) => id !== documentId));
      setRecentIds((current) => current.filter((id) => id !== documentId));
      await refresh();
      setNotice({ severity: 'success', text: 'Document removed from the index.' });
    } catch (error) {
      setNotice({ severity: 'error', text: getErrorMessage(error) });
    }
  }

  function documentFileUrl(documentId) {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/documents/${encodeURIComponent(documentId)}/file`;
  }

  function selectDocument(documentId, moveToChat = false) {
    setSelectedDocumentId(documentId);
    setRecentIds((current) => [documentId, ...current.filter((id) => id !== documentId)].slice(0, 12));
    if (moveToChat) setView('chat');
  }

  function openDocument(documentId) {
    selectDocument(documentId);
    window.open(documentFileUrl(documentId), '_blank', 'noopener,noreferrer');
  }

  function askAboutDocument(documentId) {
    selectDocument(documentId, true);
    setQuery('Summarize this document with citations.');
    setTimeout(() => queryInputRef.current?.focus(), 0);
  }

  function toggleStar(documentId) {
    setStarredIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }

  function saveSettings() {
    setNotice({ severity: 'success', text: 'Settings saved for this workspace session.' });
    setView('settings');
  }

  function resetSettings() {
    setSettings({
      engine: 'gemini',
      temperature: 0.7,
      contextLength: 4096,
      strictCitations: true,
      hallucinationGuard: false,
      apiKeyVisible: false,
    });
    setNotice({ severity: 'info', text: 'Settings reset to defaults.' });
  }

  function selectModel(modelId) {
    setSelectedModelId(modelId);
    setNotice({
      severity: 'success',
      text: `${modelCards.find((model) => model.id === modelId)?.name || 'Model'} selected for the lab.`,
    });
  }

  function runPlaygroundTest(event) {
    event?.preventDefault();
    const text = playgroundPrompt.trim();
    if (!text) return;

    const model = modelCards.find((item) => item.id === selectedModelId) || modelCards[0];
    setPlaygroundMessages((current) => [
      ...current,
      { role: 'user', content: text },
      {
        role: 'assistant',
        content: `${model.name} test response: I would ground this answer in retrieved document chunks, preserve page citations, and keep the response concise for review workflows.`,
      },
    ]);
    setPlaygroundPrompt('');
  }

  function downloadMarketModel(modelId) {
    setMarketProgress((current) => ({ ...current, [modelId]: current[modelId] ? current[modelId] : 1 }));
    setNotice({ severity: 'info', text: 'Model download queued in the local model market.' });
  }

  return (
      <Box className="appShell" {...getRootProps()}>
        <input {...getInputProps()} />
        <TopBar view={view} setView={setView} />
        <SideNav
          view={view}
          setView={setView}
          openFilePicker={openFilePicker}
          health={health}
          uploading={uploading}
        />

        <main className={`mainCanvas ${view === 'chat' ? 'chatMode' : ''}`}>
          {notice && (
            <Alert className="globalNotice" severity={notice.severity} onClose={() => setNotice(null)}>
              {notice.text}
            </Alert>
          )}

          {view === 'chat' ? (
            <ChatView
              busy={busy}
              documents={documents}
              messages={messages}
              query={query}
              selectedDocument={selectedDocument}
              setQuery={setQuery}
              askQuestion={askQuestion}
              handleQueryKeyDown={handleQueryKeyDown}
              openFilePicker={openFilePicker}
              documentFileUrl={documentFileUrl}
              openDocument={openDocument}
              messagesRef={messagesRef}
              queryInputRef={queryInputRef}
            />
          ) : view === 'modelLab' ? (
            <ModelLabView
              selectedModelId={selectedModelId}
              selectModel={selectModel}
              playgroundPrompt={playgroundPrompt}
              setPlaygroundPrompt={setPlaygroundPrompt}
              playgroundMessages={playgroundMessages}
              runPlaygroundTest={runPlaygroundTest}
              metrics={metrics}
              marketProgress={marketProgress}
              downloadMarketModel={downloadMarketModel}
              setView={setView}
            />
          ) : view === 'settings' ? (
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              saveSettings={saveSettings}
              resetSettings={resetSettings}
            />
          ) : (
            <LibraryView
              view={view}
              documents={documents}
              visibleDocuments={visibleDocuments}
              health={health}
              search={search}
              setSearch={setSearch}
              starredIds={starredIds}
              isDragActive={isDragActive}
              uploading={uploading}
              openFilePicker={openFilePicker}
              askAboutDocument={askAboutDocument}
              openDocument={openDocument}
              deleteDocument={deleteDocument}
              toggleStar={toggleStar}
              setView={setView}
            />
          )}
        </main>

        <MobileNav view={view} setView={setView} openFilePicker={openFilePicker} />
      </Box>
  );
}

function TopBar({ view, setView }) {
  return (
    <header className="topBar">
      <Stack direction="row" spacing={4} alignItems="center" minWidth={0}>
        <Typography 
          className="topLogo"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}
        >
          DocAnalyzer AI
        </Typography>
        <nav className="topTabs" aria-label="Primary navigation">
          {topTabs.map((tab) => (
            <button
              key={`${tab.id}-${tab.label}`}
              className={view === tab.id || (tab.id === 'library' && view === 'chat') ? 'active' : ''}
              type="button"
              onClick={() => setView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </Stack>
     <Stack direction="row" spacing={1.5} alignItems="center">
  {/* GitHub Icon */}
  <Tooltip title="GitHub">
    <IconButton
      component="a"
      href="https://github.com/developershubham01"
      target="_blank"
      rel="noopener noreferrer"
    >
      <GitHubIcon />
    </IconButton>
  </Tooltip>

  {/* Notification Icon */}
  <Tooltip title="Notifications">
    <IconButton>
      <NotificationsRounded />
    </IconButton>
  </Tooltip>

  {/* User Avatar */}
  <Box
    className="avatar"
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <UserButton afterSignOutUrl="/login" />
  </Box>
</Stack>
    </header>
  );
}

function SideNav({ view, setView, openFilePicker, health, uploading }) {
  return (
    <aside className="sideNav">
      <Box className="kbHeader">
        <Box className="kbIcon">
          <ArticleOutlined />
        </Box>
        <Box minWidth={0}>
          <Typography variant="h6">Knowledge Base</Typography>
          <Typography variant="caption">Local Indexing Active</Typography>
        </Box>
      </Box>

      <Button className="uploadButton" variant="contained" startIcon={<UploadFileRounded />} onClick={openFilePicker}>
        Upload Document
      </Button>
      {uploading && <LinearProgress />}

      <nav className="sideLinks" aria-label="Library navigation">
        {sideItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? 'active' : ''} type="button" onClick={() => setView(id)}>
            <Icon fontSize="small" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <Box className="sideFooter">
        <button type="button">
          <CloudDoneRounded fontSize="small" />
          <span>{health ? 'System Online' : 'System Offline'}</span>
        </button>
        <button className={view === 'settings' ? 'active' : ''} type="button" onClick={() => setView('settings')}>
          <TerminalRounded fontSize="small" />
          <span>API Settings</span>
        </button>
      </Box>
    </aside>
  );
}

function LibraryView({
  view,
  documents,
  visibleDocuments,
  health,
  search,
  setSearch,
  starredIds,
  isDragActive,
  uploading,
  openFilePicker,
  askAboutDocument,
  openDocument,
  deleteDocument,
  toggleStar,
  setView,
}) {
  const title = view === 'starred' ? 'Starred Documents' : view === 'history' ? 'Recently Analyzed' : view === 'trash' ? 'Trash' : 'My Library';
  return (
    <Box className="libraryPage">
      <section className="libraryHero">
        <Box>
          <Box className="eyebrow">
            <SettingsRounded fontSize="small" />
            <span>AI document analyst</span>
          </Box>
          <Typography variant="h1">{title}</Typography>
          <Typography className="heroText">
            Manage your intellectual capital. Upload, index, and organize documents for high-precision AI analysis and knowledge retrieval.
          </Typography>
        </Box>
        <Box className="statsGrid">
          <Box className="statCard">
            <Typography variant="caption">Total Docs</Typography>
            <Typography variant="h5">{health?.documents ?? documents.length}</Typography>
          </Box>
          <Box className="statCard secondary">
            <Typography variant="caption">Indexed Chunks</Typography>
            <Typography variant="h5">{health?.chunks ?? 0}</Typography>
          </Box>
        </Box>
      </section>

      <section className={`dropZoneLibrary ${isDragActive ? 'active' : ''}`}>
        <Box className="dropDecor top">
          <PictureAsPdfRounded />
        </Box>
        <Box className="dropDecor bottom">
          <ArticleOutlined />
        </Box>
        <Box className="dropIcon">
          <UploadFileRounded />
        </Box>
        <Typography variant="h5">Drop PDFs here to index</Typography>
        <Typography color="text.secondary">Max file size: 50MB. AI citation indexing starts automatically.</Typography>
        <Button variant="contained" onClick={openFilePicker}>
          Browse Files
        </Button>
        {uploading && <LinearProgress className="dropProgress" />}
      </section>

      <section className="libraryToolbar">
        <Typography variant="h5">Recent Documents</Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box className="searchBox">
            <SearchRounded fontSize="small" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search knowledge base..."
            />
          </Box>
          <Tooltip title="Filters are based on the active sidebar section">
            <IconButton className="filterButton">
              <FilterListRounded />
            </IconButton>
          </Tooltip>
        </Stack>
      </section>

      {view === 'trash' ? (
        <EmptyState
          icon={<DeleteIcon />}
          title="Trash is empty"
          text="Deleted documents are removed from the local index immediately."
        />
      ) : visibleDocuments.length === 0 ? (
        <EmptyState
          icon={<ArticleOutlined />}
          title={documents.length ? 'No matching documents' : 'No PDFs indexed yet'}
          text={documents.length ? 'Try a different search or library filter.' : 'Upload a PDF to start analyzing it.'}
        />
      ) : (
        <Box className="documentGrid">
          {visibleDocuments.map((doc, index) => (
            <DocumentCard
              key={doc.document_id}
              doc={doc}
              index={index}
              starred={starredIds.includes(doc.document_id)}
              askAboutDocument={askAboutDocument}
              openDocument={openDocument}
              deleteDocument={deleteDocument}
              toggleStar={toggleStar}
            />
          ))}
        </Box>
      )}

      <footer className="libraryFooter">
        <Typography color="text.secondary">
          Showing {view === 'trash' ? 0 : visibleDocuments.length} of {documents.length} documents
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton disabled>
            <ChevronLeftRounded />
          </IconButton>
          <button className="pageButton active" type="button">
            1
          </button>
          <button className="pageButton" type="button" onClick={() => setView('chat')}>
            Chat
          </button>
          <IconButton onClick={() => setView('chat')}>
            <ChevronRightRounded />
          </IconButton>
        </Stack>
      </footer>
    </Box>
  );
}

function DocumentCard({ doc, index, starred, askAboutDocument, openDocument, deleteDocument, toggleStar }) {
  const isFirst = index === 0;
  return (
    <article className={`docCard ${isFirst ? 'featured' : ''}`}>
      {isFirst && <div className="shimmer" />}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box className={`docCardIcon ${isFirst ? 'accent' : ''}`}>
          {isFirst ? <AnalyticsRounded /> : <CheckCircleRounded />}
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={starred ? 'Remove from starred' : 'Star document'}>
            <IconButton size="small" onClick={() => toggleStar(doc.document_id)}>
              <StarRounded className={starred ? 'starred' : ''} fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Re-open document">
            <IconButton size="small" onClick={() => openDocument(doc.document_id)}>
              <RefreshRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete document">
            <IconButton size="small" onClick={() => deleteDocument(doc.document_id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Typography className="docTitle" title={doc.filename}>
        {doc.filename}
      </Typography>
      <Typography className="docMeta">
        {doc.num_pages} pages · {doc.num_chunks} chunks · {formatDate(doc.uploaded_at)}
      </Typography>
      <Box className="cardFooter">
        <Box className="indexedPill">
          <CheckCircleRounded fontSize="small" />
          <span>100% Indexed</span>
        </Box>
        <button type="button" onClick={() => askAboutDocument(doc.document_id)}>
          Ask AI <ArrowForwardRounded fontSize="small" />
        </button>
      </Box>
    </article>
  );
}

function ChatView({
  busy,
  documents,
  messages,
  query,
  selectedDocument,
  setQuery,
  askQuestion,
  handleQueryKeyDown,
  openFilePicker,
  documentFileUrl,
  openDocument,
  messagesRef,
  queryInputRef,
}) {
  return (
    <Box className="citationPage">
      <section className="chatSplit">
        <Box className="chatPanel">
          <Box className="eyebrow">
            <AutoAwesomeRounded fontSize="small" />
            <span>AI document analyst</span>
          </Box>
          <Typography variant="h3">Document Chat</Typography>
          <Typography color="text.secondary">
            Ask questions, compare details, and trace every answer back to the source pages.
          </Typography>

          <Box className="messages" ref={messagesRef}>
            {messages.map((message, index) => (
              <Box key={`${message.role}-${index}`} className={`message ${message.role} ${message.error ? 'error' : ''}`}>
                {message.role === 'assistant' ? (
                  <Box className="assistantBubble">
                    <Stack direction="row" spacing={1} alignItems="center" className="assistantLabel">
                      <AutoAwesomeRounded fontSize="small" />
                      <span>{message.error ? 'Assistant error' : 'Assistant'}</span>
                    </Stack>
                    <Typography component="pre" className="messageText">
                      {message.content}
                    </Typography>
                    {message.meta && <Typography variant="caption">{message.meta}</Typography>}
                    {message.sources?.length > 0 && (
                      <Stack spacing={1} className="citationList">
                        {message.sources.map((source, sourceIndex) => (
                          <button
                            key={`${source.document_id}-${source.page_number}-${sourceIndex}`}
                            type="button"
                            className="citationButton"
                            onClick={() => openDocument(source.document_id)}
                          >
                            [p. {source.page_number}] {source.document_name} · {Math.round(source.relevance_score * 100)}%
                          </button>
                        ))}
                      </Stack>
                    )}
                  </Box>
                ) : (
                  <Box className="userBubble">
                    <Typography component="pre" className="messageText">
                      {message.content}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
            {busy && (
              <Box className="analysisCard">
                <CircularProgress size={18} />
                <Typography>Analyzing documents and citations...</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box className="pdfPanel">
          <Box className="pdfHeader">
            <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
              <ArticleOutlined />
              <Typography noWrap>{selectedDocument?.filename || 'No PDF selected'}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box className="pageControl">
                <span>Page</span>
                <strong>1</strong>
              </Box>
              <Tooltip title="Open PDF">
                <span>
                  <IconButton disabled={!selectedDocument} onClick={() => selectedDocument && openDocument(selectedDocument.document_id)}>
                    <FullscreenRounded />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Box>
          <Box className="pdfBody">
            {selectedDocument ? (
              <iframe
                className="pdfFrame"
                title={selectedDocument.filename}
                src={`${documentFileUrl(selectedDocument.document_id)}#toolbar=1&navpanes=0`}
              />
            ) : (
              <EmptyState icon={<PictureAsPdfRounded />} title="No document selected" text="Upload or select a document to view citations." />
            )}
          </Box>
        </Box>
      </section>

      <PromptDock
        documents={documents}
        query={query}
        setQuery={setQuery}
        askQuestion={askQuestion}
        handleQueryKeyDown={handleQueryKeyDown}
        openFilePicker={openFilePicker}
        busy={busy}
        queryInputRef={queryInputRef}
      />
    </Box>
  );
}

function PromptDock({ documents, query, setQuery, askQuestion, handleQueryKeyDown, openFilePicker, busy, queryInputRef }) {
  return (
    <Box className="promptDock">
      {documents.length > 0 && (
        <Stack direction="row" spacing={1} className="suggestions">
          {starterQuestions.map((item) => (
            <Button key={item} onClick={() => setQuery(item)}>
              {item}
            </Button>
          ))}
        </Stack>
      )}
      <Box component="form" className="queryBar" onSubmit={askQuestion}>
        <Tooltip title="Upload PDF">
          <IconButton type="button" onClick={openFilePicker}>
            <AttachFileRounded />
          </IconButton>
        </Tooltip>
        <TextField
          inputRef={queryInputRef}
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleQueryKeyDown}
          placeholder="Ask a question about these documents..."
          disabled={busy}
          variant="standard"
          InputProps={{ disableUnderline: true }}
        />
        <Tooltip title="Send question">
          <span>
            <IconButton className="sendButton" type="submit" disabled={!query.trim() || busy}>
              <SendRounded />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

function ModelLabView({
  selectedModelId,
  selectModel,
  playgroundPrompt,
  setPlaygroundPrompt,
  playgroundMessages,
  runPlaygroundTest,
  metrics,
  marketProgress,
  downloadMarketModel,
  setView,
}) {
  const selectedModel = modelCards.find((model) => model.id === selectedModelId) || modelCards[0];

  return (
    <Box className="modelLabPage">
      <header className="modelLabHeader">
        <Box className="eyebrow">
          <AutoAwesomeRounded fontSize="small" />
          <span>Model Lab</span>
        </Box>
        <Typography variant="h3">AI Model Explorer</Typography>
        <Typography color="text.secondary">
          Configure, test, and manage the underlying LLMs powering your document analysis.
        </Typography>
      </header>

      <Box className="modelLabGrid">
        <section className="modelLabMain">
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} className="sectionTitle">
            <Typography variant="h5">Active Model Library</Typography>
            <Chip className="softChip" label="Local Indexing: Enabled" />
          </Stack>

          <Box className="modelGrid">
            {modelCards.map((model) => {
              const Icon = model.icon;
              const selected = model.id === selectedModelId;
              return (
                <article
                  key={model.id}
                  className={`modelCard ${selected ? 'selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectModel(model.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectModel(model.id);
                    }
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box className={`modelIcon ${model.id}`}>
                      <Icon />
                    </Box>
                    <Chip label={selected ? 'Active' : model.status} size="small" />
                  </Stack>
                  <Typography variant="h5">{model.name}</Typography>
                  <Typography className="modelType">Type: {model.type}</Typography>
                  <Typography color="text.secondary">{model.description}</Typography>
                  <Box className="modelCardFooter">
                    <Box className="stars" aria-label={`${model.rating} star rating`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <StarRounded key={`${model.id}-${index}`} className={index < model.rating ? 'filled' : ''} />
                      ))}
                    </Box>
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      selected ? setView('settings') : selectModel(model.id);
                    }}>
                      {selected ? 'Configuration' : model.id === 'gemini' ? 'Connect API' : 'Switch to Model'}
                    </button>
                  </Box>
                </article>
              );
            })}

            <article className="addModelCard" role="button" tabIndex={0} onClick={() => downloadMarketModel('custom')}>
              <Box className="addModelIcon">
                <AddRounded />
              </Box>
              <Typography variant="h5">Add New Model</Typography>
              <Typography color="text.secondary">Import from HuggingFace or Ollama</Typography>
            </article>
          </Box>

          <section className="playgroundCard">
            <Box className="playgroundHeader">
              <Stack direction="row" spacing={1} alignItems="center">
                <PlayCircleRounded />
                <Typography variant="h5">Model Playground</Typography>
              </Stack>
              <Stack direction="row" spacing={2} className="playgroundMeta">
                <span>Testing: {selectedModel.name}</span>
                <span>Temperature: 0.7</span>
              </Stack>
            </Box>
            <Box className="playgroundBody">
              <Box className="playgroundThread">
                {playgroundMessages.map((message, index) => (
                  <Box key={`${message.role}-${index}`} className={`playMessage ${message.role}`}>
                    <Box className="playAvatar">
                      {message.role === 'user' ? <PersonRounded fontSize="small" /> : <SmartToyRounded fontSize="small" />}
                    </Box>
                    <Typography>{message.content}</Typography>
                  </Box>
                ))}
              </Box>
              <Box component="form" className="playgroundInput" onSubmit={runPlaygroundTest}>
                <textarea
                  value={playgroundPrompt}
                  onChange={(event) => setPlaygroundPrompt(event.target.value)}
                  placeholder="Type a test prompt here..."
                  rows={3}
                />
                <Button type="submit" variant="contained" endIcon={<SendRounded />} disabled={!playgroundPrompt.trim()}>
                  Run Test
                </Button>
              </Box>
            </Box>
          </section>
        </section>

        <aside className="modelLabAside">
          <section className="metricsCard">
            <Typography variant="h5">
              <AnalyticsRounded /> Live Metrics
            </Typography>
            <MetricBar label="Inference Latency" value={`${metrics.latency}ms`} percent={Math.min(100, metrics.latency * 1.4)} helper="Target: < 50ms" />
            <MetricBar label="VRAM Usage" value={`${(metrics.vram / 10).toFixed(1)} / 8 GB`} percent={metrics.vram} helper="Safe Zone" secondary />
            <Box className="throughput">
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                <Typography color="text.secondary">Token Throughput</Typography>
                <strong>{metrics.throughput} t/s</strong>
              </Stack>
              <Box className="barChart">
                {metrics.bars.map((height, index) => (
                  <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
                ))}
              </Box>
            </Box>
          </section>

          <section className="marketCard">
            <Typography variant="h5">
              <CloudRounded /> Model Market
            </Typography>
            <Stack spacing={1.5}>
              {marketModels.map((model) => {
                const progress = marketProgress[model.id];
                return (
                  <button
                    key={model.id}
                    className={`marketItem ${progress ? 'downloading' : ''}`}
                    type="button"
                    onClick={() => downloadMarketModel(model.id)}
                  >
                    <Box className="marketIcon">
                      {progress ? <RefreshRounded fontSize="small" /> : <StorageRounded fontSize="small" />}
                    </Box>
                    <Box minWidth={0} flex={1}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <strong>{model.name}</strong>
                        {progress ? <span>{progress}%</span> : null}
                      </Stack>
                      <small>{model.description}</small>
                      {progress ? (
                        <Box className="downloadTrack">
                          <span style={{ width: `${progress}%` }} />
                        </Box>
                      ) : null}
                    </Box>
                  </button>
                );
              })}
            </Stack>
            <Button className="browseModels" variant="outlined" onClick={() => downloadMarketModel('browse')}>
              Browse All Models
            </Button>
          </section>

          <Box className="securityNote">
            <InfoRounded />
            <Box>
              <Typography variant="h6">Security Note</Typography>
              <Typography>
                Local models never send document chunks to external servers. Your data remains strictly on this machine.
              </Typography>
            </Box>
          </Box>
        </aside>
      </Box>
    </Box>
  );
}

function MetricBar({ label, value, percent, helper, secondary = false }) {
  return (
    <Box className="metricBar">
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Typography color="text.secondary">{label}</Typography>
        <strong className={secondary ? 'secondary' : ''}>{value}</strong>
      </Stack>
      <Box className="metricTrack">
        <span className={secondary ? 'secondary' : ''} style={{ width: `${Math.min(100, percent)}%` }} />
      </Box>
      <small>{helper}</small>
    </Box>
  );
}

function SettingsView({ settings, setSettings, saveSettings, resetSettings }) {
  return (
    <Box className="settingsPage">
      <Box className="settingsHeader">
        <Box className="eyebrow">
          <SettingsRounded fontSize="small" />
          <span>Configuration</span>
        </Box>
        <Typography variant="h3">Model Lab Settings</Typography>
        <Typography color="text.secondary">
          Configure how DocAnalyzer AI processes your sensitive information across local and cloud environments.
        </Typography>
      </Box>

      <Box className="settingsCard">
        <section>
          <Typography variant="h5">Execution Engine</Typography>
          <Box className="segmented">
            <button
              className={settings.engine === 'local' ? 'active' : ''}
              type="button"
              onClick={() => setSettings((current) => ({ ...current, engine: 'local' }))}
            >
              <MemoryRounded /> Local Model
            </button>
            <button
              className={settings.engine === 'gemini' ? 'active' : ''}
              type="button"
              onClick={() => setSettings((current) => ({ ...current, engine: 'gemini' }))}
            >
              <CloudRounded /> Gemini API
            </button>
          </Box>
        </section>

        <section className={settings.engine === 'local' ? 'disabledSection' : ''}>
          <Typography variant="h5">API Credentials</Typography>
          <Typography color="text.secondary">The backend currently reads Gemini credentials from your local `.env` file.</Typography>
          <Box className="apiInput">
            <input
              readOnly
              type={settings.apiKeyVisible ? 'text' : 'password'}
              value={settings.apiKeyVisible ? 'Loaded from backend .env' : '••••••••••••••••••••••••'}
            />
            <IconButton onClick={() => setSettings((current) => ({ ...current, apiKeyVisible: !current.apiKeyVisible }))}>
              <VisibilityRounded />
            </IconButton>
          </Box>
        </section>

        <section className="sliderSection">
          <Typography variant="h5">Generation Parameters</Typography>
          <Box className="settingRow">
            <Box>
              <Typography fontWeight={800}>Temperature</Typography>
              <Typography color="text.secondary">Controls randomness: lower is more focused.</Typography>
            </Box>
            <strong>{settings.temperature.toFixed(1)}</strong>
          </Box>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={settings.temperature}
            onChange={(_, value) => setSettings((current) => ({ ...current, temperature: value }))}
          />

          <Box className="settingRow">
            <Box>
              <Typography fontWeight={800}>Context Length</Typography>
              <Typography color="text.secondary">Number of tokens to analyze in one pass.</Typography>
            </Box>
            <strong>{settings.contextLength.toLocaleString()}</strong>
          </Box>
          <Slider
            min={1024}
            max={32768}
            step={1024}
            value={settings.contextLength}
            onChange={(_, value) => setSettings((current) => ({ ...current, contextLength: value }))}
          />
        </section>

        <section>
          <Typography variant="h5">Reasoning Features</Typography>
          <Box className="featureGrid">
            <label>
              <Checkbox
                checked={settings.strictCitations}
                onChange={(event) => setSettings((current) => ({ ...current, strictCitations: event.target.checked }))}
              />
              <span>
                <strong>Strict Citations</strong>
                <small>Force [p. #] markers for factual claims.</small>
              </span>
            </label>
            <label>
              <Checkbox
                checked={settings.hallucinationGuard}
                onChange={(event) => setSettings((current) => ({ ...current, hallucinationGuard: event.target.checked }))}
              />
              <span>
                <strong>Hallucination Guard</strong>
                <small>Run a second verification pass on answers.</small>
              </span>
            </label>
          </Box>
        </section>

        <Box className="settingsActions">
          <Button color="error" onClick={resetSettings}>
            Reset to Default
          </Button>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined">Cancel</Button>
            <Button variant="contained" onClick={saveSettings}>
              Save Changes
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box className="settingsMeta">
        <span>
          <VerifiedUserRounded fontSize="small" /> Privacy First Infrastructure
        </span>
        <span>
          <PsychologyRounded fontSize="small" /> Gemini provider active
        </span>
      </Box>
    </Box>
  );
}

function MobileNav({ view, setView, openFilePicker }) {
  return (
    <nav className="mobileNav" aria-label="Mobile navigation">
      <button className={view === 'library' ? 'active' : ''} type="button" onClick={() => setView('library')}>
        <ArticleOutlined />
        <span>Library</span>
      </button>
      <button className={view === 'chat' ? 'active' : ''} type="button" onClick={() => setView('chat')}>
        <ForumRounded />
        <span>Chat</span>
      </button>
      <button className="addMobile" type="button" onClick={openFilePicker}>
        <AddRounded />
      </button>
      <button className={view === 'modelLab' ? 'active' : ''} type="button" onClick={() => setView('modelLab')}>
        <PsychologyRounded />
        <span>Models</span>
      </button>
      <button className={view === 'settings' ? 'active' : ''} type="button" onClick={() => setView('settings')}>
        <SettingsRounded />
        <span>Settings</span>
      </button>
    </nav>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <Box className="emptyState">
      {icon}
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.detail || error?.message || 'Something went wrong.';
}

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/signup/*" element={<SignUpPage />} />
        <Route path="/welcome" element={
          <SignedIn>
            <WelcomeVideo />
          </SignedIn>
        } />
        <Route path="/workspace/*" element={
          <>
            <SignedIn>
              <Workspace />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
