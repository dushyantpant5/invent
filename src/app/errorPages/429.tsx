import ErrorLayout from './errorLayout';

export default function errortooManyRequest() {
  return (
    <div>
      <ErrorLayout
        statusCode="429"
        title="Too Many Request"
        message="You’re sending requests too quickly. Please wait and try again later."
      />
    </div>
  );
}
