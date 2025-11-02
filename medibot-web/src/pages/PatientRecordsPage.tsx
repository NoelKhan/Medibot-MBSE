/**
 * PATIENT RECORDS PAGE
 * 
 * View and manage patient medical records including:
 * - Medical history
 * - Medications
 * - Allergies
 * - Lab results
 * - Documents
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { createLogger } from '../services/Logger';

const logger = createLogger('PatientRecordsPage');

interface MedicalRecord {
  id: string;
  type: 'medication' | 'allergy' | 'lab-result' | 'document';
  title: string;
  description: string;
  date: Date;
  status?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
};

const PatientRecordsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const records: MedicalRecord[] = [
    {
      id: '1',
      type: 'medication',
      title: 'Amoxicillin 500mg',
      description: 'Take 3 times daily for 7 days',
      date: new Date('2025-10-20'),
      status: 'Active',
    },
    {
      id: '2',
      type: 'allergy',
      title: 'Penicillin',
      description: 'Severe allergic reaction - hives',
      date: new Date('2020-05-15'),
    },
    {
      id: '3',
      type: 'lab-result',
      title: 'Blood Test - Complete Blood Count',
      description: 'All values within normal range',
      date: new Date('2025-10-15'),
      status: 'Completed',
    },
  ];

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      // In real app, load from API
      // const data = await recordsService.getRecords();
      // setRecords(data);
      logger.info('Loaded records:', records.length);
    } catch (error) {
      logger.error('Failed to load records', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    loadRecords();
  };

  const getRecordIcon = () => {
    return <DocumentIcon />;
  };

  const currentRecords = tabValue === 0 ? records :
    tabValue === 1 ? records.filter(r => r.type === 'medication') :
    tabValue === 2 ? records.filter(r => r.type === 'allergy') :
    records.filter(r => r.type === 'lab-result');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Medical Records
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Record
          </Button>
        </Stack>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Your medical records are encrypted and securely stored. Only you and authorized healthcare providers can access them.
      </Alert>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Records" />
          <Tab label="Medications" />
          <Tab label="Allergies" />
          <Tab label="Lab Results" />
        </Tabs>
      </Box>

      {/* Records List */}
      <TabPanel value={tabValue} index={tabValue}>
        {currentRecords.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No records found
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Paper>
            <List>
              {currentRecords.map((record, index) => (
                <React.Fragment key={record.id}>
                  <ListItem
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        {record.status && (
                          <Chip label={record.status} size="small" color="primary" />
                        )}
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                        >
                          Download
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getRecordIcon()}
                          <Typography variant="subtitle1">
                            {record.title}
                          </Typography>
                          <Chip
                            label={record.type.replace('-', ' ').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary">
                            {record.description}
                          </Typography>
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {new Date(record.date).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < currentRecords.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </TabPanel>

      {/* Summary Cards */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Card sx={{ flex: "1 1 200px" }}>
            <CardContent>
              <Typography variant="h4" color="primary">
                {records.filter(r => r.type === 'medication').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Medications
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: "1 1 200px" }}>
            <CardContent>
              <Typography variant="h4" color="error">
                {records.filter(r => r.type === 'allergy').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Known Allergies
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: "1 1 200px" }}>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {records.filter(r => r.type === 'lab-result').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lab Results
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
};

export default PatientRecordsPage;
