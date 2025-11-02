/**
 * Home Page
 * ==========
 * Dashboard matching mobile app's Welcome/Home screen design
 * Features: Quick actions, health stats, personalized greeting
 */

import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  LocalHospital as DoctorIcon,
  Event as AppointmentIcon,
  Person as ProfileIcon,
  Notifications as NotificationsIcon,
  FavoriteBorder as HeartIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { medibotColors } from '../theme/medibot-theme';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('🏠 HomePage loaded for user:', user?.email, 'role:', user?.role);

  const quickActions = [
    {
      title: 'AI Health Chat',
      description: 'Get instant medical advice from our AI assistant',
      icon: <ChatIcon sx={{ fontSize: 40, color: 'white' }} />,
      action: () => {
        console.log('🔵 Navigation: /home → /chat');
        navigate('/chat');
      },
      gradient: `linear-gradient(135deg, ${medibotColors.primary[500]} 0%, ${medibotColors.primary[600]} 100%)`,
      bgColor: medibotColors.primary[50],
    },
    {
      title: 'Find Doctors',
      description: 'Book appointments with verified specialists',
      icon: <DoctorIcon sx={{ fontSize: 40, color: 'white' }} />,
      action: () => {
        console.log('🔵 Navigation: /home → /doctors');
        navigate('/doctors');
      },
      gradient: `linear-gradient(135deg, ${medibotColors.secondary[500]} 0%, ${medibotColors.secondary[600]} 100%)`,
      bgColor: medibotColors.secondary[50],
    },
    {
      title: 'My Appointments',
      description: 'View and manage your scheduled visits',
      icon: <AppointmentIcon sx={{ fontSize: 40, color: 'white' }} />,
      action: () => {
        console.log('🔵 Navigation: /home → /appointments');
        navigate('/appointments');
      },
      gradient: `linear-gradient(135deg, ${medibotColors.warning[500]} 0%, ${medibotColors.warning[600]} 100%)`,
      bgColor: medibotColors.warning[50],
    },
    {
      title: 'My Profile',
      description: 'Update personal and medical information',
      icon: <ProfileIcon sx={{ fontSize: 40, color: 'white' }} />,
      action: () => {
        console.log('🔵 Navigation: /home → /profile');
        navigate('/profile');
      },
      gradient: `linear-gradient(135deg, ${medibotColors.primary[400]} 0%, ${medibotColors.primary[500]} 100%)`,
      bgColor: medibotColors.primary[50],
    },
  ];

  const healthStats = [
    { 
      label: 'Health Score', 
      value: '85', 
      unit: '/100',
      IconComponent: HeartIcon,
      bgColor: medibotColors.secondary[100],
      color: medibotColors.secondary[500],
      trend: '↑ 5% this week',
    },
    { 
      label: 'Consultations', 
      value: '0', 
      unit: 'this month',
      IconComponent: ChatIcon,
      bgColor: medibotColors.primary[100],
      color: medibotColors.primary[500],
      trend: 'No change',
    },
    { 
      label: 'Upcoming', 
      value: '0', 
      unit: 'appointments',
      IconComponent: ClockIcon,
      bgColor: medibotColors.warning[100],
      color: medibotColors.warning[500],
      trend: 'No upcoming',
    },
  ];

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: 'calc(100vh - 64px)', pb: 4 }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        {/* Welcome Header */}
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            mb: 4, 
            background: `linear-gradient(135deg, ${medibotColors.primary[500]} 0%, ${medibotColors.primary[700]} 100%)`,
            color: 'white',
            borderRadius: 4,
            boxShadow: `0 8px 32px ${medibotColors.primary[500]}40`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 0 } }}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'white', 
                  color: medibotColors.primary[500],
                  fontSize: '1.5rem',
                  fontWeight: 600,
                }}
              >
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Welcome back, {user?.firstName || 'User'}!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Ready to take care of your health today?
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}>
                <NotificationsIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Health Stats */}
              {/* Health Stats */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        {healthStats.map((stat, index) => (
          <Box key={index} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                borderRadius: 3,
                border: `1px solid ${medibotColors.neutral[200]}`,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 32px ${medibotColors.primary[500]}20`,
                  borderColor: medibotColors.primary[300],
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.bgColor, mr: 2 }}>
                    <stat.IconComponent sx={{ color: stat.color }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={stat.trend}
                  size="small"
                  color={stat.trend.includes('↑') ? 'success' : 'info'}
                />
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {quickActions.map((action, index) => (
            <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <Card
                elevation={1}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  borderRadius: 3,
                  border: `1px solid ${medibotColors.neutral[200]}`,
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 12px 32px ${medibotColors.primary[500]}25`,
                    borderColor: medibotColors.primary[300],
                  },
                }}
                onClick={action.action}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box 
                    sx={{ 
                      width: 72,
                      height: 72,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      background: action.gradient,
                      mx: 'auto',
                      mb: 2,
                      boxShadow: `0 4px 16px ${medibotColors.primary[500]}30`,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: medibotColors.neutral[800] }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 2,
                      },
                    }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Recent Activity */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Recent Activity
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: medibotColors.neutral[50],
            border: `1px solid ${medibotColors.neutral[200]}`,
            borderRadius: 3,
          }}
        >
            <Box sx={{ 
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: medibotColors.primary[50],
              mb: 2,
            }}>
              <CheckIcon sx={{ fontSize: 32, color: medibotColors.primary[500] }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              No recent activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start by chatting with our AI assistant or booking an appointment with a doctor
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<ChatIcon />}
                onClick={() => navigate('/chat')}
                sx={{ borderRadius: 2 }}
              >
                Start Chat
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DoctorIcon />}
                onClick={() => navigate('/doctors')}
                sx={{ borderRadius: 2 }}
              >
                Find Doctors
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
