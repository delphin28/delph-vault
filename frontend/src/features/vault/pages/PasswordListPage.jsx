import { useEffect, useMemo, useState } from 'react';
import './PasswordListPage.css';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddOutlined,
  DeleteOutlineOutlined,
  LanguageOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { getCategories } from '../../../api/categoryApi';
import { createPassword, deletePassword, getPasswords } from '../../../api/vaultApi';

const emptyForm = { name: '', url: '', password: '', category_id: '' };

function ServiceLogo({ name, url }) {
  const [hasError, setHasError] = useState(false);
  let faviconUrl = '';

  try {
    if (url) faviconUrl = `${new URL(url).origin}/favicon.ico`;
  } catch {
    faviconUrl = '';
  }

  if (!faviconUrl || hasError) {
    return <span className="vault-entry__logo vault-entry__logo--fallback" aria-label={`${name} logo`}>{name.charAt(0).toUpperCase()}</span>;
  }

  return (
    <span className="vault-entry__logo" aria-label={`${name} logo`}>
      <img src={faviconUrl} alt="" onError={() => setHasError(true)} />
    </span>
  );
}

function PasswordListPage() {
  const [passwords, setPasswords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [revealedId, setRevealedId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([getPasswords(), getCategories()])
      .then(([passwordEntries, categoryEntries]) => {
        if (active) {
          setPasswords(passwordEntries);
          setCategories(categoryEntries);
        }
      })
      .catch(() => {
        if (active) setError('Unable to load your vault right now.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (revealedId === null) return undefined;

    const timeout = window.setTimeout(() => setRevealedId(null), 10000);
    return () => window.clearTimeout(timeout);
  }, [revealedId]);

  const filteredPasswords = useMemo(() => passwords.filter((entry) => {
    const matchesSearch = `${entry.name} ${entry.url || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || String(entry.category_id) === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [passwords, search, categoryFilter]);

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const created = await createPassword({
        ...form,
        category_id: Number(form.category_id),
      });
      setPasswords((current) => [...current, created]);
      setForm(emptyForm);
      setIsDialogOpen(false);
    } catch {
      setError('Unable to save this vault entry.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this vault entry?')) return;

    try {
      await deletePassword(id);
      setPasswords((current) => current.filter((entry) => entry.id !== id));
    } catch {
      setError('Unable to delete this vault entry.');
    }
  }

  return (
    <Box className="vault-page">
      <Stack className="vault-page__header" direction={{ xs: 'column', sm: 'row' }}>
        <Box>
          <Typography className="vault-page__eyebrow">Private credentials</Typography>
          <Typography className="vault-page__title" component="h1">Your vault</Typography>
          <Typography className="vault-page__description">Keep your accounts organized and close at hand.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setIsDialogOpen(true)} disabled={!categories.length}>
          Add password
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Stack className="vault-page__toolbar" direction={{ xs: 'column', md: 'row' }}>
        <TextField className="vault-page__search" fullWidth label="Search vault" value={search} onChange={(event) => setSearch(event.target.value)} />
        <FormControl sx={{ minWidth: { md: 220 } }}>
          <InputLabel id="category-filter-label">Category</InputLabel>
          <Select labelId="category-filter-label" label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <MenuItem value="all">All categories</MenuItem>
            {categories.map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}><CircularProgress /></Box>
      ) : !filteredPasswords.length ? (
        <Card className="vault-page__empty" variant="outlined"><CardContent><Typography color="text.secondary">No vault entries match your search.</Typography></CardContent></Card>
      ) : (
        <Stack className="vault-page__entries">
          {filteredPasswords.map((entry) => {
            const category = categories.find((item) => item.id === entry.category_id);
            const isRevealed = revealedId === entry.id;
            return (
              <Card className="vault-entry" key={entry.id} variant="outlined">
                <CardContent className="vault-entry__content">
                  <ServiceLogo name={entry.name} url={entry.url} />
                  <Box className="vault-entry__identity">
                    <Typography className="vault-entry__name" variant="h6">{entry.name}</Typography>
                    <Typography className="vault-entry__url" variant="body2">{entry.url || 'No URL saved'}</Typography>
                  </Box>
                  <Typography className="vault-entry__secret" component="span" onContextMenu={(event) => event.preventDefault()}>
                    {isRevealed ? entry.password : '••••••••••••'}
                  </Typography>
                  <Typography className="vault-entry__category" variant="caption">{category?.name || 'Uncategorized'}</Typography>
                  {entry.url && <Tooltip title="Open saved URL"><IconButton component="a" href={entry.url} target="_blank" rel="noreferrer" aria-label={`Open ${entry.name}`}><LanguageOutlined /></IconButton></Tooltip>}
                  <Tooltip title={isRevealed ? 'Hide password' : 'Reveal for 10 seconds'}>
                    <IconButton onClick={() => setRevealedId(isRevealed ? null : entry.id)} aria-label={isRevealed ? 'Hide password' : 'Reveal password'}>{isRevealed ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton>
                  </Tooltip>
                  <Tooltip title="Delete entry"><IconButton color="error" onClick={() => handleDelete(entry.id)} aria-label={`Delete ${entry.name}`}><DeleteOutlineOutlined /></IconButton></Tooltip>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog open={isDialogOpen} onClose={() => !isSaving && setIsDialogOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle>Add vault entry</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField required name="name" label="Service name" value={form.name} onChange={updateForm} inputProps={{ maxLength: 15 }} />
            <TextField name="url" label="URL" value={form.url} onChange={updateForm} inputProps={{ maxLength: 100 }} />
            <TextField required name="password" label="Password" type="password" value={form.password} onChange={updateForm} />
            <FormControl required>
              <InputLabel id="entry-category-label">Category</InputLabel>
              <Select labelId="entry-category-label" name="category_id" label="Category" value={form.category_id} onChange={updateForm}>
                {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions><Button onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button><Button type="submit" variant="contained" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save entry'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default PasswordListPage;
