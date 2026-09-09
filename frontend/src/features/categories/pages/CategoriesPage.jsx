import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { AddOutlined, CategoryOutlined } from '@mui/icons-material';
import { createCategory, getCategories } from '../../../api/categoryApi';
import './CategoriesPage.css';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getCategories()
      .then((items) => {
        if (active) setCategories(items);
      })
      .catch(() => {
        if (active) setError('Unable to load your categories right now.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    setError('');

    try {
      const category = await createCategory(trimmedName);
      setCategories((current) => [...current, category]);
      setName('');
      setIsDialogOpen(false);
    } catch {
      setError('Unable to create this category.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box className="categories-page">
      <header className="categories-page__header">
        <Box>
          <p className="categories-page__eyebrow">Vault organization</p>
          <Typography className="categories-page__title" component="h1">Categories</Typography>
          <p className="categories-page__description">Organize your credentials around the way you work.</p>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setIsDialogOpen(true)}>
          Add category
        </Button>
      </header>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'grid', minHeight: 220, placeItems: 'center' }}><CircularProgress /></Box>
      ) : categories.length ? (
        <div className="categories-page__grid">
          {categories.map((category) => (
            <Card className="category-card" key={category.id} variant="outlined">
              <Box sx={{ p: 2.5 }}>
                <div className="category-card__icon"><CategoryOutlined /></div>
                <Typography className="category-card__name" component="h2">{category.name}</Typography>
                <div className="category-card__meta">Vault category</div>
              </Box>
            </Card>
          ))}
        </div>
      ) : (
        <div className="categories-page__empty">No categories yet. Create one before adding a vault entry.</div>
      )}

      <Dialog open={isDialogOpen} onClose={() => !isSaving && setIsDialogOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle>Add category</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label="Category name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              inputProps={{ maxLength: 50 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create category'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default CategoriesPage;
