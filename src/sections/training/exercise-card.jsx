import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';

import { TacticalBoard } from './tactical-board';

// ----------------------------------------------------------------------

export function ExerciseCard({ exercise, index, readOnly = false, onChange, onRemove }) {
  const { t } = useTranslation();
  const expanded = useBoolean(true);

  const handleField = (field) => (evt) => onChange({ ...exercise, [field]: evt.target.value });

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: expanded.value ? 2 : 0 }}>
        <Typography variant="subtitle1" sx={{ flexShrink: 0 }}>
          {`${t('label_exercise')} ${index + 1}`}
        </Typography>

        {!readOnly ? (
          <TextField
            size="small"
            placeholder={t('label_exercise_name')}
            value={exercise.name || ''}
            onChange={handleField('name')}
            sx={{ flexGrow: 1 }}
          />
        ) : (
          <Typography variant="body2" sx={{ flexGrow: 1, color: 'text.secondary' }}>
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
          sx={{ width: 140 }}
          inputProps={{ min: 0 }}
        />

        <IconButton onClick={expanded.onToggle}>
          <Iconify icon={expanded.value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
        </IconButton>

        {!readOnly && (
          <IconButton color="error" onClick={onRemove}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
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

          <TacticalBoard
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
