import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import {
  createRecord,
  deleteRecord,
  fetchRecords,
  type Record,
  type RecordType,
} from "../api/records";
import styles from "./RecordPanel.module.css";

const EXPENSE_CATEGORIES = ["餐饮", "交通", "购物", "娱乐", "居住", "医疗", "其他"];
const INCOME_CATEGORIES = ["工资", "奖金", "理财", "红包", "其他"];

interface RecordFormValues {
  type: RecordType;
  amount: number;
  category: string;
  note?: string;
  date: Dayjs;
}

interface RecordPanelProps {
  onChanged: () => void;
}

export function RecordPanel({ onChanged }: RecordPanelProps) {
  const [form] = Form.useForm<RecordFormValues>();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedType = Form.useWatch("type", form) ?? "expense";
  const categories = selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await fetchRecords());
    } catch {
      message.error("加载账单失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleFinish = async (values: RecordFormValues) => {
    setSubmitting(true);
    try {
      await createRecord({
        type: values.type,
        amount: values.amount,
        category: values.category,
        note: values.note?.trim() ?? "",
        date: values.date.format("YYYY-MM-DD"),
      });
      form.resetFields();
      form.setFieldsValue({ type: "expense", date: dayjs() });
      message.success("记账成功");
      await loadRecords();
      onChanged();
    } catch {
      message.error("记账失败，请检查填写内容");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id);
      message.success("删除成功");
      await loadRecords();
      onChanged();
    } catch {
      message.error("删除失败");
    }
  };

  const columns: ColumnsType<Record> = [
    { title: "日期", dataIndex: "date", width: 110 },
    {
      title: "类型",
      dataIndex: "type",
      width: 80,
      render: (_, record) =>
        record.type === "income" ? (
          <Tag color="success">收入</Tag>
        ) : (
          <Tag color="error">支出</Tag>
        ),
    },
    { title: "分类", dataIndex: "category", width: 90 },
    {
      title: "金额",
      dataIndex: "amount",
      width: 120,
      align: "right",
      render: (_, record) => (
        <span className={record.type === "income" ? styles.income : styles.expense}>
          {record.type === "income" ? "+" : "-"}¥{record.amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: "备注",
      dataIndex: "note",
      ellipsis: true,
      render: (note: string) => note || "-",
    },
    {
      title: "操作",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Popconfirm title="确定删除该记录？" onConfirm={() => void handleDelete(record.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} title="删除" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Card title="记一笔" size="small" className={styles.panel}>
        <Form<RecordFormValues>
          form={form}
          className={styles.form}
          layout="inline"
          onFinish={(values) => void handleFinish(values)}
          initialValues={{ type: "expense", date: dayjs() }}
          onValuesChange={(changed) => {
            if ("type" in changed) {
              form.setFieldValue("category", undefined);
            }
          }}
        >
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="expense">支出</Radio.Button>
              <Radio.Button value="income">收入</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true, message: "请输入金额" }]}>
            <InputNumber
              min={0.01}
              precision={2}
              placeholder="0.00"
              className={styles.amountInput}
            />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: "请选择分类" }]}>
            <Select
              placeholder="选择分类"
              className={styles.categorySelect}
              options={categories.map((category) => ({ value: category, label: category }))}
            />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input
              placeholder="选填"
              className={styles.noteInput}
              maxLength={50}
              allowClear
            />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: "请选择日期" }]}>
            <DatePicker
              className={styles.datePicker}
              allowClear={false}
              disabledDate={(current) => current.isAfter(dayjs(), "day")}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={submitting}>
              记一笔
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="账单明细" size="small" className={styles.panel}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty description="暂无账单，记第一笔吧" /> }}
        />
      </Card>
    </>
  );
}
