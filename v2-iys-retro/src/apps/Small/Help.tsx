import { ODOO_HELP_FORM_URL } from '../../config/integrations';
import { concept } from '../../data/copy';
import type { Win } from '../../state/os';
import { OdooForm } from './OdooForm';

/** HELP › IYS Help & Support — Odoo help form (ODOO_HELP_FORM_URL). */
export default function Help({ win }: { win: Win }) {
  return <OdooForm win={win} icon="help" url={ODOO_HELP_FORM_URL} copy={concept.help} />;
}
