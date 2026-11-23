"""
Export-report handler — EdgeOne Makers Python cloud function.

POST /export-report
  Body:    { stats: { quizRounds, wrongWords: [...], translateCount,
                      essayCount, hasStudyPlan, planContent } }
  Returns: .docx 二进制流（Content-Disposition: attachment）

用 python-docx 把前端传来的学习记录统计生成一份简单的 Word 学习报告。
"""

import json
import sys
import traceback
from datetime import datetime
from http.server import BaseHTTPRequestHandler

try:
    from docx import Document
    from docx.shared import Pt
except ImportError:  # 部署环境缺少依赖时给出明确报错
    Document = None


def _read_body(rfile, headers) -> dict:
    """Decode the JSON request body; return an empty dict on any failure."""
    length = int(headers.get("Content-Length") or 0)
    if length <= 0:
        return {}
    try:
        return json.loads(rfile.read(length).decode("utf-8")) or {}
    except (ValueError, UnicodeDecodeError):
        return {}


def _add_heading(doc, text: str) -> None:
    h = doc.add_heading(text, level=2)
    for run in h.runs:
        run.font.size = Pt(14)


def _build_docx(stats: dict):
    """根据统计数据生成 Word 文档对象。"""
    doc = Document()

    title = doc.add_heading("四六级智学通 · 学习报告", level=1)
    title.alignment = 1  # 居中
    doc.add_paragraph(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # 一、总体统计
    _add_heading(doc, "一、学习统计")
    doc.add_paragraph(f"词汇测试：完成 {stats.get('quizRounds', 0)} 轮选择题测试")
    doc.add_paragraph(f"翻译练习：共 {stats.get('translateCount', 0)} 次")
    doc.add_paragraph(f"作文批改：共 {stats.get('essayCount', 0)} 次")
    doc.add_paragraph(
        f"备考计划：{'已制定' if stats.get('hasStudyPlan') else '暂未制定'}"
    )

    # 二、错词本
    _add_heading(doc, "二、错词本")
    wrong_words = stats.get("wrongWords") or []
    if wrong_words:
        table = doc.add_table(rows=1, cols=3)
        table.style = "Table Grid"
        hdr = table.rows[0].cells
        hdr[0].text = "单词"
        hdr[1].text = "释义"
        hdr[2].text = "错误次数"
        for item in wrong_words:
            row = table.add_row().cells
            row[0].text = str(item.get("word", ""))
            row[1].text = str(item.get("meaning", ""))
            row[2].text = str(item.get("count", 0))
    else:
        doc.add_paragraph("暂无错词，继续保持！")

    # 三、备考计划内容
    plan_content = str(stats.get("planContent") or "").strip()
    if plan_content:
        _add_heading(doc, "三、我的备考计划")
        for line in plan_content.splitlines():
            if line.strip():
                doc.add_paragraph(line)

    return doc


class handler(BaseHTTPRequestHandler):
    def _write_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=UTF-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if Document is None:
            self._write_json(500, {"status": "error", "message": "python-docx is not installed"})
            return

        body = _read_body(self.rfile, self.headers)
        stats = body.get("stats") or {}

        try:
            doc = _build_docx(stats)
            import io

            buf = io.BytesIO()
            doc.save(buf)
            data = buf.getvalue()

            # ASCII 文件名保证兼容，UTF-8 文件名供浏览器显示中文
            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            self.send_header(
                "Content-Disposition",
                "attachment; filename=\"study_report.docx\"; "
                "filename*=UTF-8''%E5%AD%A6%E4%B9%A0%E6%8A%A5%E5%91%8A.docx",
            )
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        except Exception as e:
            traceback.print_exc()
            self._write_json(500, {"status": "error", "message": str(e)})
