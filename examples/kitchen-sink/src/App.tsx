/**
 * Demo.tsx – all-in-one showcase for huggingface-transformers-react
 * -----------------------------------------------------------------
 * npm i @mui/material @mui/icons-material @emotion/react @emotion/styled
 * npm i lucide-react
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  TransformersProvider,
  useTransformers,
  type SentimentResult,
} from 'huggingface-transformers-react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Chip,
  Box,
  Paper,
  LinearProgress,
  Divider,
  Avatar,
  Stack,
  Skeleton,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  FiberManualRecord as RecordIcon,
  CloudUpload as CloudUploadIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  HourglassTop as HourglassIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Brain, Sparkles } from 'lucide-react';

/* ─────────────────────────── Theme ─────────────────────────── */

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
    background: { default: '#f8fafc' },
  },
  typography: { fontFamily: 'Inter, Arial, sans-serif' },
  components: {
    MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
  },
});

/* ─────────────────────── Helper Components ─────────────────── */

const StatusChip = ({
  status,
  label,
}: {
  status: 'ready' | 'loading' | 'error' | 'idle';
  label: string;
}) => {
  const map = {
    ready: { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    loading: { color: 'warning', icon: <HourglassIcon fontSize="small" /> },
    error: { color: 'error', icon: <ErrorIcon fontSize="small" /> },
    idle: { color: 'default', icon: <HourglassIcon fontSize="small" /> },
  } as const;

  const { color, icon } = map[status];
  return (
    <Chip
      size="small"
      icon={icon}
      label={`${label}: ${status}`}
      color={color}
      sx={{ fontWeight: 600, textTransform: 'capitalize' }}
    />
  );
};

const LoadingSkeleton = () => (
  <Card sx={{ p: 2 }}>
    <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" width="40%" />
  </Card>
);

/* ─────────────────────── Custom Hooks ──────────────────────── */

/** Voice-recording hook – returns controller + blob once finished */
function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      setBlob(new Blob(chunks, { type: 'audio/webm' }));
      stream.getTracks().forEach((t) => t.stop());
    };
    recorder.start();
    mediaRecorder.current = recorder;
    setRecording(true);
  };

  const stop = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current = null;
    setRecording(false);
  };

  return { recording, blob, start, stop, reset: () => setBlob(null) };
}

/* ─────────────────────── Feature Cards ────────────────────── */

function LibraryStatusCard() {
  const { libraryStatus, isLibraryLoaded, models } = useTransformers();

  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Brain size={20} />
          </Avatar>
        }
        title="Runtime Status"
        subheader="Transformers.js & cached models"
      />
      <CardContent>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <StatusChip status={libraryStatus} label="Library" />
          <Chip
            size="small"
            icon={<Brain size={14} />}
            label={`Models loaded: ${Object.keys(models).length}`}
            color="info"
          />
          <Chip
            size="small"
            icon={
              isLibraryLoaded ? (
                <CheckCircleIcon fontSize="small" />
              ) : (
                <HourglassIcon fontSize="small" />
              )
            }
            label={isLibraryLoaded ? 'Pipeline ready' : 'Not ready'}
            color={isLibraryLoaded ? 'success' : 'default'}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function SentimentCard() {
  const { libraryStatus, analyzeSentiment } = useTransformers();
  const [text, setText] = useState(
    'I love this amazing library! It makes AI so accessible.'
  );
  const [result, setResult] = useState<SentimentResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const out = await analyzeSentiment(text);
      setResult(out);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <PsychologyIcon />
          </Avatar>
        }
        title="Sentiment Analysis"
        subheader="Classify the emotional tone of any text"
      />
      <CardContent>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Your text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          disabled={libraryStatus !== 'ready' || busy}
          onClick={run}
          startIcon={<Sparkles size={16} />}
        >
          {busy ? 'Analyzing…' : 'Analyze sentiment'}
        </Button>

        {busy && <LinearProgress sx={{ mt: 2 }} />}

        {result && (
          <Box mt={3}>
            {result.map((r, i) => (
              <Paper
                key={i}
                sx={{
                  p: 1.5,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Chip
                  label={r.label}
                  color={
                    r.label === 'POSITIVE'
                      ? 'success'
                      : r.label === 'NEGATIVE'
                        ? 'error'
                        : 'warning'
                  }
                  size="small"
                />
                <Typography fontWeight={600}>
                  {(r.score * 100).toFixed(1)} %
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function TranscriptionCard() {
  const { libraryStatus, transcribeAudio } = useTransformers();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const recorder = useVoiceRecorder();

  /* run inference */
  const transcribe = useCallback(
    async (audio: Blob) => {
      setBusy(true);
      try {
        const out = await transcribeAudio(audio);
        setText(out.text ?? 'No text recognised');
      } catch (e: any) {
        setText(`Error: ${e.message}`);
      } finally {
        setBusy(false);
      }
    },
    [transcribeAudio]
  );

  /* auto-run when recorder finishes */
  React.useEffect(() => {
    if (recorder.blob) transcribe(recorder.blob);
  }, [recorder.blob, transcribe]);

  /* handle upload */
  const onChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      transcribe(f);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'success.main' }}>
            <MicIcon />
          </Avatar>
        }
        title="Speech-to-Text"
        subheader="Convert voice to text with Whisper"
      />
      <CardContent>
        <Stack spacing={2}>
          <Button
            fullWidth
            variant={recorder.recording ? 'contained' : 'outlined'}
            color={recorder.recording ? 'error' : 'primary'}
            onClick={recorder.recording ? recorder.stop : recorder.start}
            disabled={libraryStatus !== 'ready' || busy}
            startIcon={recorder.recording ? <StopIcon /> : <RecordIcon />}
          >
            {recorder.recording ? 'Stop recording' : 'Start voice recording'}
          </Button>

          <Divider>or</Divider>

          <Button
            fullWidth
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            disabled={libraryStatus !== 'ready' || busy}
          >
            {file ? file.name : 'Upload audio file'}
            <input
              hidden
              type="file"
              accept="audio/*"
              onChange={onChoose}
            />
          </Button>

          {busy && <LinearProgress />}

          {text && (
            <Paper sx={{ p: 2 }}>
              <Typography>{text}</Typography>
            </Paper>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────── App ──────────────────────────── */

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TransformersProvider>
        {/* App Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: 'transparent', color: 'primary.main' }}
        >
          <Toolbar>
            <Brain size={28} style={{ marginRight: 12 }} />
            <Typography variant="h6" fontWeight={700}>
              Transformers Demo
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 6 }}>
          {/* Hero */}
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h3"
              fontWeight={700}
              gutterBottom
              sx={{ background: 'linear-gradient(45deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              AI-powered React Components
            </Typography>
            <Typography variant="h6" color="text.secondary" maxWidth={600} mx="auto">
              Showcase of sentiment, speech-to-text & custom models
            </Typography>
          </Box>

          {/* Runtime status */}
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <LibraryStatusCard />
            </Grid>

            {/* Sentiment & ASR */}
            <Grid item xs={12} md={6}>
              <SentimentCard />
            </Grid>
            <Grid item xs={12} md={6}>
              <TranscriptionCard />
            </Grid>
          </Grid>

          {/* Footer */}
          <Box textAlign="center" mt={10}>
            <Divider sx={{ mb: 4 }} />
            <Typography variant="body2" color="text.secondary">
              Built with&nbsp;
              <a
                href="https://github.com/muhammaddadu/huggingface-transformers-react"
                style={{ fontWeight: 600, color: theme.palette.primary.main }}
              >
                huggingface-transformers-react
              </a>
            </Typography>
          </Box>
        </Container>
      </TransformersProvider>
    </ThemeProvider>
  );
}

export default App;
