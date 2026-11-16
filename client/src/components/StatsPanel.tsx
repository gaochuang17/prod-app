import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic } from "antd";
import { fetchSummary, type RecordSummary } from "../api/records";

interface StatsPanelProps {
  refreshKey: number;
}

export function StatsPanel({ refreshKey }: StatsPanelProps) {
  const [summary, setSummary] = useState<RecordSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={8}>
        <Card size="small">
          <Statistic
            title="总收入"
            value={summary?.totalIncome ?? 0}
            precision={2}
            prefix="¥"
            valueStyle={{ color: "#3f8600" }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card size="small">
          <Statistic
            title="总支出"
            value={summary?.totalExpense ?? 0}
            precision={2}
            prefix="¥"
            valueStyle={{ color: "#cf1322" }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card size="small">
          <Statistic
            title="结余"
            value={summary?.balance ?? 0}
            precision={2}
            prefix="¥"
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  );
}
