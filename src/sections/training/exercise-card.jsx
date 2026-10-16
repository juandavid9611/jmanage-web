import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';

import { SequenceBoard } from './sequence-board';

// ----------------------------------------------------------------------

export function ExerciseCard({
  exercise,
  index,
  readOnly = false,
  defaultExpanded = true,
  onChange,
  onRemove,
  onDuplicate,
  onBoardMount,
}) {
  const { t } = useTranslation();
  const expanded = useBoolean(defaultExpanded);

  const handleField = (field) => (evt) => onChange({ ...exercise, [field]: evt.target.value });

  return (
    <Card sx={{ p: 2, borderRadius: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: expanded.value ? 2 : 0 }}>
        <Avatar
          sx={{
            width: 30,
            height: 30,
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
            bgcolor: readOnly ? 'text.disabled' : 'primary.main',
          }}
        >
          {index + 1}
        </Avatar>

        {!readOnly ? (
          <TextField
            size="small"
            placeholder={t('label_exercise_name')}
            value={exercise.name || ''}
            onChange={handleField('name')}
            sx={{ flexGrow: 1 }}
          />
        ) : (
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {exercise.name}
          </Typography>
        )}

        <TextField
          size="small"
          type="number"
          disabled={readOnly}
          label={t('label_duration_minutes')}
          value={exercise.durationMinutes || ''}
          onChange={handleField('durationMinutes')}
          sx={{
            width: 150,
            '& .MuiOutlinedInput-root': { borderRadius: 999 },
          }}
          inputProps={{ min: 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:clock-circle-bold" width={16} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title={t(expanded.value ? 'label_collapse_exercise' : 'label_expand_exercise')}>
          <IconButton onClick={expanded.onToggle}>
            <Iconify icon={expanded.value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
          </IconButton>
        </Tooltip>

        {!readOnly && onDuplicate && (
          <Tooltip title={t('label_duplicate_exercise')}>
            <IconButton onClick={onDuplicate}>
              <Iconify icon="mdi:content-duplicate" />
            </IconButton>
          </Tooltip>
        )}

        {!readOnly && (
          <Tooltip title={t('label_delete_exercise')}>
            <IconButton color="error" onClick={onRemove}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Collapse in={expanded.value}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            rows={2}
            disabled={readOnly}
            label={t('label_instructions')}
            value={exercise.instructions || ''}
            onChange={handleField('instructions')}
          />

          <SequenceBoard
            ref={onBoardMount ? (api) => onBoardMount(exercise.id, api) : undefined}
            value={exercise.diagram}
            readOnly={readOnly}
            fileName={exercise.name || t('label_exercise')}
            onChange={(diagram) => onChange({ ...exercise, diagram })}
          />
        </Stack>
      </Collapse>
    </Card>
  );
}
