import { Link } from 'react-router';
import { Icon } from '../components/ui';

export function NotFound() {
  return (
    <section className="nf wrap" data-testid="not-found">
      <div className="label-sm muted">404</div>
      <h1 className="display nf__t">
        Lost <span className="italic">at sea.</span>
      </h1>
      <p className="serif">This page drifted out past the horizon.</p>
      <Link to="/" className="btn">
        Back to shore <Icon.arrow />
      </Link>
    </section>
  );
}
