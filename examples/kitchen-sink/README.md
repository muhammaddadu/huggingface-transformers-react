# Kitchen Sink Example

This is a comprehensive example showcasing all the features of `huggingface-transformers-react` with a beautiful Material-UI interface.

## Features Demonstrated

- **Sentiment Analysis**: Text sentiment analysis using Hugging Face models
- **Audio Transcription**: Speech-to-text functionality
- **Custom Model Loading**: How to load and use custom Hugging Face models
- **Real-time Status**: Live status updates of library and model loading states
- **Error Handling**: Comprehensive error handling examples

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

The example demonstrates several key features:

### Suspense Integration
- Toggle the "Show Suspense Example" button to see React Suspense in action
- The component suspends until AI models are fully loaded

### Sentiment Analysis
- Enter text in the textarea
- Click "Analyze Sentiment" to get sentiment analysis results
- Results show label (POSITIVE/NEGATIVE/NEUTRAL) and confidence scores

### Audio Transcription
- Upload an audio file using the file input
- Click "Transcribe Audio" to convert speech to text
- Supports common audio formats (wav, mp3, etc.)

### Custom Models
- Click "Test Custom Model" to load a specific Hugging Face model
- View loaded models and their status in the models list

## Architecture

This example uses:
- **Vite** for fast development and building
- **TypeScript** for type safety
- **React 18** with modern hooks and Suspense
- **Material-UI (MUI)** for beautiful, accessible UI components
- **Emotion** for styling and theming
- **Lucide React** for additional modern icons

The app structure:
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main component with Material-UI enhanced features
- `vite.config.ts` - Vite configuration optimized for AI models
- `tsconfig.json` - TypeScript configuration for modern React development

## Important Notes

### CORS Headers
The Vite development server is configured with special CORS headers required for Hugging Face Transformers.js to work properly in the browser.

### Model Loading
- Models are downloaded and cached on first use
- Larger models may take time to download initially
- The app shows loading states during model initialization

### Browser Compatibility
- Requires a modern browser with WebAssembly support
- Best performance on Chrome/Edge with SharedArrayBuffer support 