/**
 * Welcome Page with Role Selection
 * =================================
 * Initial landing page matching mobile app's RoleSelectionScreen
 * Users choose: Patient, Medical Staff, or Emergency Staff
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  LocalHospital as EmergencyIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { medibotColors } from '../theme/medibot-theme';

interface RoleOption {
  id: 'patient' | 'staff' | 'emergency';
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  route: string;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  console.log('WelcomePage rendered');

  const roleOptions: RoleOption[] = [
    {
      id: 'patient',
      title: 'Patient',
      description: 'Healthcare services & AI assistant',
      icon: <PersonIcon sx={{ fontSize: 32 }} />,
      gradient: `linear-gradient(135deg, ${medibotColors.primary[500]} 0%, ${medibotColors.primary[700]} 100%)`,
      route: '/login',
    },
    {
      id: 'staff',
      title: 'Medical Staff',
      description: 'Professional portal for healthcare providers',
      icon: <MedicalIcon sx={{ fontSize: 32 }} />,
      gradient: `linear-gradient(135deg, ${medibotColors.secondary[500]} 0%, ${medibotColors.secondary[700]} 100%)`,
      route: '/login',
    },
    {
      id: 'emergency',
      title: 'Emergency Staff',
      description: 'Emergency response & rapid triage',
      icon: <EmergencyIcon sx={{ fontSize: 32 }} />,
      gradient: `linear-gradient(135deg, ${medibotColors.error[500]} 0%, ${medibotColors.error[700]} 100%)`,
      route: '/login',
    },
  ];

  const handleRoleSelection = async (role: RoleOption) => {
    setSelectedRole(role.id);
    setLoading(true);

    // Save role preference to localStorage
    localStorage.setItem('userRolePreference', role.id);

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to login with role context
    navigate(role.route, { state: { role: role.id } });
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: darkMode 
          ? medibotColors.neutral[900]
          : medibotColors.neutral[50],
        position: 'relative',
      }}
    >
      {/* Theme Toggle */}
      <IconButton
        onClick={() => setDarkMode(!darkMode)}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          bgcolor: 'white',
          boxShadow: 2,
          '&:hover': {
            bgcolor: medibotColors.neutral[100],
          },
        }}
      >
        {darkMode ? (
          <LightModeIcon sx={{ color: medibotColors.warning[500] }} />
        ) : (
          <DarkModeIcon sx={{ color: medibotColors.primary[600] }} />
        )}
      </IconButton>

      <Container maxWidth="md" sx={{ pt: 8, pb: 6 }}>
        {/* Demo Credentials Banner */}
        <Card
          sx={{
            mb: 4,
            background: `linear-gradient(135deg, ${medibotColors.warning[50]} 0%, ${medibotColors.warning[100]} 100%)`,
            border: `2px solid ${medibotColors.warning[400]}`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <InfoIcon sx={{ color: medibotColors.warning[600], fontSize: 32, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: medibotColors.warning[800], mb: 1 }}>
                  🧪 Demo Test Accounts
                </Typography>
                <Typography variant="body2" sx={{ color: medibotColors.warning[900], mb: 2, fontWeight: 500 }}>
                  Use these credentials to test the application:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: 2,
                  bgcolor: 'white',
                  p: 2,
                  borderRadius: 2,
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: medibotColors.neutral[600], fontWeight: 600, display: 'block', mb: 0.5 }}>
                      👤 PATIENT
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: medibotColors.primary[700] }}>
                      Email: patient@demo.com
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: medibotColors.primary[700] }}>
                      Password: patient123
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: medibotColors.neutral[600], fontWeight: 600, display: 'block', mb: 0.5 }}>
                      🏥 MEDICAL STAFF
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: medibotColors.secondary[700] }}>
                      Email: doctor@demo.com
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: medibotColors.secondary[700] }}>
                      Password: doctor123
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${medibotColors.primary[500]} 0%, ${medibotColors.primary[700]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
              boxShadow: `0 8px 32px ${medibotColors.primary[500]}40`,
            }}
          >
            <MedicalIcon sx={{ fontSize: 56, color: 'white' }} />
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${medibotColors.primary[600]} 0%, ${medibotColors.secondary[600]} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            MediBot
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: medibotColors.neutral[600], fontWeight: 500 }}
          >
            Choose Your Role
          </Typography>
        </Box>

        {/* Role Selection Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
          {roleOptions.map((role) => (
            <Card
              key={role.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: role.gradient,
                color: 'white',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 16px 48px ${medibotColors.primary[500]}50`,
                },
                '&:active': {
                  transform: 'translateY(-4px) scale(1.01)',
                },
                opacity: loading && selectedRole !== role.id ? 0.5 : 1,
              }}
              onClick={() => !loading && handleRoleSelection(role)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {role.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {role.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {role.description}
                      </Typography>
                    </Box>
                  </Box>
                  {loading && selectedRole === role.id ? (
                    <CircularProgress size={28} sx={{ color: 'white' }} />
                  ) : (
                    <ChevronRightIcon sx={{ fontSize: 32 }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Info Note */}
        <Card
          sx={{
            bgcolor: medibotColors.primary[50],
            border: `1px solid ${medibotColors.primary[200]}`,
            borderRadius: 2,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <InfoIcon sx={{ color: medibotColors.primary[600], mt: 0.5 }} />
              <Typography variant="body2" sx={{ color: medibotColors.neutral[700] }}>
                Select your role to access the appropriate portal and features. You can
                change your role anytime from the settings.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            bgcolor: medibotColors.warning[50],
            border: `1px solid ${medibotColors.warning[200]}`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: medibotColors.warning[800],
              fontWeight: 500,
              mb: 1,
            }}
          >
            ⚠️ Medical Disclaimer
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: medibotColors.neutral[600], display: 'block' }}
          >
            MediBot provides health information for educational purposes only. Always
            consult with a qualified healthcare professional for medical advice,
            diagnosis, or treatment.
          </Typography>
        </Box>

        {/* Demo Access Button */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="text"
            sx={{
              color: medibotColors.primary[600],
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: medibotColors.primary[50],
              },
            }}
            onClick={() => navigate('/login', { state: { isDemo: true } })}
          >
            Continue as Demo User →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
