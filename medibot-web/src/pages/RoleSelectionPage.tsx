/**
 * Role Selection Page
 * ===================
 * First screen where users choose their role: Patient, Medical Staff, or Emergency Staff
 * Each role leads to a separate login page with role-specific access
 */

import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, CardContent, CardActionArea } from '@mui/material';
import {
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Emergency as EmergencyIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { medibotColors } from '../theme/medibot-theme';

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}

function RoleCard({ icon, title, description, color, onClick }: RoleCardProps) {
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: 'white',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 24px ${color}60`,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="700" gutterBottom>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                {description}
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 32, opacity: 0.8 }} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  
  console.log('✅ Role Selection Page Loaded');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: medibotColors.neutral[50],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
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
              mb: 3,
              boxShadow: `0 8px 24px ${medibotColors.primary[500]}40`,
            }}
          >
            <MedicalIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h3" fontWeight="800" gutterBottom color={medibotColors.primary[700]}>
            MediBot
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="500">
            Choose Your Role
          </Typography>
        </Box>

        {/* Role Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <RoleCard
            icon={<PersonIcon sx={{ fontSize: 32, color: 'white' }} />}
            title="Patient"
            description="Healthcare services & AI assistant"
            color={medibotColors.primary[500]}
            onClick={() => navigate('/login/patient')}
          />

          <RoleCard
            icon={<MedicalIcon sx={{ fontSize: 32, color: 'white' }} />}
            title="Medical Staff"
            description="Professional portal for healthcare providers"
            color={medibotColors.secondary[500]}
            onClick={() => navigate('/login/staff')}
          />

          <RoleCard
            icon={<EmergencyIcon sx={{ fontSize: 32, color: 'white' }} />}
            title="Emergency Staff"
            description="Emergency department access & triage"
            color={medibotColors.error[500]}
            onClick={() => navigate('/login/emergency')}
          />
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Secure, role-based authentication
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
