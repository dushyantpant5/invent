import ErrorLayout from './errorLayout';

export default function errorMaintenance() {
  return (
    <div>
      <ErrorLayout
        statusCode="https://i.ibb.co/fV6WHynP/20945385.jpg"
        title="Under Maintenance"
        message="We’re currently performing scheduled maintenance. Please check back shortly."
      />
    </div>
  );
}
