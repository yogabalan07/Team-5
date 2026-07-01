import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

const SearchBar = ({ onSearch, placeholder = 'Search...', initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);

  const handleSearch = () => {
    onSearch(value);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyPress={handleKeyPress}
      variant="outlined"
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {value && (
              <IconButton size="small" onClick={handleClear}>
                <Clear />
              </IconButton>
            )}
          </InputAdornment>
        ),
        sx: { borderRadius: 2 },
      }}
    />
  );
};

export default SearchBar;