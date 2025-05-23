import { fetchCategoryBySlug } from '../Services/categoryService';

/**
 * Generate breadcrumbs for product navigation
 * @param {Object} product - The product object
 * @returns {Array} - Array of breadcrumb items with label and url
 */
export const generateProductBreadcrumbs = async (product) => {
  if (!product) return [];
  
  const breadcrumbs = [
    { label: 'Home', url: '/' },
    { label: 'Products', url: '/products' }
  ];
  
  try {
    // If product has a category
    if (product.category) {
      // Fetch the category to get full details
      const category = await fetchCategoryBySlug(
        typeof product.category === 'object' ? product.category.slug : product.categoryName
      );
      
      if (category) {
        // Add parent category
        breadcrumbs.push({
          label: category.name,
          url: `/products/category/${category.slug}`
        });
        
        // If this is a subcategory, handle the parent-child relationship
        if (product.categoryType === 'Subcategory' && product.parentCategory) {
          const parentCategory = await fetchCategoryBySlug(product.parentCategory);
          
          // Insert parent category before subcategory
          if (parentCategory) {
            breadcrumbs.splice(2, 0, {
              label: parentCategory.name,
              url: `/products/category/${parentCategory.slug}`
            });
          }
        }
      }
    }
    
    // Add the product itself as the final breadcrumb
    breadcrumbs.push({
      label: product.name,
      url: `/products/${product.slug}`
    });
    
    return breadcrumbs;
  } catch (error) {
    console.error('Error generating breadcrumbs:', error);
    return breadcrumbs;
  }
};
