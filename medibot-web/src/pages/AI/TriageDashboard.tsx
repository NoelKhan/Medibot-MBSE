/**
 * Triage Dashboard
 * =================
 * Case management interface for medical staff
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility, Refresh, FilterList } from '@mui/icons-material';
import aiAgentService, { TriageCase } from '../../services/AIAgentService';

const TriageDashboard: React.FC = () => {
  const [cases, setCases] = useState<TriageCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<TriageCase | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCases();
  }, [statusFilter, severityFilter]);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = severityFilter;
      
      const data = await aiAgentService.getTriageCases(filters);
      setCases(data);
    } catch (err: any) {
      console.error('Failed to load triage cases:', err);
      setError(err.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (caseId: string) => {
    try {
      const caseData = await aiAgentService.getTriageCase(caseId);
      setSelectedCase(caseData);
      setDetailsOpen(true);
    } catch (err) {
      console.error('Failed to load case details:', err);
      alert('Failed to load case details');
    }
  };

  const handleUpdateStatus = async (caseId: string, newStatus: string) => {
    try {
      await aiAgentService.updateCaseStatus(caseId, newStatus);
      loadCases(); // Reload cases
      setDetailsOpen(false);
    } catch (err) {
      console.error('Failed to update case status:', err);
      alert('Failed to update status');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'RED':
        return 'error';
      case 'AMBER':
        return 'warning';
      case 'GREEN':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'resolved':
        return 'success';
      case 'escalated':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredCases = cases.filter((c) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(query) ||
        c.userId.toLowerCase().includes(query) ||
        c.summary?.patient_summary?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Triage Case Management</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadCases}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterList />
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="RED">RED</MenuItem>
                <MenuItem value="AMBER">AMBER</MenuItem>
                <MenuItem value="GREEN">GREEN</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
              </Select>
            </FormControl>
            {(statusFilter || severityFilter || searchQuery) && (
              <Button
                size="small"
                onClick={() => {
                  setStatusFilter('');
                  setSeverityFilter('');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Cases Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredCases.length === 0 ? (
        <Alert severity="info">No cases found</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Case ID</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Chief Complaint</TableCell>
                <TableCell>Action Required</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {c.id.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.triage.severity_level}
                      color={getSeverityColor(c.triage.severity_level) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      color={getStatusColor(c.status) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {c.symptoms?.chief_complaint || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {c.triage.recommended_action}
                  </TableCell>
                  <TableCell>
                    {new Date(c.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(c.id)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Case Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCase && (
          <>
            <DialogTitle>
              Case Details - {selectedCase.id}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Severity
                </Typography>
                <Chip
                  label={selectedCase.triage.severity_level}
                  color={getSeverityColor(selectedCase.triage.severity_level) as any}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Patient Summary
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {selectedCase.summary.patient_summary}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Clinician Summary
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {selectedCase.summary.clinician_summary}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Rationale
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedCase.triage.rationale}
                </Typography>
              </Box>

              {selectedCase.triage.red_flags_triggered?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error">
                    Red Flags
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {selectedCase.triage.red_flags_triggered.map((flag, idx) => (
                      <Chip
                        key={idx}
                        label={flag}
                        color="error"
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Care Instructions
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {selectedCase.triage.care_instructions.map((instruction, idx) => (
                    <Typography key={idx} variant="body2">
                      • {instruction}
                    </Typography>
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Update Status
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleUpdateStatus(selectedCase.id, 'active')}
                  >
                    Mark Active
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="success"
                    onClick={() => handleUpdateStatus(selectedCase.id, 'resolved')}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleUpdateStatus(selectedCase.id, 'escalated')}
                  >
                    Escalate
                  </Button>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TriageDashboard;
