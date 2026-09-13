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
import { AddOutlined, CategoryOutlined, EditOutlined } from '@mui/icons-material';
import { createCategory, getCategories, updateCategory } from '../../../api/categoryApi';
import './CategoriesPage.css';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  function openCreateDialog() {
    setEditingId(null);
    setName('');
    setError('');
    setIsDialogOpen(true);
  }

  function openEditDialog(category) {
    setEditingId(category.id);
    setName(category.name);
    setError('');
    setIsDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) return;
    setIsDialogOpen(false);
    setEditingId(null);
    setName('');
  }

  async function handleSave(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    setError('');

    try {
      if (editingId === null) {
        const category = await createCategory(trimmedName);
        setCategories((current) => [...current, category]);
      } else {
        const category = await updateCategory(editingId, trimmedName);
        setCategories((current) => current.map((item) => item.id === editingId ? category : item));
      }
      setName('');
      setEditingId(null);
      setIsDialogOpen(false);
    } catch {
      setError(editingId === null ? 'Unable to create this category.' : 'Unable to update this category.');
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
        <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog}>
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
                <Button size="small" startIcon={<EditOutlined />} onClick={() => openEditDialog(category)}>Edit</Button>
              </Box>
            </Card>
          ))}
        </div>
      ) : (
        <div className="categories-page__empty">No categories yet. Create one before adding a vault entry.</div>
      )}

      <Dialog open={isDialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{editingId === null ? 'Add category' : 'Edit category'}</DialogTitle>
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
            <Button onClick={closeDialog} disabled={isSaving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>{isSaving ? 'Saving...' : editingId === null ? 'Create category' : 'Update category'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default CategoriesPage;
