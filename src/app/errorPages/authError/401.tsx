import ErrorLayout from './errorLayout';

export default function errorUnauthorized() {
  return (
    <div>
      <ErrorLayout
        statusCode="401"
        title="Unathorised Ascess"
        message="You must be logged in to view this page. Please log in and try again."
      />
    </div>
  );
}
