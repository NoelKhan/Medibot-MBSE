import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Warning as WarningIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import AIAgentService from '../services/AIAgentService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TriageResult {
  severity: string;
  confidence: number;
  recommendation: string;
  suggestedActions: string[];
  disclaimer: string;
  needsMoreInfo?: boolean;
  possibleConditions?: string[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'emergency':
      return '#ef4444'; // Red
    case 'urgent':
      return '#f59e0b'; // Orange
    case 'referral':
      return '#eab308'; // Yellow
    case 'self_care':
      return '#22c55e'; // Green
    default:
      return '#6b7280'; // Gray
  }
};

const getSeverityLabel = (severity: string) => {
  switch (severity) {
    case 'emergency':
      return '🔴 EMERGENCY';
    case 'urgent':
      return '🟠 URGENT';
    case 'referral':
      return '🟡 SEE DOCTOR';
    case 'self_care':
      return '🟢 SELF-CARE';
    default:
      return '⚪ UNKNOWN';
  }
};

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // ⚠️ TEMPORARY: Auth disabled for testing
    console.log('🎯 AIChat - Auth disabled for testing');
    // Token no longer required for demo
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await AIAgentService.getChatHistory(5);
      const historicalMessages: Message[] = [];
      history.forEach((item: any) => {
        historicalMessages.push({
          role: 'user',
          content: item.userMessage,
          timestamp: new Date(item.timestamp),
        });
        historicalMessages.push({
          role: 'assistant',
          content: item.assistantResponse,
          timestamp: new Date(item.timestamp),
        });
      });
      setMessages(historicalMessages);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await AIAgentService.chatTriage(input, true);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.recommendation,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setTriageResult(response);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact support.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', gap: 2, p: 2 }}>
      {/* Chat Section */}
      <Paper
        sx={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            <BotIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            AI Medical Assistant
          </Typography>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            bgcolor: '#f8f9fa',
          }}
        >
          {messages.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Hello! I'm your AI medical assistant. Describe your symptoms, and I'll help assess
                the situation. Remember, this is not a replacement for professional medical advice.
              </Typography>
            </Alert>
          )}

          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: message.role === 'user' ? '#667eea' : '#22c55e',
                }}
              >
                {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
              </Avatar>

              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.role === 'user' ? '#667eea' : 'white',
                  color: message.role === 'user' ? 'white' : 'inherit',
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7,
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#22c55e' }}>
                <BotIcon />
              </Avatar>
              <Paper sx={{ p: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                  Analyzing...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Describe your symptoms..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                minWidth: 100,
              }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Medical Report Section */}
      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          bgcolor: '#f8f9fa',
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          <HospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Medical Assessment
        </Typography>

        {!triageResult && (
          <Alert severity="info">
            Start a conversation to see your medical assessment here in real-time.
          </Alert>
        )}

        {triageResult && (
          <Box>
            {/* Severity Badge */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Severity Level
                </Typography>
                <Chip
                  label={getSeverityLabel(triageResult.severity)}
                  sx={{
                    bgcolor: getSeverityColor(triageResult.severity),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    py: 2,
                    px: 1,
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Confidence: {(triageResult.confidence * 100).toFixed(0)}%
                </Typography>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recommendation
                </Typography>
                <Typography variant="body2">{triageResult.recommendation}</Typography>
              </CardContent>
            </Card>

            {/* Suggested Actions */}
            {triageResult.suggestedActions && triageResult.suggestedActions.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Suggested Actions
                  </Typography>
                  <List dense>
                    {triageResult.suggestedActions.map((action, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`• ${action}`} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Possible Conditions */}
            {triageResult.possibleConditions && triageResult.possibleConditions.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Possible Conditions
                  </Typography>
                  {triageResult.possibleConditions.map((condition, index) => (
                    <Chip key={index} label={condition} size="small" sx={{ mr: 1, mb: 1 }} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <Alert severity="warning" icon={<WarningIcon />}>
              <Typography variant="caption">{triageResult.disclaimer}</Typography>
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
