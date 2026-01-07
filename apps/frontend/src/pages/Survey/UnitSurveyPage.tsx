import { useParams } from "react-router-dom";

export default function UnitSurveyPage() {
  const { unit_id } = useParams<{ unit_id: string }>();

  return (
    <div>
      <h1>Unit Survey</h1>
      <p>Unit ID: {unit_id}</p>
      <p>Survey content will go here...</p>
    </div>
  );
}
