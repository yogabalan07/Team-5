import React from 'react';
import { Box, Pagination as MuiPagination, Typography } from '@mui/material';

const Pagination = ({
  count,
  page,
  onPageChange,
  rowsPerPage,
  totalItems,
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography variant="body2" color="textSecondary">
        Showing {(page - 1) * rowsPerPage + 1} to{' '}
        {Math.min(page * rowsPerPage, count)} of {count} items
      </Typography>
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={(e, value) => onPageChange(value)}
        color="primary"
        shape="rounded"
        showFirstButton
        showLastButton
      />
    </Box>
  );
};

export default Pagination;