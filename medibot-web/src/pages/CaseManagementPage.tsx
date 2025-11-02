/**
 * CASE MANAGEMENT PAGE
 * Simple case list and management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { MedicalCase } from '../types/Medical';
import { MedicalCaseService } from '../services/MedicalCaseService';
import { createLogger } from '../services/Logger';

const logger = createLogger('CaseManagementPage');
const caseService = MedicalCaseService.getInstance();

const CaseManagementPage: React.FC = () => {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);
      await caseService.initialize();
      const userId = localStorage.getItem('userId') || 'guest';
      const userCases = await caseService.getUserCases(userId);
      setCases(userCases);
      logger.info('Loaded cases:', userCases.length);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load cases';
      setError(errorMsg);
      logger.error('Failed to load cases', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: number): "success" | "warning" | "error" => {
    if (severity >= 8) return 'error';
    if (severity >= 5) return 'warning';
    return 'success';
  };

  const getStatusColor = (status: string): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'escalated': return 'error';
      case 'follow_up': return 'warning';
      default: return 'default';
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = !searchTerm || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Case Management</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadCases}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            New Case
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
                <MenuItem value="follow_up">Follow-up</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {filteredCases.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No cases found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredCases.map((medicalCase) => (
            <Card key={medicalCase.id} sx={{ '&:hover': { boxShadow: 4 }, cursor: 'pointer' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {medicalCase.title}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {medicalCase.symptoms.slice(0, 3).map((symptom, idx) => (
                        <Chip key={idx} label={symptom} size="small" variant="outlined" />
                      ))}
                      {medicalCase.symptoms.length > 3 && (
                        <Chip label={`+${medicalCase.symptoms.length - 3} more`} size="small" />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`Severity: ${medicalCase.severity}`}
                      color={getSeverityColor(medicalCase.severity)}
                      size="small"
                    />
                    <Chip
                      label={medicalCase.status.toUpperCase()}
                      color={getStatusColor(medicalCase.status)}
                      size="small"
                    />
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Created: {new Date(medicalCase.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default CaseManagementPage;
