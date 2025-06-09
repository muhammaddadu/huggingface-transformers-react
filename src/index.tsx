import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";

/* ──────────────────────────── Types ─────────────────────────── */

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface SentimentResult {
  label: string;
  score: number;
}

export interface TransformersProviderProps {
  children: ReactNode;
  moduleUrl?: string;          // ESM build URL
  loadTimeout?: number;        // ms until a load attempt is considered dead
  maxRetries?: number;         // library-level retries
  nonce?: string;              // CSP support
  onLibraryError?: (err: Error) => void;
  onModelError?: (modelId: string, err: Error) => void;
}

interface TransformersContextValue {
  /* library */
  isLibraryLoaded: boolean;
  libraryStatus: ModelStatus;
  libraryError: Error | null;

  /* models */
  models: Record<string, any>;
  modelStatus: Record<string, ModelStatus>;
  modelErrors: Record<string, Error | null>;

  loadModel: <T = unknown>(
    modelId: string,
    task?: string,
    retry?: number
  ) => Promise<T>;
  unloadModel: (modelId: string) => void;

  analyzeSentiment: (
    text: string,
    customModel?: string,
    options?: Record<string, any>
  ) => Promise<SentimentResult[]>;

  transcribeAudio: (
    audio: Blob | File,
    options?: Record<string, any>
  ) => Promise<any>;

  /** Suspense-ready promise that resolves when transformers.js is ready */
  readyPromise: Promise<void>;
}

/* ───────────────────────── Defaults ─────────────────────────── */

const DEFAULT_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2";
const DEFAULT_LOAD_TIMEOUT = 60_000;          // 60 s
const DEFAULT_MAX_RETRIES = 3;
const BACKOFF_CAP = 60_000;         // max 60 s delay

/* ───────────────────────── Context ──────────────────────────── */

const TransformersContext =
  React.createContext<TransformersContextValue | null>(null);

/* ─────────────────── TransformersProvider ───────────────────── */

export function TransformersProvider({
  children,
  moduleUrl = DEFAULT_MODULE_URL,
  loadTimeout = DEFAULT_LOAD_TIMEOUT,
  maxRetries = DEFAULT_MAX_RETRIES,
  nonce,
  onLibraryError,
  onModelError,
}: TransformersProviderProps) {
  const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

  /* ── library state ─────────────────────────────────────────── */
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState<ModelStatus>("idle");
  const [libraryError, setLibraryError] = useState<Error | null>(null);

  /* ── model state ───────────────────────────────────────────── */
  const [models, setModels] = useState<Record<string, any>>({});
  const [modelStatus, setModelStatus] = useState<Record<string, ModelStatus>>({});
  const [modelErrors, setModelErrors] = useState<Record<string, Error | null>>({});

  /* ── refs ──────────────────────────────────────────────────── */
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const pollTimerRef = useRef<number>();
  const isPollingRef = useRef(false);
  const libraryAttemptRef = useRef(0);
  const pendingRef = useRef<Record<string, Promise<any>>>({});

  /* ---- Suspense-ready promise (created once) ---- */
  const readyPromiseRef = useRef<Promise<void>>();
  const readyResolveRef = useRef<() => void>();
  const readyRejectRef = useRef<(e: Error) => void>();

  if (!readyPromiseRef.current) {
    readyPromiseRef.current = new Promise<void>((res, rej) => {
      readyResolveRef.current = res;
      readyRejectRef.current = rej;
    });
  }

  /* ── helpers: polling & script ─────────────────────────────── */

  const clearPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = undefined;
    }
    isPollingRef.current = false;
  };

  const removeScriptTag = () => {
    scriptRef.current?.remove();
    scriptRef.current = null;
  };

  /** Starts the poll loop if not already running */
  const ensurePolling = (deadline: number) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    const tick = () => {
      if ((window as any).transformers?.pipeline) {
        clearPolling();
        removeScriptTag();
        setIsLibraryLoaded(true);
        setLibraryStatus("ready");
        readyResolveRef.current?.();
        console.debug("[Transformers] library ready");
        return;
      }

      if (Date.now() >= deadline) {
        clearPolling();
        removeScriptTag();
        handleLibraryFailure(
          new Error(`transformers.js not ready within ${loadTimeout} ms`)
        );
        return;
      }
      pollTimerRef.current = window.setTimeout(tick, 500);
    };

    tick();
  };

  /** Injects the ESM script once */
  const injectScriptTag = () => {
    if (scriptRef.current) return;

    const script = document.createElement("script");
    script.type = "module";
    script.crossOrigin = "anonymous";
    if (nonce) script.nonce = nonce;
    script.textContent = `
      import { pipeline } from '${moduleUrl}';
      window.transformers = { pipeline };
    `;

    script.onerror = () => {
      clearPolling();
      removeScriptTag();
      handleLibraryFailure(new Error("Script load error"));
    };

    document.head.appendChild(script);
    scriptRef.current = script;
    console.debug("[Transformers] script tag injected");
  };

  const handleLibraryFailure = (err: Error) => {
    clearPolling();
    libraryAttemptRef.current += 1;

    if (libraryAttemptRef.current < maxRetries) {
      const delay =
        Math.min(1000 * 2 ** (libraryAttemptRef.current - 1), BACKOFF_CAP) +
        Math.random() * 1000;
      console.debug(
        `[Transformers] retrying library in ${delay.toFixed(0)} ms ` +
        `(${libraryAttemptRef.current}/${maxRetries})`
      );
      setTimeout(tryLoadLibrary, delay);
      return;
    }

    setLibraryError(err);
    setLibraryStatus("error");
    readyRejectRef.current?.(err);
    onLibraryError?.(err);
    console.debug("[Transformers] library failed permanently");
  };

  const tryLoadLibrary = useCallback(() => {
    if (!isBrowser) return;
    if (isLibraryLoaded || libraryStatus === "loading") return;

    setLibraryStatus("loading");
    setLibraryError(null);

    injectScriptTag();                           // inserts only once
    ensurePolling(Date.now() + loadTimeout);     // (re)starts poll loop
  }, [isBrowser, isLibraryLoaded, libraryStatus, loadTimeout]);

  /* mount → first load (no cleanup needed for script/poller) */
  useEffect(() => {
    tryLoadLibrary();
  }, [tryLoadLibrary]);

  /* ── model loading / cache ──────────────────────────────── */

  const loadModel = useCallback(
    async <T = unknown>(
      modelId: string,
      task: string = "auto",
      retry = 1
    ): Promise<T> => {
      if (models[modelId]) return models[modelId] as T;
      if (pendingRef.current[modelId]) return pendingRef.current[modelId] as Promise<T>;

      setModelStatus(s => ({ ...s, [modelId]: "loading" }));
      setModelErrors(e => ({ ...e, [modelId]: null }));

      const attempt = async (remain: number): Promise<T> => {
        try {
          await readyPromiseRef.current!;
          const { pipeline } = (window as any).transformers;
          const p: Promise<T> = pipeline(task, modelId);
          pendingRef.current[modelId] = p;

          const pipe = await p;
          setModels(m => ({ ...m, [modelId]: pipe }));
          setModelStatus(s => ({ ...s, [modelId]: "ready" }));
          delete pendingRef.current[modelId];
          return pipe;
        } catch (err: any) {
          if (remain > 0) return attempt(remain - 1);
          setModelErrors(e => ({ ...e, [modelId]: err }));
          setModelStatus(s => ({ ...s, [modelId]: "error" }));
          delete pendingRef.current[modelId];
          onModelError?.(modelId, err);
          throw err;
        }
      };

      return attempt(retry);
    },
    [models, onModelError]
  );

  const unloadModel = useCallback((modelId: string) => {
    if (pendingRef.current[modelId]) delete pendingRef.current[modelId];

    setModels(m => {
      const next = { ...m };
      const pipe = next[modelId];
      if (typeof pipe?.dispose === "function") {
        try { pipe.dispose(); } catch { /* ignore */ }
      }
      delete next[modelId];
      return next;
    });
    setModelStatus(s => { const n = { ...s }; delete n[modelId]; return n; });
    setModelErrors(e => { const n = { ...e }; delete n[modelId]; return n; });
  }, []);

  /* ── helper wrappers ─────────────────────────────────────── */

  const analyzeSentiment = useCallback(
    (
      text: string,
      customModel?: string,
      options: Record<string, any> = {}
    ) =>
      loadModel<(...a: any[]) => Promise<SentimentResult[]>>(
        customModel || "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
        "sentiment-analysis"
      ).then(pipe => pipe(text, options)),
    [loadModel]
  );

  const transcribeAudio = useCallback(
    async (audio: Blob | File, options: Record<string, any> = {}) => {
      // Convert audio to Float32Array for Whisper models
      const convertAudioToFloat32 = async (audioBlob: Blob | File): Promise<Float32Array> => {
        // Check if AudioContext is available (browser environment)
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        if (!AudioContextClass) {
          throw new Error('AudioContext is not available. Audio transcription requires a browser environment.');
        }
        
        const audioContext = new AudioContextClass();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Whisper expects mono audio at 16kHz
        const targetSampleRate = 16000;
        
        // Get the first channel (mono)
        let audioData = audioBuffer.getChannelData(0);
        
        // Resample if needed
        if (audioBuffer.sampleRate !== targetSampleRate) {
          const ratio = audioBuffer.sampleRate / targetSampleRate;
          const newLength = Math.floor(audioData.length / ratio);
          const result = new Float32Array(newLength);
          
          for (let i = 0; i < newLength; i++) {
            const index = Math.floor(i * ratio);
            result[i] = audioData[index] || 0;
          }
          audioData = result;
        }
        
        audioContext.close();
        return audioData;
      };

      const audioData = await convertAudioToFloat32(audio);
      const pipe = await loadModel<(...a: any[]) => Promise<any>>(
        options['model'] || "Xenova/whisper-tiny.en",
        "automatic-speech-recognition"
      );
      return pipe(audioData, options);
    },
    [loadModel]
  );

  /* ── context value ───────────────────────────────────────── */

  const ctx: TransformersContextValue = {
    isLibraryLoaded,
    libraryStatus,
    libraryError,
    models,
    modelStatus,
    modelErrors,
    loadModel,
    unloadModel,
    analyzeSentiment,
    transcribeAudio,
    readyPromise: readyPromiseRef.current!,
  };

  return (
    <TransformersContext.Provider value={ctx}>
      {children}
    </TransformersContext.Provider>
  );
}

/* ─────────────────────────── Hooks ────────────────────────── */

export function useTransformers() {
  const ctx = useContext(TransformersContext);
  if (!ctx)
    throw new Error("useTransformers must be used within TransformersProvider");
  return ctx;
}

export function useTransformersReady(): void {
  const { libraryStatus, readyPromise } = useTransformers();
  if (libraryStatus !== "ready") throw readyPromise;
}
