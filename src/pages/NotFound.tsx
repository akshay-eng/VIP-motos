import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[70dvh] place-items-center pt-24 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="display mt-3 text-4xl">That car has left the showroom.</h1>
        <p className="mt-3 text-muted">The page or listing you were after isn't here any more. It may have been sold.</p>
        <Link to="/cars" className="btn-accent mt-8">
          See what's in stock
        </Link>
      </div>
    </div>
  );
}
