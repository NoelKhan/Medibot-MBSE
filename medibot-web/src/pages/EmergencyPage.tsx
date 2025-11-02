/**
 * EMERGENCY PAGE
 * Quick access to emergency services
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Phone as PhoneIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { createLogger } from '../services/Logger';

const logger = createLogger('EmergencyPage');

const EmergencyPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState('');
  const [description, setDescription] = useState('');

  const handleEmergencyCall = (type: string) => {
    setEmergencyType(type);
    setDialogOpen(true);
    logger.info('Emergency initiated:', type);
  };

  const handleSubmit = () => {
    // In real app, would call emergency service
    logger.info('Emergency submitted:', { emergencyType, description });
    setDialogOpen(false);
    setDescription('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Emergency Services
      </Typography>

      <Alert severity="error" sx={{ mb: 3 }}>
        <strong>For life-threatening emergencies, call 911 immediately!</strong>
      </Alert>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <PhoneIcon color="error" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Emergency Hotline</Typography>
                <Typography variant="body2" color="text.secondary">
                  Available 24/7 for urgent medical advice
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => handleEmergencyCall('hotline')}
            >
              Call Emergency Hotline
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <HospitalIcon color="error" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Request Ambulance</Typography>
                <Typography variant="body2" color="text.secondary">
                  Emergency medical transport
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => handleEmergencyCall('ambulance')}
            >
              Request Ambulance
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <WarningIcon color="warning" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Report Emergency</Typography>
                <Typography variant="body2" color="text.secondary">
                  Report non-life-threatening emergencies
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => handleEmergencyCall('report')}
            >
              Report Emergency
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Emergency: {emergencyType}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Describe the emergency"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSubmit}>
            Submit Emergency
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyPage;
