/**
 * Voice Commands Service
 * Integrates Web Speech API for voice-to-text conversion
 * This runs on the client-side
 */

export interface VoiceCommand {
  text: string;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface VoiceCommandResult {
  success: boolean;
  command?: VoiceCommand;
  error?: string;
}

class VoiceCommandService {
  private recognition: any;
  private isListening: boolean = false;
  private callbacks: {
    onStart?: () => void;
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  } = {};

  constructor() {
    // Initialize Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.language = "en-US";

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      this.callbacks.onResult?.(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.callbacks.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onEnd?.();
    };
  }

  /**
   * Start listening for voice commands
   */
  startListening(callbacks: typeof this.callbacks) {
    if (!this.recognition) {
      return {
        success: false,
        error: "Speech Recognition not supported in this browser",
      };
    }

    this.callbacks = callbacks;
    this.recognition.start();
    return { success: true };
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      return { success: true };
    }
    return { success: false };
  }

  /**
   * Parse voice command text and extract action + parameters
   */
  parseCommand(transcript: string): VoiceCommandResult {
    const lowerText = transcript.toLowerCase().trim();

    // Sales commands
    if (
      lowerText.includes("add sale") ||
      lowerText.includes("new sale") ||
      lowerText.includes("record sale")
    ) {
      const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

      if (!amount) {
        return {
          success: false,
          error: "Please specify an amount",
        };
      }

      return {
        success: true,
        command: {
          text: transcript,
          action: "ADD_SALE",
          parameters: { amount },
          confidence: 0.9,
        },
      };
    }

    // Customer commands
    if (
      lowerText.includes("add customer") ||
      lowerText.includes("new customer")
    ) {
      const nameMatch = transcript.match(/customer\s+([a-zA-Z\s]+)/i);
      const name = nameMatch ? nameMatch[1].trim() : null;

      if (!name) {
        return {
          success: false,
          error: "Please specify a customer name",
        };
      }

      return {
        success: true,
        command: {
          text: transcript,
          action: "ADD_CUSTOMER",
          parameters: { name },
          confidence: 0.85,
        },
      };
    }

    // Borrowing/Credit commands
    if (
      lowerText.includes("add borrowing") ||
      lowerText.includes("credit") ||
      lowerText.includes("udhaar")
    ) {
      const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)/);
      const nameMatch = transcript.match(/(?:for|to)\s+([a-zA-Z\s]+)/i);

      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
      const customerName = nameMatch ? nameMatch[1].trim() : null;

      if (!amount || !customerName) {
        return {
          success: false,
          error: "Please specify amount and customer name",
        };
      }

      return {
        success: true,
        command: {
          text: transcript,
          action: "ADD_BORROWING",
          parameters: { amount, customerName },
          confidence: 0.85,
        },
      };
    }

    // View commands
    if (lowerText.includes("show dashboard")) {
      return {
        success: true,
        command: {
          text: transcript,
          action: "VIEW_DASHBOARD",
          parameters: {},
          confidence: 0.95,
        },
      };
    }

    if (lowerText.includes("show sales")) {
      return {
        success: true,
        command: {
          text: transcript,
          action: "VIEW_SALES",
          parameters: {},
          confidence: 0.95,
        },
      };
    }

    if (lowerText.includes("show customers")) {
      return {
        success: true,
        command: {
          text: transcript,
          action: "VIEW_CUSTOMERS",
          parameters: {},
          confidence: 0.95,
        },
      };
    }

    if (lowerText.includes("show borrowings")) {
      return {
        success: true,
        command: {
          text: transcript,
          action: "VIEW_BORROWINGS",
          parameters: {},
          confidence: 0.95,
        },
      };
    }

    // Generic fallback
    return {
      success: false,
      error: "Command not recognized",
    };
  }

  /**
   * Check if voice recognition is supported
   */
  isSupported(): boolean {
    return !!this.recognition;
  }

  /**
   * Check if currently listening
   */
  getListeningStatus(): boolean {
    return this.isListening;
  }
}

export const voiceCommandService = new VoiceCommandService();
