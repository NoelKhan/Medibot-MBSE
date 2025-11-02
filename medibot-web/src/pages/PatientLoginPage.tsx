/**
 * Patient Login Page
 * ==================
 * Login page ONLY for patients
 * Separated from medical and emergency staff for security
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { medibotColors } from '../theme/medibot-theme';

// PATIENT TEST ACCOUNTS ONLY
const PATIENT_TEST_ACCOUNTS = [
  {
    email: 'test@medibot.com',
    password: 'Test123!',
    name: 'API Test Patient',
    description: 'Full backend integration with case history',
  },
  {
    email: 'sarah.johnson@example.com',
    password: 'password123',
    name: 'Sarah Johnson',
    description: '29F, Asthma & Allergies',
  },
  {
    email: 'robert.chen@example.com',
    password: 'password123',
    name: 'Robert Chen',
    description: '49M, Type 2 Diabetes',
  },
  {
    email: 'margaret.williams@example.com',
    password: 'password123',
    name: 'Margaret Williams',
    description: '78F, Multiple chronic conditions',
  },
];

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Patient login attempt:', email);

    try {
      await login(email, password);
      console.log('✅ Login successful, navigating to /home');
      // Patient-specific navigation: go to home dashboard
      navigate('/home');
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectTestAccount = (account: typeof PATIENT_TEST_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setShowTestAccounts(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: medibotColors.neutral[50],
        position: 'relative',
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          bgcolor: 'white',
          boxShadow: 2,
          '&:hover': {
            bgcolor: medibotColors.neutral[100],
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <Paper 
            elevation={6} 
            sx={{ 
              p: 4, 
              borderRadius: 4,
              border: `2px solid ${medibotColors.primary[100]}`,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {/* Logo */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${medibotColors.primary[500]} 0%, ${medibotColors.primary[700]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  boxShadow: `0 8px 24px ${medibotColors.primary[500]}40`,
                }}
              >
                <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>

              <Typography variant="h4" component="h1" gutterBottom fontWeight="700">
                Patient Login
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Sign in to access your healthcare services
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Test Accounts Section */}
            {showTestAccounts && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                    🧪 Test Patient Accounts
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowTestAccounts(false)}
                    sx={{ textTransform: 'none' }}
                  >
                    Hide
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {PATIENT_TEST_ACCOUNTS.map((account, index) => (
                    <Card
                      key={index}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: `1px solid ${medibotColors.primary[500]}30`,
                        '&:hover': {
                          borderColor: medibotColors.primary[500],
                          boxShadow: `0 4px 12px ${medibotColors.primary[500]}20`,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => selectTestAccount(account)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor: `${medibotColors.primary[500]}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <PersonIcon sx={{ color: medibotColors.primary[500], fontSize: 24 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="600" noWrap>
                              {account.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              {account.description}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: medibotColors.primary[500], fontSize: '0.7rem' }}>
                              {account.email}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            {!showTestAccounts && (
              <Button
                size="small"
                fullWidth
                onClick={() => setShowTestAccounts(true)}
                sx={{ mb: 2, textTransform: 'none' }}
              >
                Show Test Accounts
              </Button>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: `0 4px 16px ${medibotColors.primary[500]}40`,
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    underline="hover"
                    sx={{ 
                      cursor: 'pointer',
                      color: medibotColors.primary[600],
                      fontWeight: 600,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/register');
                    }}
                  >
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </form>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
