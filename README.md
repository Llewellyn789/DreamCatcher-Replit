
# DreamCatcher

A Progressive Web App for recording, transcribing, and analyzing your dreams using AI.

## Quick Start

**Live App**: [Open DreamCatcher](https://your-replit-url.com) → Record → Interpret → Save → Dream Log

### For Developers

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app runs on port 5000 in development mode.

## Features

- **Voice Recording**: Record dreams using your device's microphone
- **AI Transcription**: Automatic speech-to-text using OpenAI Whisper
- **Dream Analysis**: AI-powered interpretation using GPT-4
- **Local Storage**: Dreams saved securely in your browser
- **Dream Log**: Browse and search your dream history
- **Analytics**: Visualize patterns and themes in your dreams
- **PWA Ready**: Install on mobile and desktop devices

## Privacy

Dreams stored in localStorage on your device only. Only submitted text is sent to our AI proxy for analysis. No personal data is stored on our servers.

## Known Issues

- Audio recording may not work in some browsers without HTTPS
- Large audio files may take longer to process
- Storage quota limitations on some mobile browsers
- Voice recording unavailable without microphone permission
- Offline functionality limited to viewing saved dreams
- Some browsers may show install prompts inconsistently

## Tester Guide

For detailed testing instructions and feedback forms, see our [2-Minute Tester Guide](https://example.com/tester-guide) (coming soon).

### Quick Testing Flow

1. **Record**: Test voice recording with a short dream description
2. **Transcribe**: Verify audio-to-text accuracy
3. **Interpret**: Check AI analysis quality and relevance
4. **Save**: Confirm dreams persist after browser refresh
5. **Browse**: Navigate the Dream Log and search functionality

Please report issues or feedback through the app's feedback form.

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4 + Whisper API
- **Charts**: Recharts for analytics visualization

## Development

This app is built on Replit and designed for easy deployment and sharing. The development environment includes hot reloading and automatic dependency management.

## Contributing

This is currently in private beta. Feedback and bug reports are welcome through the in-app feedback system.
