import { useEffect, useState } from "react";
import { Alert, Card, Space, Spin, Tag, Typography } from "antd";
import { fetchHealth, type HealthResponse } from "../api/health";

const { Text } = Typography;

export function HealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setError("无法连接后端服务，请确认服务已启动"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="服务状态" size="small" style={{ marginBottom: 16 }}>
      {loading && <Spin size="small" />}
      {error && <Alert type="error" message={error} showIcon />}
      {health && (
        <Space size="middle" wrap>
          <Tag color="success">运行中</Tag>
          <Text type="secondary">已运行 {health.uptimeSeconds} 秒</Text>
          <Text type="secondary">{health.timestamp}</Text>
        </Space>
      )}
    </Card>
  );
}
