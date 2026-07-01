import { Empty } from "../../components/ui";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="card">
      <Empty title={title} subtitle="This route is preserved for the existing workflow." />
    </div>
  );
}
