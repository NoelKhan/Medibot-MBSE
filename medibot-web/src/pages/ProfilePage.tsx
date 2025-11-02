/**
 * Profile Page
 * ============
 * User profile management
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  console.log('👤 ProfilePage loaded');
  
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: '',
      });
    }
  }, [user]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement profile update API call
      // await apiClient.auth.updateProfile(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: '',
      });
    }
    setEditing(false);
    setError('');
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal information
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Profile Card */}
      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Avatar Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={user.profileImage}
            sx={{ width: 120, height: 120, mb: 2, fontSize: 48 }}
          >
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </Avatar>
          <Typography variant="h5">
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Profile Information */}
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              disabled={!editing || loading}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              disabled={!editing || loading}
              fullWidth
            />
          </Box>

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            disabled={true}
            fullWidth
            helperText="Email cannot be changed"
          />

          <TextField
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange('phoneNumber')}
            disabled={!editing || loading}
            fullWidth
          />

          <TextField
            label="Date of Birth"
            type="date"
            value=""
            disabled={true}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Date of birth not set"
          />

          <TextField
            label="Member Since"
            value="N/A"
            disabled={true}
            fullWidth
          />
        </Stack>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          {!editing ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
              fullWidth
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
                fullWidth
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* Account Settings */}
      <Paper elevation={2} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Settings
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <Button variant="outlined" fullWidth>
            Change Password
          </Button>
          <Button variant="outlined" color="warning" fullWidth>
            Privacy Settings
          </Button>
          <Button variant="outlined" color="error" fullWidth>
            Delete Account
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
