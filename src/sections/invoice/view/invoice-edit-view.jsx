import { useTranslation } from 'react-i18next';

import { InvoiceNewEditForm } from '../invoice-new-edit-form';

// ----------------------------------------------------------------------

export function InvoiceEditView({ invoice }) {
  const { t } = useTranslation();
  return <InvoiceNewEditForm currentInvoice={invoice} />;
}
