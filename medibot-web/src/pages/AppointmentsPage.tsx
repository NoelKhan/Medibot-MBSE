/**
 * Appointments Page
 * =================
 * View and manage appointments
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Avatar,
} from '@mui/material';
import {
  Event as EventIcon,
  VideoCall as VideoIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { AppointmentsApiService } from '../lib/shared';
import type { Appointment } from '../lib/shared';
import { httpClientAdapter } from '../services/httpClientAdapter';

const appointmentsService = new AppointmentsApiService(httpClientAdapter);

export default function AppointmentsPage() {
  console.log('📅 AppointmentsPage loaded');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadAppointments();
  }, [tabValue]);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');

    try {
      let data: Appointment[];
      if (tabValue === 0) {
        // Upcoming
        data = await appointmentsService.getUpcomingAppointments();
      } else {
        // Past
        data = await appointmentsService.getPastAppointments();
      }
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentsService.cancelAppointment(appointmentId);
      loadAppointments();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'phone':
        return <PhoneIcon />;
      default:
        return <LocationIcon />;
    }
  };

  const getStatusColor = (status: string): "default" | "success" | "warning" | "error" | "primary" | "secondary" | "info" => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your appointments
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="Upcoming" />
          <Tab label="Past" />
        </Tabs>
      </Paper>

      {/* Appointments List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No {tabValue === 0 ? 'upcoming' : 'past'} appointments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tabValue === 0
              ? 'You don\'t have any scheduled appointments'
              : 'You don\'t have any appointment history'}
          </Typography>
          {tabValue === 0 && (
            <Button variant="contained" href="/doctors">
              Book an Appointment
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {appointments.map((appointment) => (
            <Card key={appointment.id} elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={appointment.doctor?.profileImageUrl || undefined}
                      sx={{ width: 56, height: 56 }}
                    >
                      {appointment.doctor?.fullName.charAt(0) || 'D'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {appointment.doctor?.fullName || 'Doctor'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.doctor?.specialty || 'General Practice'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label={appointment.status} color={getStatusColor(appointment.status)} />
                </Box>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="action" />
                    <Typography variant="body2">
                      {new Date(appointment.scheduledAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTypeIcon(appointment.type)}
                    <Typography variant="body2">
                      {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {appointment.duration} min
                    </Typography>
                  </Box>
                </Box>

                {appointment.reason && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Reason:</strong> {appointment.reason}
                    </Typography>
                  </Box>
                )}

                {appointment.notes && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Notes:</strong> {appointment.notes}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              {appointment.status === 'scheduled' || appointment.status === 'confirmed' ? (
                <CardActions>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancelAppointment(appointment.id)}
                  >
                    Cancel Appointment
                  </Button>
                  <Button variant="outlined">
                    Reschedule
                  </Button>
                </CardActions>
              ) : null}
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
