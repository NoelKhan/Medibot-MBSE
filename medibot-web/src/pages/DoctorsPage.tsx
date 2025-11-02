/**
 * Doctors Page
 * ============
 * Browse and search for doctors
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
} from '@mui/material';
import { Search as SearchIcon, LocalHospital as HospitalIcon } from '@mui/icons-material';
import { DoctorsApiService } from '../lib/shared';
import type { DoctorProfile, DoctorSpecialty } from '../lib/shared';
import { httpClientAdapter } from '../services/httpClientAdapter';

const doctorsService = new DoctorsApiService(httpClientAdapter);

export default function DoctorsPage() {
  console.log('👨‍⚕️ DoctorsPage loaded');
  
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [specialties, setSpecialties] = useState<DoctorSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchName, setSearchName] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    loadSpecialties();
    loadDoctors();
  }, []);

  const loadSpecialties = async () => {
    try {
      const data = await doctorsService.getSpecialties();
      setSpecialties(data);
    } catch (err: any) {
      console.error('Failed to load specialties:', err);
    }
  };

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await doctorsService.searchDoctors({
        name: searchName || undefined,
        specialty: selectedSpecialty || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        limit: 20,
      });
      setDoctors(response.doctors);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadDoctors();
  };

  const handleReset = () => {
    setSearchName('');
    setSelectedSpecialty('');
    setMinRating(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Find a Doctor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search for specialists and book appointments
        </Typography>
      </Box>

      {/* Search Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            label="Doctor Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            sx={{ flex: '1 1 200px' }}
          />

          <FormControl sx={{ flex: '1 1 200px' }}>
            <InputLabel>Specialty</InputLabel>
            <Select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              label="Specialty"
            >
              <MenuItem value="">All Specialties</MenuItem>
              {specialties.map((spec) => (
                <MenuItem key={spec.id} value={spec.name}>
                  {spec.name} ({spec.doctorCount})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: '1 1 150px' }}>
            <InputLabel>Min Rating</InputLabel>
            <Select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              label="Min Rating"
            >
              <MenuItem value={0}>Any Rating</MenuItem>
              <MenuItem value={3}>3+ Stars</MenuItem>
              <MenuItem value={4}>4+ Stars</MenuItem>
              <MenuItem value={4.5}>4.5+ Stars</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Doctors List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : doctors.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <HospitalIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No doctors found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search filters
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {doctors.map((doctor) => (
            <Card
              key={doctor.id}
              elevation={2}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' },
                minWidth: 280,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={doctor.profileImageUrl || undefined}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  >
                    {doctor.fullName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {doctor.fullName}
                    </Typography>
                    <Chip label={doctor.specialty} size="small" color="primary" />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={doctor.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({doctor.totalReviews} reviews)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {doctor.yearsOfExperience} years experience
                  </Typography>
                </Box>

                {doctor.bio && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {doctor.bio.length > 100 ? `${doctor.bio.substring(0, 100)}...` : doctor.bio}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ${doctor.consultationFee}
                  </Typography>
                  <Chip
                    label={doctor.status}
                    size="small"
                    color={doctor.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
              </CardContent>

              <CardActions>
                <Button variant="contained" fullWidth disabled={doctor.status !== 'active'}>
                  Book Appointment
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
