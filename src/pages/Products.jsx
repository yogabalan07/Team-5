// Products page placeholder for future product catalog management.
import Header from '../components/layout/Header.jsx';
import Card from '../components/ui/Card.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';

function Products() {
  return (
    <>
      <Header title="Products" />
      <SearchBar placeholder="Search products" />
      <Card title="Product List">Product records will be displayed here.</Card>
    </>
  );
}

export default Products;
