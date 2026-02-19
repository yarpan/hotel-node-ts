import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/');
  };

  const initials = user
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase()
    : '';

  // ── Mobile drawer content ──────────────────────────────────
  const drawerContent = (
    <Box sx={{ width: 260, pt: 2 }}>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: 'primary.main' }}>
          Grand Hotel
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItemButton component={RouterLink} to="/" onClick={() => setMobileOpen(false)}>
          <ListItemText primary="Home" />
        </ListItemButton>
        {!user ? (
          <>
            <ListItemButton component={RouterLink} to="/login" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Login" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/register" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Register" />
            </ListItemButton>
          </>
        ) : (
          <>
            <ListItemButton component={RouterLink} to="/dashboard" onClick={() => setMobileOpen(false)}>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
            {user.role === 'admin' && (
              <ListItemButton component={RouterLink} to="/admin" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="Admin Panel" />
              </ListItemButton>
            )}
            <ListItemButton onClick={() => { setMobileOpen(false); handleLogout(); }}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <HotelIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: 'primary.main',
              textDecoration: 'none',
              flexGrow: 1,
              letterSpacing: '0.02em',
            }}
          >
            Grand Hotel
          </Typography>

          {/* Desktop nav links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button color="inherit" component={RouterLink} to="/">
                Home
              </Button>

              {!user ? (
                <>
                  <Button color="inherit" component={RouterLink} to="/login">
                    Login
                  </Button>
                  <Button variant="contained" component={RouterLink} to="/register">
                    Register
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/dashboard"
                    startIcon={<DashboardIcon />}
                  >
                    Dashboard
                  </Button>

                  {user.role === 'admin' && (
                    <Button
                      color="inherit"
                      component={RouterLink}
                      to="/admin"
                      startIcon={<AdminIcon />}
                    >
                      Admin
                    </Button>
                  )}

                  {/* User avatar & menu */}
                  <IconButton onClick={handleMenu} sx={{ ml: 1 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    slotProps={{
                      paper: {
                        sx: { mt: 1, minWidth: 180 },
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="subtitle2">
                        {user.profile.firstName} {user.profile.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>
                      <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                      My Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
