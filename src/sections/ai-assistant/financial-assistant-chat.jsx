import Anthropic from '@anthropic-ai/sdk';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { uuidv4 } from 'src/utils/uuidv4';

import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  FINANCIAL_TOOLS,
  getStoredApiKey,
  setStoredApiKey,
  AIApiKeyMissingError,
  executeFinancialTool,
  callFinancialAssistant,
} from 'src/actions/financial-assistant';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const MAX_TOOL_ITERATIONS = 5;

const SUGGESTIONS = [
  'label_ai_suggestion_pending_total',
  'label_ai_suggestion_by_category',
  'label_ai_suggestion_player_debt',
];

function ChatBubble({ message }) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <Alert severity="warning" sx={{ alignSelf: 'stretch' }}>
        {message.text}
      </Alert>
    );
  }

  return (
    <Stack alignItems={isUser ? 'flex-end' : 'flex-start'} spacing={0.5} sx={{ width: 1 }}>
      {!!message.toolCalls?.length && (
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
          {message.toolCalls.map((call, index) => (
            <Chip
              key={index}
              size="small"
              variant="soft"
              icon={<Iconify icon="solar:magic-stick-3-bold-duotone" width={16} />}
              label={t('label_ai_tool_call', { tool: call.name })}
            />
          ))}
        </Stack>
      )}
      {message.text && (
        <Box
          sx={{
            px: 2,
            py: 1.25,
            maxWidth: 0.8,
            borderRadius: 1.5,
            typography: 'body2',
            whiteSpace: 'pre-wrap',
            bgcolor: (theme) => (isUser ? theme.palette.primary.main : theme.palette.background.neutral),
            color: (theme) => (isUser ? theme.palette.primary.contrastText : theme.palette.text.primary),
          }}
        >
          {message.text}
        </Box>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function ApiKeyDialog({ open, onClose, hasKey, onSaved, onCleared }) {
  const { t } = useTranslation();
  const [keyInput, setKeyInput] = useState('');

  const handleSave = useCallback(() => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setStoredApiKey(trimmed);
    setKeyInput('');
    onSaved();
  }, [keyInput, onSaved]);

  const handleClear = useCallback(() => {
    setStoredApiKey(null);
    setKeyInput('');
    onCleared();
  }, [onCleared]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('label_ai_configure_key')}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          {t('label_ai_key_warning')}
        </Alert>
        <TextField
          fullWidth
          type="password"
          label={t('label_ai_api_key')}
          placeholder="sk-ant-..."
          value={keyInput}
          onChange={(evt) => setKeyInput(evt.target.value)}
          helperText={hasKey ? t('label_ai_key_already_set_hint') : undefined}
        />
      </DialogContent>
      <DialogActions>
        {hasKey && (
          <Button color="error" onClick={handleClear}>
            {t('label_ai_clear_key')}
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button color="inherit" onClick={onClose}>
          {t('label_close')}
        </Button>
        <Button variant="contained" disabled={!keyInput.trim()} onClick={handleSave}>
          {t('save_changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export function FinancialAssistantChat() {
  const { t } = useTranslation();
  const { selectedWorkspace } = useWorkspace();
  const apiMessagesRef = useRef([]);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasKey, setHasKey] = useState(() => !!getStoredApiKey());
  const settingsDialog = useBoolean();

  const stepConversation = useCallback(
    async (convo, iteration) => {
      if (iteration >= MAX_TOOL_ITERATIONS) {
        setDisplayMessages((prev) => [
          ...prev,
          { id: uuidv4(), role: 'system', text: t('label_ai_max_iterations') },
        ]);
        return;
      }

      const response = await callFinancialAssistant(convo, FINANCIAL_TOOLS);
      const nextConvo = [...convo, { role: 'assistant', content: response.content }];
      apiMessagesRef.current = nextConvo;

      const toolUses = response.content.filter((block) => block.type === 'tool_use');

      if (response.stop_reason === 'tool_use' && toolUses.length) {
        setDisplayMessages((prev) => [
          ...prev,
          { id: uuidv4(), role: 'assistant', toolCalls: toolUses.map((c) => ({ name: c.name })) },
        ]);

        const toolResults = await Promise.all(
          toolUses.map(async (block) => {
            try {
              const result = await executeFinancialTool(block.name, block.input, selectedWorkspace?.id);
              return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) };
            } catch (error) {
              return {
                type: 'tool_result',
                tool_use_id: block.id,
                content: String(error?.message || error),
                is_error: true,
              };
            }
          })
        );

        const convoWithResults = [...nextConvo, { role: 'user', content: toolResults }];
        apiMessagesRef.current = convoWithResults;
        await stepConversation(convoWithResults, iteration + 1);
        return;
      }

      const textBlock = response.content.find((block) => block.type === 'text');
      setDisplayMessages((prev) => [...prev, { id: uuidv4(), role: 'assistant', text: textBlock?.text || '' }]);
    },
    [selectedWorkspace?.id, t]
  );

  const runConversation = useCallback(
    async (userText) => {
      setDisplayMessages((prev) => [...prev, { id: uuidv4(), role: 'user', text: userText }]);
      const convo = [...apiMessagesRef.current, { role: 'user', content: userText }];
      apiMessagesRef.current = convo;
      setSending(true);

      try {
        await stepConversation(convo, 0);
      } catch (error) {
        if (error instanceof AIApiKeyMissingError) {
          setDisplayMessages((prev) => [
            ...prev,
            { id: uuidv4(), role: 'system', text: t('label_ai_key_missing_hint') },
          ]);
          settingsDialog.onTrue();
        } else if (error instanceof Anthropic.AuthenticationError) {
          setDisplayMessages((prev) => [
            ...prev,
            { id: uuidv4(), role: 'system', text: t('label_ai_key_invalid') },
          ]);
          settingsDialog.onTrue();
        } else if (error instanceof Anthropic.RateLimitError) {
          setDisplayMessages((prev) => [
            ...prev,
            { id: uuidv4(), role: 'system', text: t('label_ai_rate_limited') },
          ]);
        } else if (error instanceof Anthropic.APIError) {
          console.error(error);
          setDisplayMessages((prev) => [
            ...prev,
            { id: uuidv4(), role: 'system', text: `${t('label_ai_assistant_error')}: ${error.message}` },
          ]);
        } else {
          console.error(error);
          toast.error(t('label_ai_assistant_error'));
        }
      } finally {
        setSending(false);
      }
    },
    [stepConversation, t, settingsDialog]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    runConversation(text);
  }, [input, sending, runConversation]);

  const handleKeyDown = useCallback(
    (evt) => {
      if (evt.key === 'Enter' && !evt.shiftKey) {
        evt.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <>
      <Card sx={{ display: 'flex', flexDirection: 'column', height: 640 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 1.5, borderBottom: (theme) => `solid 1px ${theme.palette.divider}` }}
        >
          <Typography variant="subtitle1">{t('label_ai_assistant')}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Label color={hasKey ? 'success' : 'default'} variant="soft">
              {hasKey ? t('label_ai_key_configured') : t('label_ai_key_missing')}
            </Label>
            <IconButton size="small" onClick={settingsDialog.onTrue}>
              <Iconify icon="mdi:cog-outline" />
            </IconButton>
          </Stack>
        </Stack>

        <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
          <Stack spacing={2}>
            {!displayMessages.length && (
              <Stack spacing={1.5} sx={{ py: 4, alignItems: 'center', textAlign: 'center' }}>
                <Iconify icon="solar:magic-stick-3-bold-duotone" width={40} sx={{ color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420 }}>
                  {t('label_ai_assistant_empty_hint')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={1}>
                  {SUGGESTIONS.map((key) => (
                    <Chip
                      key={key}
                      label={t(key)}
                      variant="outlined"
                      onClick={() => runConversation(t(key))}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Stack>
            )}

            {displayMessages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}

            {sending && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                <CircularProgress size={16} />
                <Typography variant="caption">{t('label_ai_thinking')}</Typography>
              </Stack>
            )}
          </Stack>
        </Scrollbar>

        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-end"
          sx={{ p: 2, borderTop: (theme) => `solid 1px ${theme.palette.divider}` }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder={t('label_ai_assistant_placeholder')}
            value={input}
            onChange={(evt) => setInput(evt.target.value)}
            onKeyDown={handleKeyDown}
          />
          <IconButton color="primary" disabled={sending || !input.trim()} onClick={handleSend}>
            <Iconify icon="iconamoon:send-fill" />
          </IconButton>
        </Stack>
      </Card>

      <ApiKeyDialog
        open={settingsDialog.value}
        onClose={settingsDialog.onFalse}
        hasKey={hasKey}
        onSaved={() => {
          setHasKey(true);
          toast.success(t('label_ai_key_saved'));
          settingsDialog.onFalse();
        }}
        onCleared={() => {
          setHasKey(false);
          toast.success(t('label_ai_key_cleared'));
        }}
      />
    </>
  );
}
