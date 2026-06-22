// Reusable search input component for list and table pages.
function SearchBar({ placeholder = 'Search...', value = '', onChange }) {
  return (
    <input
      className="search-bar"
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

export default SearchBar;
