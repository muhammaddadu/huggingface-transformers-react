# 🤗 Hugging Face Transformers React

[![npm version](https://badge.fury.io/js/huggingface-transformers-react.svg)](https://badge.fury.io/js/huggingface-transformers-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)](https://reactjs.org/)

A React provider and hooks for seamlessly integrating [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js) into your React applications. This library provides intelligent loading states, error handling, model caching, React Suspense support, and comprehensive image processing capabilities including segmentation, classification, and captioning.

## 📚 Documentation & Demo

- 📖 **[Complete Documentation](https://muhammaddadu.github.io/huggingface-transformers-react/)** - Full API reference and guides
- 🎮 **[Live Kitchen Sink Demo](https://muhammaddadu.github.io/huggingface-transformers-react/example)** - Interactive showcase of all features

## ✨ Features

- 🚀 **Easy Integration**: Drop-in React provider with zero configuration
- 🔄 **Intelligent Loading**: Automatic retry logic with exponential backoff
- 💾 **Model Caching**: Efficient model lifecycle management
- ⚡ **Suspense Ready**: Built-in React Suspense support for smooth UX
- 🛡️ **Error Handling**: Comprehensive error boundaries and recovery
- 🎵 **Audio Processing**: Automatic audio format conversion for Whisper models
- 🖼️ **Image Processing**: Complete image analysis suite
  - **Image Segmentation**: Object detection and segmentation with mask generation
  - **Image Classification**: Classify objects and scenes with confidence scores
  - **Image Captioning**: Generate descriptive text from images
- 🤖 **WebLLM Support**: Run large language models in the browser (loaded from CDN)
  - **Llama 3.2, Phi-2, Mistral**: Support for popular LLM models
  - **Streaming Chat**: Real-time token streaming for chat completions
  - **Model Management**: Load, switch, and cache models on the fly
  - **WebGPU Acceleration**: Fast inference using GPU in the browser
  - **Privacy-First**: All processing happens locally, no backend required
  - **Zero Dependencies**: Loaded dynamically from CDN, no npm package needed
- 🔒 **TypeScript**: Full TypeScript support with detailed type definitions
- 🌐 **SSR Compatible**: Server-side rendering friendly
- 📦 **Tree Shakable**: Optimized bundle size with ES modules
- 🎛️ **Configurable**: Customizable loading timeouts, retry logic, and more

## 📦 Installation

### Basic Installation

```bash
npm install huggingface-transformers-react
```

```bash
yarn add huggingface-transformers-react
```

```bash
pnpm add huggingface-transformers-react
```

### With WebLLM Support (Optional)

WebLLM support is built-in and loaded automatically from CDN when enabled - no additional installation required!

Simply set `enableWebLLM={true}` in the TransformersProvider:

```tsx
<TransformersProvider enableWebLLM={true}>
  <App />
</TransformersProvider>
```

**Note:** WebLLM requires a WebGPU-capable browser (Chrome/Edge 113+ recommended)

## 🚀 Quick Start

### Basic Setup

Wrap your app with the `TransformersProvider`:

```tsx
import React from 'react';
import { TransformersProvider } from 'huggingface-transformers-react';
import App from './App';

function Root() {
  return (
    <TransformersProvider>
      <App />
    </TransformersProvider>
  );
}

export default Root;
```

### Using the Hook

```tsx
import React, { useEffect, useState } from 'react';
import { useTransformers } from 'huggingface-transformers-react';

function SentimentAnalyzer() {
  const { libraryStatus, analyzeSentiment } = useTransformers();
  const [result, setResult] = useState(null);
  const [text, setText] = useState('I love this library!');

  const handleAnalyze = async () => {
    if (libraryStatus === 'ready') {
      const sentiment = await analyzeSentiment(text);
      setResult(sentiment);
    }
  };

  return (
    <div>
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to analyze..."
      />
      <button 
        onClick={handleAnalyze} 
        disabled={libraryStatus !== 'ready'}
      >
        {libraryStatus === 'loading' ? 'Loading AI...' : 'Analyze Sentiment'}
      </button>
      {result && (
        <div>
          <strong>Sentiment:</strong> {result[0].label} ({result[0].score.toFixed(2)})
        </div>
      )}
    </div>
  );
}
```

### With React Suspense

For the smoothest user experience, use with React Suspense:

```tsx
import React, { Suspense } from 'react';
import { TransformersProvider, useTransformersReady, useTransformers } from 'huggingface-transformers-react';

function AIFeature() {
  useTransformersReady(); // This will suspend until ready
  const { analyzeSentiment } = useTransformers();
  
  // Component will only render when transformers is ready
  return (
    <div>
      <h2>AI-Powered Features</h2>
      {/* Your AI features here */}
    </div>
  );
}

function App() {
  return (
    <TransformersProvider>
      <Suspense fallback={<div>🤖 Loading AI models...</div>}>
        <AIFeature />
      </Suspense>
    </TransformersProvider>
  );
}
```

## 📖 API Reference

### `<TransformersProvider>`

The main provider component that manages the Transformers.js library.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | React children to render |
| `moduleUrl` | `string` | CDN URL | Custom URL for the transformers library |
| `loadTimeout` | `number` | `60000` | Timeout in milliseconds for loading |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `nonce` | `string` | - | CSP nonce for script tags |
| `onLibraryError` | `(error: Error) => void` | - | Library loading error callback |
| `onModelError` | `(modelId: string, error: Error) => void` | - | Model loading error callback |

#### Example with Custom Configuration

```tsx
<TransformersProvider
  moduleUrl="/static/transformers.esm.js"
  loadTimeout={30000}
  maxRetries={5}
  nonce={cspNonce}
  onLibraryError={(error) => console.error('Library failed:', error)}
  onModelError={(modelId, error) => console.error(`Model ${modelId} failed:`, error)}
>
  <App />
</TransformersProvider>
```

### `useTransformers()`

Hook to access the transformers context and functionality.

#### Returns

```tsx
interface TransformersContextValue {
  // Library State
  isLibraryLoaded: boolean;
  libraryStatus: 'idle' | 'loading' | 'ready' | 'error';
  libraryError: Error | null;
  
  // Model State
  models: Record<string, any>;
  modelStatus: Record<string, ModelStatus>;
  modelErrors: Record<string, Error | null>;
  
  // Actions
  loadModel: <T>(modelId: string, task?: string, retry?: number) => Promise<T>;
  unloadModel: (modelId: string) => void;
  analyzeSentiment: (text: string, customModel?: string, options?: any) => Promise<SentimentResult[]>;
  transcribeAudio: (audio: Blob | File, options?: any) => Promise<{ text: string }>;
  
  // Image Processing
  segmentImage: (image: string | File | Blob, customModel?: string, options?: any) => Promise<ImageSegmentationResult[]>;
  captionImage: (image: string | File | Blob, customModel?: string, options?: any) => Promise<ImageCaptionResult[]>;
  classifyImage: (image: string | File | Blob, customModel?: string, options?: any) => Promise<ImageClassificationResult[]>;
  
  // Suspense
  readyPromise: Promise<void>;
}
```

### `useTransformersReady()`

Suspense-friendly hook that suspends rendering until the library is ready.

```tsx
function MyAIComponent() {
  useTransformersReady(); // Suspends until ready
  const { analyzeSentiment } = useTransformers();
  
  // Safe to use AI features here
  return <div>AI features ready!</div>;
}
```

## 🎯 Advanced Usage

### Custom Models

Load and use custom models for specific tasks:

```tsx
function CustomModelExample() {
  const { loadModel, libraryStatus } = useTransformers();
  const [result, setResult] = useState(null);

  const useCustomModel = async () => {
    if (libraryStatus === 'ready') {
      // Load a specific model
      const classifier = await loadModel(
        'cardiffnlp/twitter-roberta-base-sentiment-latest',
        'sentiment-analysis'
      );
      
      const result = await classifier('This is amazing!');
      setResult(result);
    }
  };

  return (
    <div>
      <button onClick={useCustomModel}>
        Use Custom Model
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

### Audio Transcription

The library automatically handles audio format conversion for Whisper models, converting audio blobs to the required Float32Array format with proper resampling to 16kHz.

```tsx
function AudioTranscription() {
  const { transcribeAudio, libraryStatus } = useTransformers();
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && libraryStatus === 'ready') {
      setLoading(true);
      try {
        // Library automatically converts audio to proper format for Whisper
        const result = await transcribeAudio(file);
        setTranscription(result.text);
      } catch (error) {
        console.error('Transcription failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Voice recording example
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const result = await transcribeAudio(audioBlob);
        setTranscription(result.text);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
      console.error('Recording failed:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setRecording(false);
    }
  };

  return (
    <div>
      <div>
        <input 
          type="file" 
          accept="audio/*" 
          onChange={handleFileUpload}
          disabled={libraryStatus !== 'ready' || loading}
        />
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={libraryStatus !== 'ready' || loading}
        >
          {recording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
      
      {loading && <p>Processing audio...</p>}
      {transcription && (
        <div>
          <h3>Transcription:</h3>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}
```

#### Audio Format Support

The `transcribeAudio` function automatically handles:
- **Format Conversion**: Converts Blob/File to Float32Array required by Whisper
- **Sample Rate**: Automatically resamples to 16kHz (Whisper requirement)
- **Mono Conversion**: Converts stereo to mono by using the first channel
- **Browser Compatibility**: Uses Web Audio API for optimal performance

Supported audio formats: WAV, MP3, MP4, WebM, OGG, and any format supported by the browser's AudioContext.

### Image Processing

The library provides comprehensive image processing capabilities including segmentation, classification, and captioning.

```tsx
function ImageProcessingExample() {
  const { segmentImage, classifyImage, captionImage, libraryStatus } = useTransformers();
  const [image, setImage] = useState(null);
  const [results, setResults] = useState({});

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setResults({});
    }
  };

  const processImage = async (type) => {
    if (!image || libraryStatus !== 'ready') return;

    try {
      let result;
      switch (type) {
        case 'segment':
          // Segment objects in the image
          result = await segmentImage(image);
          break;
        case 'classify':
          // Classify the image with top 5 results
          result = await classifyImage(image, 'Xenova/vit-base-patch16-224', { top_k: 5 });
          break;
        case 'caption':
          // Generate a caption for the image
          result = await captionImage(image);
          break;
      }
      setResults(prev => ({ ...prev, [type]: result }));
    } catch (error) {
      console.error(`${type} failed:`, error);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleImageUpload}
        disabled={libraryStatus !== 'ready'}
      />
      
      {image && (
        <div>
          <img 
            src={URL.createObjectURL(image)} 
            alt="Preview" 
            style={{ maxWidth: '300px', maxHeight: '300px' }}
          />
          
          <div>
            <button onClick={() => processImage('segment')}>
              Segment Objects
            </button>
            <button onClick={() => processImage('classify')}>
              Classify Image
            </button>
            <button onClick={() => processImage('caption')}>
              Generate Caption
            </button>
          </div>
        </div>
      )}
      
      {results.caption && (
        <div>
          <h3>Caption:</h3>
          <p>{results.caption[0].generated_text}</p>
        </div>
      )}
      
      {results.classify && (
        <div>
          <h3>Classification:</h3>
          {results.classify.map((item, i) => (
            <div key={i}>
              {item.label}: {(item.score * 100).toFixed(1)}%
            </div>
          ))}
        </div>
      )}
      
      {results.segment && (
        <div>
          <h3>Segmentation:</h3>
          <p>Found {results.segment.length} objects</p>
        </div>
      )}
    </div>
  );
}
```

#### Image Processing Features

- **Image Segmentation**: Detect and segment objects with mask generation
  - Default model: `Xenova/detr-resnet-50-panoptic`
  - Returns: Array of objects with labels, scores, and mask data
  
- **Image Classification**: Classify scenes and objects with confidence scores
  - Default model: `Xenova/vit-base-patch16-224`
  - Options: `top_k` to limit number of results
  - Returns: Array of labels with confidence scores
  
- **Image Captioning**: Generate descriptive text from images
  - Default model: `Xenova/vit-gpt2-image-captioning`
  - Returns: Array of generated text descriptions

### Model Management

```tsx
function ModelManager() {
  const { models, modelStatus, loadModel, unloadModel } = useTransformers();
  
  const loadSentimentModel = () => {
    loadModel('Xenova/distilbert-base-uncased-finetuned-sst-2-english', 'sentiment-analysis');
  };
  
  const unloadSentimentModel = () => {
    unloadModel('Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  };

  return (
    <div>
      <h3>Loaded Models:</h3>
      {Object.entries(models).map(([modelId, model]) => (
        <div key={modelId}>
          <span>{modelId}</span>
          <span>Status: {modelStatus[modelId]}</span>
          <button onClick={() => unloadModel(modelId)}>Unload</button>
        </div>
      ))}
      
      <button onClick={loadSentimentModel}>
        Load Sentiment Model
      </button>
    </div>
  );
}
```

## 🔧 Configuration

### Content Security Policy (CSP)

If you're using CSP, you'll need to allow the transformers script:

```tsx
<TransformersProvider nonce={cspNonce}>
  <App />
</TransformersProvider>
```

### Self-Hosting

You can self-host the transformers library:

```tsx
<TransformersProvider moduleUrl="/static/transformers.esm.js">
  <App />
</TransformersProvider>
```

### Error Handling

```tsx
function AppWithErrorHandling() {
  const handleLibraryError = (error: Error) => {
    console.error('Transformers library failed to load:', error);
    // Report to error tracking service
  };

  const handleModelError = (modelId: string, error: Error) => {
    console.error(`Model ${modelId} failed to load:`, error);
    // Show user-friendly error message
  };

  return (
    <TransformersProvider
      onLibraryError={handleLibraryError}
      onModelError={handleModelError}
    >
      <App />
    </TransformersProvider>
  );
}
```

## 🎭 Examples

### Live Demos

- 🎮 **[Kitchen Sink Demo](https://muhammaddadu.github.io/huggingface-transformers-react/example)** - Interactive showcase featuring sentiment analysis, speech-to-text, image segmentation, image classification, image captioning, and model testing

### Local Examples

Check out our [examples directory](./examples) for complete working examples:

- [Kitchen Sink Demo](./examples/kitchen-sink) - Source code for the comprehensive demo showcasing all library features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Run tests: `npm test`
5. Build: `npm run build`

## 📚 Documentation

- 📖 **[Complete API Documentation](https://muhammaddadu.github.io/huggingface-transformers-react/)** - Full reference guide with examples
- 🎮 **[Live Interactive Demo](https://muhammaddadu.github.io/huggingface-transformers-react/example)** - Try all features in your browser
- 🤗 **[Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js)** - Core library documentation
- ⚛️ **[React Context API](https://react.dev/reference/react/useContext)** - React pattern reference

**Browser Compatibility**

Audio transcription requires:
- Modern browser with Web Audio API support
- HTTPS for microphone access
- Supported audio formats (most common formats work)

### Common Issues

**Library not loading**
- Check network connectivity
- Verify CSP settings if using strict CSP
- Try increasing `loadTimeout` prop

**Models failing to load**
- Check available memory (models can be large)
- Verify internet connection
- Try different model IDs

## 🐛 Issues

If you encounter any issues, please [create an issue](https://github.com/muhammaddadu/huggingface-transformers-react/issues) on GitHub.

## 📄 License

MIT © [Muhammad Dadu](https://github.com/muhammaddadu)

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for the amazing Transformers.js library
- The React team for the incredible framework
- All contributors who help make this project better

---

Made with ❤️ by [Muhammad Dadu](https://github.com/muhammaddadu) 