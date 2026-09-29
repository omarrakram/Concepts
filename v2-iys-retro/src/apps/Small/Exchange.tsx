import { ODOO_EXCHANGE_REFUND_FORM_URL } from '../../config/integrations';
import { concept } from '../../data/copy';
import type { Win } from '../../state/os';
import { OdooForm } from './OdooForm';

/** XCHANGE.EXE :) — Exchanges / Refunds Odoo form (ODOO_EXCHANGE_REFUND_FORM_URL). */
export default function Exchange({ win }: { win: Win }) {
  return <OdooForm win={win} icon="exchange" url={ODOO_EXCHANGE_REFUND_FORM_URL} copy={concept.exchange} />;
}
