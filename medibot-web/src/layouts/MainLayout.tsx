/**
 * Main Layout
 * ===========
 * Application shell with navigation, header, and content area
 */

import React from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  LocalHospital as DoctorIcon,
  EventNote as AppointmentIcon,
  Person as ProfileIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  FolderOpen as CasesIcon,
  Description as RecordsIcon,
  SmartToy as AIIcon,
  Assessment as InsightsIcon,
  MonitorHeart as MonitorIcon,
  Home as HomeIcon,
  EmergencyShare as EmergencyIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Role-based menu items
  const getMenuItems = () => {
    if (!user) return [];

    // Patient menu items
    if (user.role === 'patient') {
      return [
        { text: 'Home', icon: <HomeIcon />, path: '/home' },
        { text: 'AI Health Chat', icon: <ChatIcon />, path: '/chat' },
        { text: 'Find Doctors', icon: <DoctorIcon />, path: '/doctors' },
        { text: 'Appointments', icon: <AppointmentIcon />, path: '/appointments' },
      ];
    }

    // Medical Staff menu items (doctors and nurses)
    if (user.role === 'doctor' || user.role === 'nurse') {
      return [
        { text: 'Case Management', icon: <CasesIcon />, path: '/cases' },
        { text: 'Patient Records', icon: <RecordsIcon />, path: '/records' },
      ];
    }

    // Emergency Staff menu items
    if (user.role === 'emergency') {
      return [
        { text: 'Emergency Dashboard', icon: <EmergencyIcon />, path: '/emergency' },
      ];
    }

    return [];
  };

  const getAIMenuItems = () => {
    if (!user) return [];

    // AI features only for staff (not patients)
    if (user.role === 'doctor' || user.role === 'nurse' || user.role === 'emergency') {
      return [
        { text: 'AI Insights', icon: <InsightsIcon />, path: '/ai/insights' },
        { text: 'Triage Cases', icon: <AIIcon />, path: '/ai/cases' },
        { text: 'Live Monitor', icon: <MonitorIcon />, path: '/ai/monitor' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();
  const aiMenuItems = getAIMenuItems();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleProfileMenuClose();
    navigate('/'); // Go back to role selection
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Toolbar>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          MediBot
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                handleNavigation(item.path, item.text);
                isMobile && setDrawerOpen(false);
              }}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* AI Agent Section - Only show for staff */}
      {aiMenuItems.length > 0 && (
        <>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
              AI AGENT
            </Typography>
          </Box>
          <List>
            {aiMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => {
                    handleNavigation(item.path, item.text);
                    isMobile && setDrawerOpen(false);
                  }}
                  selected={location.pathname === item.path}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Profile Section */}
      <List sx={{ mt: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              handleNavigation('/profile', 'Profile');
              isMobile && setDrawerOpen(false);
            }}
            selected={location.pathname === '/profile'}
          >
            <ListItemIcon><ProfileIcon /></ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const handleNavigation = (path: string, label: string) => {
    console.log(`🔵 Menu Click: "${label}" → ${path}`);
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#fff',
          color: '#000',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: theme.palette.primary.main,
              fontWeight: 'bold',
            }}
          >
            MediBot Healthcare
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsIcon />
          </IconButton>

          <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer for mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Permanent drawer for desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 250,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 250,
              boxSizing: 'border-box',
              top: 64,
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: isMobile ? 0 : '250px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
