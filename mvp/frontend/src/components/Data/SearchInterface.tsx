import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';

import dataIntegrationService, { Database, SearchResult, SearchResultItem } from '../../services/dataIntegrationService';

interface SearchInterfaceProps {
  databases: Database[];
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ databases }) => {
  const [query, setQuery] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [scoreThreshold, setScoreThreshold] = useState(0.7);
  const [limit, setLimit] = useState(10);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);

  // Search mutation
  const searchMutation = useMutation(
    ({ query, databaseId, limit, scoreThreshold }: {
      query: string;
      databaseId?: string;
      limit: number;
      scoreThreshold: number;
    }) => dataIntegrationService.searchData(query, databaseId, limit, scoreThreshold),
    {
      onSuccess: (data) => {
        setSearchResults(data);
        toast.success(`Found ${data.results.length} results in ${data.execution_time_ms}ms`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Search failed');
      },
    }
  );

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    searchMutation.mutate({
      query: query.trim(),
      databaseId: selectedDatabase || undefined,
      limit,
      scoreThreshold,
    });
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'default';
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Semantic Search
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Search through your uploaded data using natural language queries. 
            The AI will find relevant content based on meaning, not just keywords.
          </Typography>

          {/* Search Form */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Search Query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'customer complaints about billing', 'product features', 'contact information'"
              margin="normal"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Database (Optional)</InputLabel>
                <Select
                  value={selectedDatabase}
                  onChange={(e) => setSelectedDatabase(e.target.value)}
                  label="Database (Optional)"
                >
                  <MenuItem value="">All Databases</MenuItem>
                  {databases.map((db) => (
                    <MenuItem key={db.id} value={db.id}>
                      {db.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="number"
                label="Max Results"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                sx={{ width: 120 }}
                inputProps={{ min: 1, max: 50 }}
              />
            </Box>

            {/* Advanced Settings */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2">Advanced Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ px: 2 }}>
                  <Typography gutterBottom>
                    Similarity Threshold: {formatScore(scoreThreshold)}
                  </Typography>
                  <Slider
                    value={scoreThreshold}
                    onChange={(_, value) => setScoreThreshold(value as number)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    marks={[
                      { value: 0.1, label: '10%' },
                      { value: 0.5, label: '50%' },
                      { value: 0.7, label: '70%' },
                      { value: 0.9, label: '90%' },
                    ]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Higher values return more relevant but fewer results
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={searchMutation.isLoading || !query.trim()}
              sx={{ mt: 2 }}
            >
              {searchMutation.isLoading ? 'Searching...' : 'Search'}
            </Button>
          </Box>

          {/* Loading */}
          {searchMutation.isLoading && <LinearProgress />}

          {/* Search Results */}
          {searchResults && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Search Results ({searchResults.results.length})
                </Typography>
                <Chip
                  label={`${searchResults.execution_time_ms}ms`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {searchResults.results.length === 0 ? (
                <Alert severity="info">
                  No results found. Try adjusting your query or lowering the similarity threshold.
                </Alert>
              ) : (
                <List>
                  {searchResults.results.map((result: SearchResultItem, index: number) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip
                                label={formatScore(result.score)}
                                color={getScoreColor(result.score) as any}
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary">
                                Source: {result.metadata?.source_type || 'Unknown'}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 1,
                                }}
                              >
                                {result.content}
                              </Typography>
                              {result.metadata && (
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {result.metadata.record_index !== undefined && (
                                    <Chip
                                      label={`Record #${result.metadata.record_index + 1}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {result.metadata.chunk_index !== undefined && (
                                    <Chip
                                      label={`Chunk #${result.metadata.chunk_index + 1}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleCopyContent(result.content)}
                            title="Copy Content"
                          >
                            <CopyIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < searchResults.results.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Help Text */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Search Tips:</strong>
              <br />
              • Use natural language: "customer complaints about billing"
              <br />
              • Be specific: "product features for wireless headphones"
              <br />
              • Ask questions: "what are the most common support issues?"
              <br />
              • Search works across all uploaded file content
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SearchInterface;
