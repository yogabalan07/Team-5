import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 1.5,
        px: 3,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Enterprise Business Management System (EBMS). All rights reserved.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Certified ISO-27001 Security Compliance & Multi-Tier Role Governance
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;