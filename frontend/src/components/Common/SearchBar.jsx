import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ placeholder = 'Search...', onSearch }) => {
    const [value, setValue] = React.useState('');

    const debouncedSearch = React.useMemo(
        () => debounce((searchValue) => {
            onSearch(searchValue);
        }, 300),
        [onSearch]
    );

    const handleChange = (e) => {
        const val = e.target.value;
        setValue(val);
        debouncedSearch(val);
    };

    return (
        <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                className="search-input"
            />
        </div>
    );
};

export default SearchBar;
