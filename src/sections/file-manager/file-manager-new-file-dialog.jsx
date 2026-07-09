import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { uploadFiles } from 'src/actions/fileManager';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function FileManagerNewFileDialog({ open, onClose, title, ...other }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const dialogTitle = title ?? t('label_upload_files');

  useEffect(() => {
    if (!open) {
      setFiles([]);
    }
  }, [open]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      setFiles([...files, ...acceptedFiles]);
    },
    [files]
  );

  const handleUpload = async () => {
    if (!files.length) {
      toast.warning(t('label_select_at_least_one_file'));
      return;
    }

    setUploading(true);
    try {
      await uploadFiles(files);

      toast.success(`${files.length} ${t('label_files_uploaded_suffix')}`);
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Subida fallida:', error);
      toast.error(t('label_error_uploading_files'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (inputFile) => {
    const filtered = files.filter((file) => file !== inputFile);
    setFiles(filtered);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} {...other}>
      <DialogTitle sx={{ p: (theme) => theme.spacing(3, 3, 2, 3) }}> {dialogTitle} </DialogTitle>

      <DialogContent dividers sx={{ pt: 1, pb: 0, border: 'none' }}>
        <Upload multiple value={files} onDrop={handleDrop} onRemove={handleRemoveFile} />
      </DialogContent>

      <DialogActions>
        <LoadingButton
          variant="contained"
          startIcon={<Iconify icon="eva:cloud-upload-fill" />}
          onClick={handleUpload}
          loading={uploading}
          disabled={!files.length}
        >
          {t('label_upload_files')}
        </LoadingButton>

        {!!files.length && (
          <Button variant="outlined" color="inherit" onClick={handleRemoveAllFiles}>
            {t('label_remove_all')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
