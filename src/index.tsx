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

export interface ImageSegmentationResult {
  label: string;
  score: number;
  mask: any; // Could be tensor data or image mask
}

export interface ImageCaptionResult {
  generated_text: string;
}

export interface ImageClassificationResult {
  label: string;
  score: number;
}

/**
 * Message format for WebLLM chat completions.
 * Compatible with OpenAI chat completion API.
 * 
 * @example
 * ```tsx
 * const messages: ChatMessage[] = [
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'Hello!' },
 *   { role: 'assistant', content: 'Hi! How can I help you?' }
 * ];
 * ```
 */
export interface ChatMessage {
  /** The role of the message author: 'system', 'user', or 'assistant' */
  role: "system" | "user" | "assistant";
  /** The content of the message */
  content: string;
}

/**
 * Result from a WebLLM chat completion request.
 * Compatible with OpenAI chat completion API format.
 * 
 * @example
 * ```tsx
 * const result = await chatCompletion(messages);
 * console.log(result.choices[0].message.content);
 * console.log(`Tokens used: ${result.usage?.total_tokens}`);
 * ```
 */
export interface ChatCompletionResult {
  /** Array of completion choices (typically contains one item) */
  choices: Array<{
    /** The generated message */
    message: ChatMessage;
    /** Reason the completion finished: 'stop', 'length', etc. */
    finish_reason?: string;
  }>;
  /** Token usage statistics */
  usage?: {
    /** Number of tokens in the prompt */
    prompt_tokens: number;
    /** Number of tokens in the completion */
    completion_tokens: number;
    /** Total tokens used (prompt + completion) */
    total_tokens: number;
  };
}

/**
 * Model information from WebLLM's prebuilt configuration.
 * Used to display available models and their requirements.
 * 
 * @example
 * ```tsx
 * const models = await getAvailableWebLLMModels();
 * models.forEach(model => {
 *   console.log(`${model.model_id}: ${model.vram_required_MB}MB`);
 * });
 * ```
 */
export interface WebLLMModelRecord {
  /** Display name of the model */
  model: string;
  /** Unique identifier for the model (use this to load the model) */
  model_id: string;
  /** Model library URL (internal) */
  model_lib?: string;
  /** VRAM required in megabytes (approximate model size) */
  vram_required_MB?: number;
  /** Whether this is a low-resource variant */
  low_resource_required?: boolean;
  /** Additional model configuration overrides */
  overrides?: Record<string, any>;
}

/**
 * Configuration props for the TransformersProvider component.
 * 
 * @example
 * ```tsx
 * <TransformersProvider
 *   enableWebLLM={true}
 *   loadTimeout={30000}
 *   onWebLLMInitProgress={(progress) => {
 *     console.log(`Loading: ${(progress.progress * 100).toFixed(1)}%`);
 *   }}
 * >
 *   <App />
 * </TransformersProvider>
 * ```
 */
export interface TransformersProviderProps {
  /** React children to render */
  children: ReactNode;
  /** Custom URL for Transformers.js ESM build (default: jsdelivr CDN) */
  moduleUrl?: string;
  /** Timeout in milliseconds for library loading (default: 60000) */
  loadTimeout?: number;
  /** Maximum retry attempts for library loading (default: 3) */
  maxRetries?: number;
  /** CSP nonce for script tag injection */
  nonce?: string;
  /** Callback invoked when library loading fails permanently */
  onLibraryError?: (err: Error) => void;
  /** Callback invoked when a model loading fails */
  onModelError?: (modelId: string, err: Error) => void;
  /** 
   * Enable WebLLM support for running LLMs in the browser (default: false).
   * Loaded dynamically from CDN - no additional dependencies required.
   * Requires WebGPU-capable browser (Chrome/Edge 113+).
   * 
   * @see {@link https://webllm.mlc.ai/ | WebLLM Documentation}
   */
  enableWebLLM?: boolean;
  /** 
   * Custom URL for WebLLM ESM build (default: jsdelivr CDN).
   * Only used if enableWebLLM is true.
   */
  webLLMModuleUrl?: string;
  /** 
   * Callback for WebLLM model loading progress updates.
   * Useful for displaying progress bars during model download.
   */
  onWebLLMInitProgress?: (progress: { progress: number; text: string }) => void;
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

  segmentImage: (
    image: string | File | Blob,
    customModel?: string,
    options?: Record<string, any>
  ) => Promise<ImageSegmentationResult[]>;

  captionImage: (
    image: string | File | Blob,
    customModel?: string,
    options?: Record<string, any>
  ) => Promise<ImageCaptionResult[]>;

  classifyImage: (
    image: string | File | Blob,
    customModel?: string,
    options?: Record<string, any>
  ) => Promise<ImageClassificationResult[]>;

  /** Suspense-ready promise that resolves when transformers.js is ready */
  readyPromise: Promise<void>;

  /* ── WebLLM (Large Language Models in Browser) ────────── */
  
  /** Whether WebLLM support is enabled in the provider */
  isWebLLMEnabled: boolean;
  
  /** Whether a WebLLM model is loaded and ready */
  isWebLLMLoaded: boolean;
  
  /** Current status of the WebLLM engine: 'idle' | 'loading' | 'ready' | 'error' */
  webLLMStatus: ModelStatus;
  
  /** Error from WebLLM initialization or model loading */
  webLLMError: Error | null;
  
  /** 
   * Current model loading progress.
   * Contains progress (0-1) and descriptive text.
   */
  webLLMInitProgress: { progress: number; text: string } | null;
  
  /** ID of the currently loaded WebLLM model */
  currentWebLLMModel: string | null;

  /**
   * Load a specific WebLLM model by ID.
   * Downloads and initializes the model for chat completion.
   * 
   * @param modelId - Model identifier (e.g., 'Llama-3.2-1B-Instruct-q4f16_1-MLC')
   * @throws Error if WebLLM is not enabled or model loading fails
   * 
   * @example
   * ```tsx
   * await loadWebLLMModel('Llama-3.2-1B-Instruct-q4f16_1-MLC');
   * // Model is now ready for chat completion
   * ```
   */
  loadWebLLMModel: (modelId: string) => Promise<void>;
  
  /**
   * Generate a chat completion response using the loaded WebLLM model.
   * Non-streaming version - returns complete response.
   * 
   * @param messages - Array of chat messages (conversation history)
   * @param options - Generation options (temperature, max_tokens, etc.)
   * @returns Promise resolving to the completion result
   * 
   * @example
   * ```tsx
   * const messages = [
   *   { role: 'user', content: 'Hello!' }
   * ];
   * const result = await chatCompletion(messages, {
   *   temperature: 0.7,
   *   max_tokens: 512
   * });
   * console.log(result.choices[0].message.content);
   * ```
   */
  chatCompletion: (
    messages: ChatMessage[],
    options?: Record<string, any>
  ) => Promise<ChatCompletionResult>;
  
  /**
   * Generate a streaming chat completion response.
   * Chunks are delivered in real-time for better UX.
   * 
   * @param messages - Array of chat messages (conversation history)
   * @param onChunk - Callback invoked for each content chunk
   * @param options - Generation options (temperature, max_tokens, etc.)
   * 
   * @example
   * ```tsx
   * let response = '';
   * await streamChatCompletion(
   *   messages,
   *   (chunk) => {
   *     response += chunk;
   *     setDisplayText(response); // Update UI in real-time
   *   },
   *   { temperature: 0.7, max_tokens: 512 }
   * );
   * ```
   */
  streamChatCompletion: (
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options?: Record<string, any>
  ) => Promise<void>;
  
  /**
   * Unload the current WebLLM model to free GPU memory.
   * Useful when switching between models or cleaning up.
   * 
   * @example
   * ```tsx
   * await unloadWebLLMModel();
   * // GPU memory is now freed
   * ```
   */
  unloadWebLLMModel: () => Promise<void>;
  
  /**
   * Get list of all available WebLLM models with metadata.
   * Includes model sizes and resource requirements.
   * 
   * @returns Promise resolving to array of model records
   * 
   * @example
   * ```tsx
   * const models = await getAvailableWebLLMModels();
   * models.forEach(model => {
   *   console.log(`${model.model_id}: ${model.vram_required_MB}MB`);
   * });
   * ```
   */
  getAvailableWebLLMModels: () => Promise<WebLLMModelRecord[]>;
  
  /**
   * Check if a specific model is cached locally.
   * Cached models load much faster (no download required).
   * 
   * @param modelId - Model identifier to check
   * @returns Promise resolving to true if model is cached
   * 
   * @example
   * ```tsx
   * const isCached = await hasModelInCache('Llama-3.2-1B-Instruct-q4f16_1-MLC');
   * console.log(isCached ? 'Model cached!' : 'Will download model');
   * ```
   */
  hasModelInCache: (modelId: string) => Promise<boolean>;
  
  /** 
   * Promise that resolves when WebLLM is ready.
   * Use with React Suspense for loading states.
   */
  webLLMReadyPromise: Promise<void>;
}

/* ───────────────────────── Defaults ─────────────────────────── */

const DEFAULT_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6";
const DEFAULT_WEBLLM_MODULE_URL =
  "https://esm.run/@mlc-ai/web-llm@0.2.79";
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
  enableWebLLM = false,
  webLLMModuleUrl = DEFAULT_WEBLLM_MODULE_URL,
  onWebLLMInitProgress,
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

  /* ── WebLLM state ──────────────────────────────────────────── */
  const [isWebLLMLoaded, setIsWebLLMLoaded] = useState(false);
  const [webLLMStatus, setWebLLMStatus] = useState<ModelStatus>("idle");
  const [webLLMError, setWebLLMError] = useState<Error | null>(null);
  const [webLLMInitProgress, setWebLLMInitProgress] = useState<{ progress: number; text: string } | null>(null);
  const [currentWebLLMModel, setCurrentWebLLMModel] = useState<string | null>(null);

  /* ── refs ──────────────────────────────────────────────────── */
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const pollTimerRef = useRef<number>();
  const isPollingRef = useRef(false);
  const libraryAttemptRef = useRef(0);
  const pendingRef = useRef<Record<string, Promise<any>>>({});
  const webLLMEngineRef = useRef<any>(null);
  const webLLMScriptRef = useRef<HTMLScriptElement | null>(null);
  const webLLMPollTimerRef = useRef<number>();
  const isWebLLMPollingRef = useRef(false);
  const webLLMAttemptRef = useRef(0);

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

  /* ---- WebLLM ready promise ---- */
  const webLLMReadyPromiseRef = useRef<Promise<void>>();
  const webLLMReadyResolveRef = useRef<() => void>();
  const webLLMReadyRejectRef = useRef<(e: Error) => void>();

  if (!webLLMReadyPromiseRef.current) {
    webLLMReadyPromiseRef.current = new Promise<void>((res, rej) => {
      webLLMReadyResolveRef.current = res;
      webLLMReadyRejectRef.current = rej;
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

  const segmentImage = useCallback(
    async (
      image: string | File | Blob,
      customModel?: string,
      options: Record<string, any> = {}
    ): Promise<ImageSegmentationResult[]> => {
      const pipe = await loadModel<(...a: any[]) => Promise<ImageSegmentationResult[]>>(
        customModel || "Xenova/detr-resnet-50-panoptic",
        "image-segmentation"
      );
      return pipe(image, options);
    },
    [loadModel]
  );

  const captionImage = useCallback(
    async (
      image: string | File | Blob,
      customModel?: string,
      options: Record<string, any> = {}
    ): Promise<ImageCaptionResult[]> => {
      const pipe = await loadModel<(...a: any[]) => Promise<ImageCaptionResult[]>>(
        customModel || "Xenova/vit-gpt2-image-captioning",
        "image-to-text"
      );
      return pipe(image, options);
    },
    [loadModel]
  );

  const classifyImage = useCallback(
    async (
      image: string | File | Blob,
      customModel?: string,
      options: Record<string, any> = {}
    ): Promise<ImageClassificationResult[]> => {
      const pipe = await loadModel<(...a: any[]) => Promise<ImageClassificationResult[]>>(
        customModel || "Xenova/vit-base-patch16-224",
        "image-classification"
      );
      return pipe(image, options);
    },
    [loadModel]
  );

  /* ── WebLLM helpers ─────────────────────────────────────── */

  const clearWebLLMPolling = () => {
    if (webLLMPollTimerRef.current) {
      clearTimeout(webLLMPollTimerRef.current);
      webLLMPollTimerRef.current = undefined;
    }
    isWebLLMPollingRef.current = false;
  };

  const removeWebLLMScriptTag = () => {
    webLLMScriptRef.current?.remove();
    webLLMScriptRef.current = null;
  };

  const ensureWebLLMPolling = (deadline: number) => {
    if (isWebLLMPollingRef.current) return;
    isWebLLMPollingRef.current = true;

    const tick = async () => {
      if ((window as any).webllm?.CreateMLCEngine) {
        clearWebLLMPolling();
        removeWebLLMScriptTag();
        
        // Now create the engine
        try {
          const { CreateMLCEngine } = (window as any).webllm;
          const engine = await CreateMLCEngine("Llama-3.2-1B-Instruct-q4f16_1-MLC", {
            initProgressCallback: (progress: { progress: number; text: string }) => {
              setWebLLMInitProgress(progress);
              onWebLLMInitProgress?.(progress);
              console.debug(`[WebLLM] Init: ${progress.text} (${(progress.progress * 100).toFixed(1)}%)`);
            },
          });

          webLLMEngineRef.current = engine;
          setIsWebLLMLoaded(true);
          setWebLLMStatus("ready");
          setCurrentWebLLMModel("Llama-3.2-1B-Instruct-q4f16_1-MLC");
          webLLMReadyResolveRef.current?.();
          console.debug("[WebLLM] Engine ready");
        } catch (err: any) {
          setWebLLMError(err);
          setWebLLMStatus("error");
          webLLMReadyRejectRef.current?.(err);
          console.error("[WebLLM] Engine initialization failed:", err);
        }
        return;
      }

      if (Date.now() >= deadline) {
        clearWebLLMPolling();
        removeWebLLMScriptTag();
        handleWebLLMFailure(
          new Error(`WebLLM not ready within ${loadTimeout} ms`)
        );
        return;
      }
      webLLMPollTimerRef.current = window.setTimeout(tick, 500);
    };

    tick();
  };

  const injectWebLLMScriptTag = () => {
    if (webLLMScriptRef.current) return;

    const script = document.createElement("script");
    script.type = "module";
    script.crossOrigin = "anonymous";
    if (nonce) script.nonce = nonce;
    script.textContent = `
      import * as webllm from '${webLLMModuleUrl}';
      window.webllm = webllm;
    `;

    script.onerror = () => {
      clearWebLLMPolling();
      removeWebLLMScriptTag();
      handleWebLLMFailure(new Error("WebLLM script load error"));
    };

    document.head.appendChild(script);
    webLLMScriptRef.current = script;
    console.debug("[WebLLM] script tag injected");
  };

  const handleWebLLMFailure = (err: Error) => {
    clearWebLLMPolling();
    webLLMAttemptRef.current += 1;

    if (webLLMAttemptRef.current < maxRetries) {
      const delay =
        Math.min(1000 * 2 ** (webLLMAttemptRef.current - 1), BACKOFF_CAP) +
        Math.random() * 1000;
      console.debug(
        `[WebLLM] retrying in ${delay.toFixed(0)} ms ` +
        `(${webLLMAttemptRef.current}/${maxRetries})`
      );
      setTimeout(tryLoadWebLLM, delay);
      return;
    }

    setWebLLMError(err);
    setWebLLMStatus("error");
    webLLMReadyRejectRef.current?.(err);
    console.debug("[WebLLM] failed permanently");
  };

  const tryLoadWebLLM = useCallback(() => {
    if (!isBrowser || !enableWebLLM) return;
    if (webLLMEngineRef.current || webLLMStatus === "loading") return;

    setWebLLMStatus("loading");
    setWebLLMError(null);

    injectWebLLMScriptTag();
    ensureWebLLMPolling(Date.now() + loadTimeout);
  }, [isBrowser, enableWebLLM, webLLMStatus, loadTimeout]);

  const loadWebLLMModel = useCallback(
    async (modelId: string) => {
      if (!enableWebLLM) {
        throw new Error("WebLLM is not enabled. Set enableWebLLM={true} in TransformersProvider");
      }

      if (!(window as any).webllm?.CreateMLCEngine) {
        throw new Error("WebLLM library not loaded yet");
      }

      setWebLLMStatus("loading");
      setWebLLMError(null);

      try {
        const { CreateMLCEngine } = (window as any).webllm;

        // Unload previous engine if exists
        if (webLLMEngineRef.current) {
          await webLLMEngineRef.current.unload();
          webLLMEngineRef.current = null;
        }

        const engine = await CreateMLCEngine(modelId, {
          initProgressCallback: (progress: { progress: number; text: string }) => {
            setWebLLMInitProgress(progress);
            onWebLLMInitProgress?.(progress);
            console.debug(`[WebLLM] Loading ${modelId}: ${progress.text} (${(progress.progress * 100).toFixed(1)}%)`);
          },
        });

        webLLMEngineRef.current = engine;
        setIsWebLLMLoaded(true);
        setWebLLMStatus("ready");
        setCurrentWebLLMModel(modelId);
        console.debug(`[WebLLM] Model ${modelId} loaded successfully`);
      } catch (err: any) {
        setWebLLMError(err);
        setWebLLMStatus("error");
        throw err;
      }
    },
    [enableWebLLM, onWebLLMInitProgress]
  );

  const chatCompletion = useCallback(
    async (
      messages: ChatMessage[],
      options: Record<string, any> = {}
    ): Promise<ChatCompletionResult> => {
      if (!webLLMEngineRef.current) {
        throw new Error("WebLLM engine not initialized. Call loadWebLLMModel first.");
      }

      await webLLMReadyPromiseRef.current;

      const response = await webLLMEngineRef.current.chat.completions.create({
        messages,
        ...options,
      });

      return response;
    },
    []
  );

  const streamChatCompletion = useCallback(
    async (
      messages: ChatMessage[],
      onChunk: (chunk: string) => void,
      options: Record<string, any> = {}
    ): Promise<void> => {
      if (!webLLMEngineRef.current) {
        throw new Error("WebLLM engine not initialized. Call loadWebLLMModel first.");
      }

      await webLLMReadyPromiseRef.current;

      const chunks = await webLLMEngineRef.current.chat.completions.create({
        messages,
        stream: true,
        ...options,
      });

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          onChunk(content);
        }
      }
    },
    []
  );

  const unloadWebLLMModel = useCallback(async () => {
    if (webLLMEngineRef.current) {
      await webLLMEngineRef.current.unload();
      webLLMEngineRef.current = null;
      setIsWebLLMLoaded(false);
      setWebLLMStatus("idle");
      setCurrentWebLLMModel(null);
      setWebLLMInitProgress(null);
      console.debug("[WebLLM] Model unloaded");
    }
  }, []);

  const getAvailableWebLLMModels = useCallback(async (): Promise<WebLLMModelRecord[]> => {
    if (!enableWebLLM) {
      throw new Error("WebLLM is not enabled");
    }

    if (!(window as any).webllm?.prebuiltAppConfig) {
      throw new Error("WebLLM library not loaded yet");
    }

    try {
      const { prebuiltAppConfig } = (window as any).webllm;
      return prebuiltAppConfig.model_list as WebLLMModelRecord[];
    } catch (err) {
      console.error("[WebLLM] Failed to get model list:", err);
      return [];
    }
  }, [enableWebLLM]);

  const hasModelInCache = useCallback(async (modelId: string): Promise<boolean> => {
    if (!enableWebLLM) {
      return false;
    }

    if (!(window as any).webllm?.hasModelInCache) {
      return false;
    }

    try {
      const { hasModelInCache: checkCache } = (window as any).webllm;
      return await checkCache(modelId);
    } catch (err) {
      console.error("[WebLLM] Failed to check cache:", err);
      return false;
    }
  }, [enableWebLLM]);

  /* Initialize WebLLM on mount if enabled */
  useEffect(() => {
    if (enableWebLLM && !webLLMEngineRef.current && webLLMStatus === "idle") {
      tryLoadWebLLM();
    }
  }, [enableWebLLM, tryLoadWebLLM, webLLMStatus]);

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
    segmentImage,
    captionImage,
    classifyImage,
    readyPromise: readyPromiseRef.current!,
    // WebLLM
    isWebLLMEnabled: enableWebLLM,
    isWebLLMLoaded,
    webLLMStatus,
    webLLMError,
    webLLMInitProgress,
    currentWebLLMModel,
    loadWebLLMModel,
    chatCompletion,
    streamChatCompletion,
    unloadWebLLMModel,
    getAvailableWebLLMModels,
    hasModelInCache,
    webLLMReadyPromise: webLLMReadyPromiseRef.current!,
  };

  return (
    <TransformersContext.Provider value={ctx}>
      {children}
    </TransformersContext.Provider>
  );
}

/* ─────────────────────────── Hooks ────────────────────────── */

/**
 * Hook to access the Transformers and WebLLM context.
 * Must be used within a TransformersProvider.
 * 
 * @returns Context value containing all Transformers.js and WebLLM functionality
 * @throws Error if used outside of TransformersProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     libraryStatus,
 *     analyzeSentiment,
 *     // WebLLM features
 *     isWebLLMLoaded,
 *     chatCompletion,
 *     getAvailableWebLLMModels
 *   } = useTransformers();
 * 
 *   return <div>Status: {libraryStatus}</div>;
 * }
 * ```
 */
export function useTransformers() {
  const ctx = useContext(TransformersContext);
  if (!ctx)
    throw new Error("useTransformers must be used within TransformersProvider");
  return ctx;
}

/**
 * Suspense-compatible hook for Transformers.js ready state.
 * Throws a promise that resolves when Transformers.js is ready.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useTransformersReady(); // Suspends until ready
 *   const { analyzeSentiment } = useTransformers();
 *   
 *   return <button onClick={() => analyzeSentiment('Hello!')}>
 *     Analyze
 *   </button>;
 * }
 * 
 * // Wrap with Suspense
 * <Suspense fallback={<div>Loading AI...</div>}>
 *   <MyComponent />
 * </Suspense>
 * ```
 */
export function useTransformersReady(): void {
  const { libraryStatus, readyPromise } = useTransformers();
  if (libraryStatus !== "ready") throw readyPromise;
}

/**
 * Suspense-compatible hook for WebLLM ready state.
 * Throws a promise that resolves when WebLLM engine is ready.
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   useWebLLMReady(); // Suspends until WebLLM is ready
 *   const { chatCompletion } = useTransformers();
 *   
 *   return <div>Chat is ready!</div>;
 * }
 * 
 * // Wrap with Suspense
 * <Suspense fallback={<div>Loading LLM...</div>}>
 *   <ChatComponent />
 * </Suspense>
 * ```
 */
export function useWebLLMReady(): void {
  const { webLLMStatus, webLLMReadyPromise } = useTransformers();
  if (webLLMStatus !== "ready") throw webLLMReadyPromise;
}
