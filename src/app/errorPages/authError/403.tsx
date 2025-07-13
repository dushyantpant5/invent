import ErrorLayout from './errorLayout';

export default function errorForbidden() {
  return (
    <div>
      <ErrorLayout
        statusCode="403"
        title="Forbidden"
        message="You do not have the necessary permissions to access this page"
      />
    </div>
  );
}
