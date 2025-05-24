import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';
import Image from 'next/image';
import viewService from '../../services/viewService';
import Alert from './Alert';
import NoData from '../NoData';

/**
 * Component to display popular products based on view analytics
 */
const PopularProducts = ({ limit = 6, timeframe = 7, title = 'Popular Products' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        setLoading(true);
        const result = await viewService.getPopularProducts({
          limit,
          days: timeframe
        });
        setProducts(result.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch popular products:", err);
        setError("Unable to load popular products");
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, [limit, timeframe]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="warning" message={error} />;
  }

  if (!products || products.length === 0) {
    return (
      <NoData
        title="No popular products yet"
        message="We don't have enough data to show popular products at this time."
        suggestion="Check back soon as more users discover products!"
        icon={<TrendingUpIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {products.map((product, index) => (
          <Grid item xs={12} sm={6} md={4} key={`${product.productId || product._id}-${index}`}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: '0 0 80px', mr: 2 }}>
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          width={80}
                          height={80}
                          style={{ objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            No image
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Link href={`/product/${product.slug}`} passHref>
                        <Typography
                          variant="h6"
                          component="a"
                          sx={{
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                            display: 'block',
                            mb: 1
                          }}
                        >
                          {product.name}
                        </Typography>
                      </Link>

                      <Stack direction="row" spacing={1}>
                        <Chip
                          size="small"
                          icon={<VisibilityIcon fontSize="small" />}
                          label={`${typeof product.views === 'object' ? product.views.count || 0 : product.views || 0} views`}
                          variant="outlined"
                        />

                        <Chip
                          size="small"
                          icon={<PersonIcon fontSize="small" />}
                          label={`${typeof product.views === 'object' ? product.views.unique || 0 : product.uniqueViews || 0} unique`}
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Box>

                  {product.avgDuration && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
                      Average view time: {Math.round(product.avgDuration)} seconds
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PopularProducts;