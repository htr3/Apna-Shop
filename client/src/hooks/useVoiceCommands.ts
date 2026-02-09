import { useState, useCallback } from "react";
import { voiceCommandService, VoiceCommand } from "../services/voiceCommandService";

export interface UseVoiceCommandsOptions {
  onCommand?: (command: VoiceCommand) => void;
  language?: string;
}

export function useVoiceCommands(options?: UseVoiceCommandsOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(voiceCommandService.isSupported());

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech Recognition not supported in this browser");
      return;
    }

    setError(null);
    const result = voiceCommandService.startListening({
      onStart: () => {
        setIsListening(true);
        setTranscript("");
      },
      onResult: (text) => {
        setTranscript(text);
      },
      onError: (err) => {
        setError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);

        // Parse the transcript and call onCommand
        const result = voiceCommandService.parseCommand(transcript);
        if (result.success && result.command) {
          options?.onCommand?.(result.command);
        } else if (!result.success) {
          setError(result.error ?? null);
        }
      },
    });

    if (!result.success) {
      setError(result.error ?? null);
    }
  }, [isSupported, transcript, options]);

  const stopListening = useCallback(() => {
    voiceCommandService.stopListening();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}
