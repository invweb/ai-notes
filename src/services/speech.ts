import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useState, useCallback, useRef } from 'react';

export interface SpeechRecognitionState {
  isRecording: boolean;
  transcript: string;
  error: string | null;
}

export function useSpeechRecognition(onTranscript?: (text: string) => void) {
  const [state, setState] = useState<SpeechRecognitionState>({
    isRecording: false,
    transcript: '',
    error: null,
  });

  const finalTranscriptRef = useRef('');

  useSpeechRecognitionEvent('start', () => {
    finalTranscriptRef.current = '';
    setState((prev) => ({ ...prev, isRecording: true, error: null, transcript: '' }));
  });

  useSpeechRecognitionEvent('end', () => {
    setState((prev) => ({ ...prev, isRecording: false }));
  });

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0];
    if (result) {
      const interimTranscript = result.transcript;
      setState((prev) => ({
        ...prev,
        transcript: interimTranscript,
      }));

      if (event.isFinal) {
        finalTranscriptRef.current += interimTranscript;
        onTranscript?.(finalTranscriptRef.current);
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setState((prev) => ({
      ...prev,
      isRecording: false,
      error: event.message || 'Ошибка распознавания речи',
    }));
  });

  const startRecording = useCallback(async (lang = 'ru-RU') => {
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setState((prev) => ({
          ...prev,
          error: 'Разрешение на микрофон не получено',
        }));
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось начать запись';
      setState((prev) => ({
        ...prev,
        error: message,
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const abortRecording = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState((prev) => ({ ...prev, transcript: '', error: null }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    abortRecording,
    clearTranscript,
  };
}
