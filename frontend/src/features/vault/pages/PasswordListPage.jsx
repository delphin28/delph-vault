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
  EditOutlined,
  LanguageOutlined,
  RefreshOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { getCategories } from '../../../api/categoryApi';
import { createPassword, deletePassword, getPasswords, revealPassword, updatePassword } from '../../../api/vaultApi';

const emptyForm = { name: '', url: '', password: '', category_id: '' };
const passwordCharacters = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}:,.?',
};

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

function generateSecurePassword(length, options) {
  const selectedSets = Object.entries(options)
    .filter(([, enabled]) => enabled)
    .map(([key]) => passwordCharacters[key]);
  const characterPool = selectedSets.join('');

  if (!characterPool) return '';

  const requiredCharacters = selectedSets.map((characterSet) => {
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    return characterSet[randomValue[0] % characterSet.length];
  });
  const generatedCharacters = [...requiredCharacters];
  const randomValues = new Uint32Array(Math.max(0, length - generatedCharacters.length));
  window.crypto.getRandomValues(randomValues);

  randomValues.forEach((randomValue) => {
    generatedCharacters.push(characterPool[randomValue % characterPool.length]);
  });

  for (let index = generatedCharacters.length - 1; index > 0; index -= 1) {
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    const swapIndex = randomValue[0] % (index + 1);
    [generatedCharacters[index], generatedCharacters[swapIndex]] = [generatedCharacters[swapIndex], generatedCharacters[index]];
  }

  return generatedCharacters.join('');
}

function PasswordListPage() {
  const [passwords, setPasswords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [revealedId, setRevealedId] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [revealingId, setRevealingId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [generatorLength, setGeneratorLength] = useState(20);
  const [generatorOptions, setGeneratorOptions] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
  });
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

    const timeout = window.setTimeout(() => {
      setRevealedId(null);
      setRevealedPasswords((current) => {
        const next = { ...current };
        delete next[revealedId];
        return next;
      });
    }, 10000);
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

  function generatePassword() {
    const generatedPassword = generateSecurePassword(generatorLength, generatorOptions);
    setForm((current) => ({ ...current, password: generatedPassword }));
  }

  function toggleGeneratorOption(option) {
    setGeneratorOptions((current) => {
      const enabledOptions = Object.values(current).filter(Boolean).length;
      if (current[option] && enabledOptions === 1) return current;
      return { ...current, [option]: !current[option] };
    });
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' });
    setError('');
    setIsDialogOpen(true);
  }

  function openEditDialog(entry) {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      url: entry.url || '',
      password: '',
      category_id: entry.category_id,
    });
    setError('');
    setIsDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) return;
    setIsDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleReveal(id) {
    if (revealedId === id) {
      setRevealedId(null);
      setRevealedPasswords((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }

    setRevealingId(id);
    setError('');
    try {
      const secret = await revealPassword(id);
      setRevealedPasswords((current) => ({ ...current, [id]: secret }));
      setRevealedId(id);
    } catch {
      setError('Unable to reveal this password.');
    } finally {
      setRevealingId(null);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const entry = {
        name: form.name,
        url: form.url || null,
        category_id: Number(form.category_id),
      };
      if (form.password) entry.password = form.password;

      if (editingId === null) {
        const created = await createPassword({ ...entry, password: form.password });
        setPasswords((current) => [...current, created]);
      } else {
        const updated = await updatePassword(editingId, entry);
        setPasswords((current) => current.map((item) => item.id === editingId ? updated : item));
      }

      setForm(emptyForm);
      setEditingId(null);
      setIsDialogOpen(false);
    } catch {
      setError(editingId === null ? 'Unable to save this vault entry.' : 'Unable to update this vault entry.');
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
        <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreateDialog} disabled={!categories.length}>
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
                    {isRevealed ? revealedPasswords[entry.id] : '••••••••••••'}
                  </Typography>
                  <Typography className="vault-entry__category" variant="caption">{category?.name || 'Uncategorized'}</Typography>
                  {entry.url && <Tooltip title="Open saved URL"><IconButton component="a" href={entry.url} target="_blank" rel="noreferrer" aria-label={`Open ${entry.name}`}><LanguageOutlined /></IconButton></Tooltip>}
                  <Tooltip title={isRevealed ? 'Hide password' : 'Reveal for 10 seconds'}>
                    <IconButton onClick={() => handleReveal(entry.id)} disabled={revealingId === entry.id} aria-label={isRevealed ? 'Hide password' : 'Reveal password'}>{isRevealed ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton>
                  </Tooltip>
                  <Tooltip title="Edit entry"><IconButton onClick={() => openEditDialog(entry)} aria-label={`Edit ${entry.name}`}><EditOutlined /></IconButton></Tooltip>
                  <Tooltip title="Delete entry"><IconButton color="error" onClick={() => handleDelete(entry.id)} aria-label={`Delete ${entry.name}`}><DeleteOutlineOutlined /></IconButton></Tooltip>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog open={isDialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{editingId === null ? 'Add vault entry' : 'Edit vault entry'}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField required name="name" label="Service name" value={form.name} onChange={updateForm} inputProps={{ maxLength: 15 }} />
            <TextField name="url" label="URL" value={form.url} onChange={updateForm} inputProps={{ maxLength: 100 }} />
            <Box className="vault-generator">
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                <Typography className="vault-generator__title">Password</Typography>
                <Button type="button" size="small" variant="outlined" startIcon={<RefreshOutlined />} onClick={generatePassword}>
                  Generate
                </Button>
              </Stack>
              <TextField required={editingId === null} fullWidth name="password" label={editingId === null ? 'Enter manually or generate' : 'New password (optional)'} type="password" value={form.password} onChange={updateForm} helperText={editingId === null ? undefined : 'Leave blank to keep the current password.'} />
              <Stack className="vault-generator__controls" direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField label="Length" type="number" value={generatorLength} onChange={(event) => setGeneratorLength(Math.min(64, Math.max(8, Number(event.target.value) || 8)))} inputProps={{ min: 8, max: 64 }} size="small" />
                <Stack className="vault-generator__options" direction="row" flexWrap="wrap" alignItems="center">
                  {Object.keys(generatorOptions).map((option) => (
                    <Button key={option} type="button" size="small" variant={generatorOptions[option] ? 'contained' : 'outlined'} onClick={() => toggleGeneratorOption(option)}>
                      {option === 'lowercase' ? 'a-z' : option === 'uppercase' ? 'A-Z' : option === 'numbers' ? '0-9' : 'Symbols'}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Box>
            <FormControl required>
              <InputLabel id="entry-category-label">Category</InputLabel>
              <Select labelId="entry-category-label" name="category_id" label="Category" value={form.category_id} onChange={updateForm}>
                {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions><Button onClick={closeDialog} disabled={isSaving}>Cancel</Button><Button type="submit" variant="contained" disabled={isSaving}>{isSaving ? 'Saving...' : editingId === null ? 'Save entry' : 'Update entry'}</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default PasswordListPage;
