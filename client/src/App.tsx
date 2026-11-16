import { useCallback, useState } from "react";
import { Layout, Typography } from "antd";
import { HealthPanel } from "./components/HealthPanel";
import { RecordPanel } from "./components/RecordPanel";
import { StatsPanel } from "./components/StatsPanel";

const { Content } = Layout;

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRecordsChanged = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        <Typography.Title level={4} style={{ marginBottom: 20 }}>
          记账本
        </Typography.Title>
        <HealthPanel />
        <StatsPanel refreshKey={refreshKey} />
        <RecordPanel onChanged={handleRecordsChanged} />
      </Content>
    </Layout>
  );
}

export default App;
