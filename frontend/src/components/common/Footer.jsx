import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body2" color="textSecondary">
          © {new Date().getFullYear()} Inventory Pro.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="#" variant="body2" color="textSecondary">
            
          </Link>
          <Link href="#" variant="body2" color="textSecondary">
            
          </Link>
          <Link href="#" variant="body2" color="textSecondary">
            
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;