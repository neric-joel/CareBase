'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface StructuredNote {
  service_type?: string;
  summary?: string;
  action_items?: string[];
  mood_assessment?: string;
  risk_flags?: string[];
  suggested_followup_date?: string | null;
  full_note?: string;
}

interface VoiceNoteRecorderProps {
  clientName?: string;
  onStructured: (note: StructuredNote) => void;
}

export function VoiceNoteRecorder({ clientName, onStructured }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fullTranscriptRef = useRef('');

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const processTranscript = useCallback(async (text: string) => {
    if (!text || text.trim().length < 10) {
      setError('Text too short. Please provide at least a few sentences.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/structure-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text.trim(),
          client_name: clientName,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to structure note');
      }

      onStructured(json.data);
      setShowManualInput(false);
      setManualText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process note');
    } finally {
      setIsProcessing(false);
    }
  }, [clientName, onStructured]);

  const startRecording = useCallback(() => {
    setError(null);
    setTranscript('');
    fullTranscriptRef.current = '';

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition not available. Use the text input instead.');
      setShowManualInput(true);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      fullTranscriptRef.current = final;
      setTranscript(final + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setError(`Mic unavailable (${event.error}). You can type your notes below instead.`);
        setShowManualInput(true);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    const finalTranscript = fullTranscriptRef.current.trim();
    if (!finalTranscript || finalTranscript.length < 10) {
      setError('Recording too short. Try the text input instead.');
      setShowManualInput(true);
      return;
    }

    await processTranscript(finalTranscript);
  }, [processTranscript]);

  if (!consentGiven) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
          <Sparkles className="h-4 w-4" />
          AI Case Note Assistant
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">AI</Badge>
        </div>
        <p className="text-xs text-amber-700">
          Dictate or type your session notes and AI will structure them into a professional case note.
          Audio is never stored — only the text is processed.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConsentGiven(true)}
          className="border-amber-300 text-amber-800 hover:bg-amber-100"
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Enable AI Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
          <Sparkles className="h-4 w-4" />
          AI Case Note Assistant
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">AI</Badge>
        </div>

        <div className="flex gap-1">
          {!isRecording && !isProcessing && !showManualInput && isSupported && (
            <Button
              type="button"
              size="sm"
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Mic className="mr-1 h-3 w-3" />
              Record
            </Button>
          )}

          {!isRecording && !isProcessing && !showManualInput && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => { setShowManualInput(true); setError(null); }}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <Type className="mr-1 h-3 w-3" />
              Type
            </Button>
          )}

          {isRecording && (
            <Button
              type="button"
              size="sm"
              onClick={stopRecording}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <MicOff className="mr-1 h-3 w-3" />
              Stop & Process
            </Button>
          )}

          {isProcessing && (
            <Button type="button" size="sm" disabled>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Structuring…
            </Button>
          )}
        </div>
      </div>

      {isRecording && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs text-red-600 font-medium">Recording…</span>
          </div>
          {transcript && (
            <p className="text-xs text-muted-foreground bg-white rounded p-2 max-h-24 overflow-y-auto">
              {transcript}
            </p>
          )}
        </div>
      )}

      {showManualInput && !isProcessing && (
        <div className="space-y-2">
          <p className="text-xs text-amber-700">
            Type or paste your raw session notes below. AI will structure them into a professional case note.
          </p>
          <Textarea
            rows={3}
            placeholder="e.g. Met with Maria today. She mentioned her husband got a new job at the warehouse. Kids are doing well in school. Still needs food box support for the next month. Diabetic diet items requested. Follow up in two weeks."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            className="text-sm bg-white"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => processTranscript(manualText)}
              disabled={manualText.trim().length < 10}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Structure with AI
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setShowManualInput(false); setError(null); }}
              className="text-amber-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
