import { api } from "../api/client";
import { NewsCard } from "../components/NewsCard";
import { Empty, Spinner, useApi } from "../components/ui";

export default function News() {
  const { data, loading } = useApi(() => api.getFeed());
  return (
    <>
      <h1 className="section-title" style={{ marginTop: 0 }}>News & events</h1>
      {loading ? (
        <Spinner />
      ) : data && data.length ? (
        <div className="grid cols-3">
          {data.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Empty icon="news" title="Nothing here yet" subtitle="News and events will appear here." />
      )}
    </>
  );
}
