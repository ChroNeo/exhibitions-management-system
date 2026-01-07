import { useParams } from "react-router-dom";

export default function ExhibitionSurveyPage() {
  const { ex_id } = useParams<{ ex_id: string }>();

  return (
    <div>
      <h1>Exhibition Survey</h1>
      <p>Exhibition ID: {ex_id}</p>
      <p>Survey content will go here...</p>
    </div>
  );
}
