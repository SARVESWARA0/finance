'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  X, 
  Mic, 
  MicOff 
} from 'lucide-react';

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const suggestions = [
    "Analyze AAPL's recent performance",
    "Compare MSFT and GOOGL",
    "Should I invest in Tesla now?",
    "What's the outlook for AMD?"
  ];

  // Initialize audio recording
  useEffect(() => {
    async function initializeAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioChunks(chunks => [...chunks, event.data]);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await handleAudioSubmit(audioBlob);
          setAudioChunks([]);
        };
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    }

    initializeAudio();
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const startListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      setIsListening(true);
      setInput('');
      mediaRecorderRef.current.start();
      setAudioChunks([]);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const handleAudioSubmit = async (audioBlob) => {
    if (!audioBlob || isLoading) return;

    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const filename = `voice_message_${timestamp}.webm`;
      const audioFile = new File([audioBlob], filename, {
        type: 'audio/webm',
        lastModified: Date.now()
      });

      const formData = new FormData();
      formData.append('audio', audioFile);

      const userMessage = { 
        role: 'user', 
        content: 'Voice message sent...', 
        id: Date.now(),
        isVoice: true 
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        id: Date.now() + 1
      }]);
    } catch (error) {
      console.error('Audio submission error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your voice message. Please try again.',
        id: Date.now() + 1,
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        id: Date.now() + 1
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        id: Date.now() + 1,
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTrend = (value) => {
    if (!value) return null;
    if (value > 0) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    if (value < 0) return <TrendingDown className="w-5 h-5 text-rose-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const formatMessage = (content, isError = false, isVoice = false) => {
    if (isVoice) {
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <Mic className="w-4 h-4" />
          <span>Voice message sent</span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex items-center gap-3 text-rose-600">
          <AlertCircle className="w-5 h-5" />
          <span>{content}</span>
        </div>
      );
    }

    if (content.includes('$') || content.includes('%')) {
      const sections = content.split('\n\n');
      return sections.map((section, index) => {
        if (section.trim().startsWith('Current Market Data:')) {
          const metrics = section.split('\n').slice(1);
          return (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              {metrics.map((metric, i) => {
                const [label, value] = metric.split(': ').map(s => s.trim());
                if (!label || !value) return null;
                const isChange = label.includes('Change') || label.includes('growth');
                
                return (
                  <div key={i} className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-sm text-gray-600 mb-1">{label.replace('- ', '')}</div>
                    <div className="text-lg font-semibold flex items-center gap-2">
                      {value}
                      {isChange && renderTrend(parseFloat(value))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        
        if (section.trim().startsWith('Market Analysis:')) {
          const analysisPoints = section.split('\n').slice(1);
          return (
            <div key={index} className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm my-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Market Analysis</h3>
              <ul className="space-y-3">
                {analysisPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                    <span className="text-gray-700">{point.replace('- ', '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        
        return <div key={index} className="my-4 text-gray-700">{section}</div>;
      });
    }
    
    return <div className="whitespace-pre-wrap text-gray-700">{content}</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Voice-Enabled Stock Analysis Assistant
            </h1>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 animate-spin" />
                Analyzing market data...
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="relative mb-8">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  ref={inputRef}
                  className="w-full pl-10 pr-16 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white/50 backdrop-blur-sm transition-shadow hover:shadow-sm"
                  value={input}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Ask about any stock or click the microphone..."
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-xl ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center gap-2"
              >
                Analyze
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-6 rounded-xl ${
                  message.role === 'user'
                    ? 'bg-blue-50 border border-blue-100 ml-auto max-w-[85%]'
                    : 'bg-white/50 backdrop-blur-sm border border-gray-200 max-w-full'
                }`}
              >
                {formatMessage(message.content, message.error, message.isVoice)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}