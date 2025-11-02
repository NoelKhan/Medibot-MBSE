/**
 * Medical Staff Login Page
 * =========================
 * Login page ONLY for doctors and medical staff
 * Separated from patients and emergency staff for security
 * Can view Severity 1-4 cases (Low, Medium, High, Urgent)
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
  MedicalServices as MedicalIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { medibotColors } from '../theme/medibot-theme';

// MEDICAL STAFF TEST ACCOUNTS ONLY
const MEDICAL_STAFF_TEST_ACCOUNTS = [
  {
    email: 'test@medical.com',
    password: 'Test123!',
    name: 'API Test Doctor',
    staffId: 'API-001',
    description: 'Backend API integration for medical staff',
    role: 'Doctor',
  },
  {
    email: 'supervisor@health.vic.gov.au',
    password: 'staff2024',
    name: 'Dr. Michael Chen',
    staffId: 'SUP001',
    description: 'Doctor - Emergency Services (6 cases)',
    role: 'Doctor',
  },
  {
    email: 'nurse@health.vic.gov.au',
    password: 'staff2024',
    name: 'Emma Thompson',
    staffId: 'NUR001',
    description: 'Nurse - Triage Department (6 cases)',
    role: 'Nurse',
  },
];

export default function MedicalStaffLoginPage() {
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

    try {
      await login(email, password);
      // Medical staff navigation: go to cases (their main dashboard)
      navigate('/cases');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectTestAccount = (account: typeof MEDICAL_STAFF_TEST_ACCOUNTS[0]) => {
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
              border: `2px solid ${medibotColors.secondary[100]}`,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {/* Logo */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${medibotColors.secondary[500]} 0%, ${medibotColors.secondary[700]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  boxShadow: `0 8px 24px ${medibotColors.secondary[500]}40`,
                }}
              >
                <MedicalIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>

              <Typography variant="h4" component="h1" gutterBottom fontWeight="700">
                Medical Staff Login
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Professional portal for healthcare providers
              </Typography>
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="caption" fontWeight="600">
                  Access: Severity 1-4 cases (Low, Medium, High, Urgent)
                </Typography>
              </Alert>
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
                    🧪 Test Medical Staff Accounts
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
                  {MEDICAL_STAFF_TEST_ACCOUNTS.map((account, index) => (
                    <Card
                      key={index}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: `1px solid ${medibotColors.secondary[500]}30`,
                        '&:hover': {
                          borderColor: medibotColors.secondary[500],
                          boxShadow: `0 4px 12px ${medibotColors.secondary[500]}20`,
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
                              bgcolor: `${medibotColors.secondary[500]}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <MedicalIcon sx={{ color: medibotColors.secondary[500], fontSize: 24 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="600" noWrap>
                              {account.name} ({account.role})
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              {account.description}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: medibotColors.secondary[500], fontSize: '0.7rem' }}>
                              {account.email} • ID: {account.staffId}
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
                  bgcolor: medibotColors.secondary[500],
                  boxShadow: `0 4px 16px ${medibotColors.secondary[500]}40`,
                  '&:hover': {
                    bgcolor: medibotColors.secondary[600],
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Staff credentials required for access
                </Typography>
              </Box>
            </form>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
