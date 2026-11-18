import { useCallback, useState } from "react";
import { Layout, Typography } from "antd";
import { RecordPanel } from "./components/RecordPanel";
import { StatsPanel } from "./components/StatsPanel";
import styles from "./App.module.css";

const { Content } = Layout;

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRecordsChanged = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <Typography.Title level={4} className={styles.title}>
          记账本
        </Typography.Title>
        <StatsPanel refreshKey={refreshKey} />
        <RecordPanel onChanged={handleRecordsChanged} />
      </Content>
    </Layout>
  );
}

export default App;
