import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic } from "antd";
import { fetchSummary, type RecordSummary } from "../api/records";
import styles from "./StatsPanel.module.css";

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
    <Row gutter={[16, 16]} className={styles.statsRow}>
      <Col xs={24} sm={8}>
        <Card size="small">
          <Statistic
            title="总收入"
            value={summary?.totalIncome ?? 0}
            precision={2}
            prefix="¥"
            className={styles.incomeStatistic}
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
            className={styles.expenseStatistic}
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
