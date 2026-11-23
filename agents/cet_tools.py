"""
四六级备考工具集（CET4/CET6 Tools）
=========================================

为主 Agent 提供 5 个简单工具：
  1. create_study_plan — 根据考试日期和每天学习时间生成备考计划
  2. query_vocab       — 查询单个单词（释义 + 例句）
  3. get_vocab_list    — 随机取一批单词（用于每日背词）
  4. make_vocab_quiz   — 生成词汇选择题（含答案）
  5. text_statistics   — 文本字数统计（复用 Starter 原有工具）

词汇数据保存在本目录 data/ 下的 JSON 文件中，不使用数据库。
"""

import json
import random
from datetime import datetime
from pathlib import Path
from typing import Annotated

from agents import function_tool

# 复用 Starter 原有的字数统计工具
from ._tools import text_statistics

_DATA_DIR = Path(__file__).resolve().parent / "data"
_LEVEL_FILES = {
    "cet4": "cet4_words.json",
    "cet6": "cet6_words.json",
}


def _load_words(level: str) -> list:
    """按级别读取词汇 JSON 文件，读取失败时返回空列表。"""
    filename = _LEVEL_FILES.get(str(level).lower())
    if not filename:
        return []
    try:
        with open(_DATA_DIR / filename, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return []


# ========== 工具 1：备考计划 ==========
@function_tool
def create_study_plan(
    level: Annotated[str, "考试级别：cet4 或 cet6"],
    exam_date: Annotated[str, "考试日期，格式 YYYY-MM-DD"],
    daily_minutes: Annotated[int, "每天学习分钟数，例如 120"],
) -> str:
    """根据考试级别、考试日期和每天学习时间，生成一份简单的分阶段备考计划。"""
    try:
        exam = datetime.strptime(exam_date, "%Y-%m-%d")
        days_left = (exam - datetime.now()).days
    except ValueError:
        days_left = 60  # 日期解析失败时给一个默认值
    days_left = max(days_left, 7)  # 至少按 7 天规划

    minutes = min(max(int(daily_minutes), 30), 480)
    daily_words = 20 if str(level).lower() == "cet4" else 15

    p1 = max(int(days_left * 0.4), 3)  # 词汇积累
    p2 = max(int(days_left * 0.4), 3)  # 真题训练
    p3 = max(days_left - p1 - p2, 2)   # 冲刺复习

    plan = {
        "level": "英语四级(CET4)" if str(level).lower() == "cet4" else "英语六级(CET6)",
        "exam_date": exam_date,
        "days_left": days_left,
        "daily_minutes": minutes,
        "phases": [
            {
                "phase": "第 1 阶段：词汇积累",
                "days": p1,
                "content": f"每天花 {minutes // 2} 分钟背 {daily_words} 个核心词，"
                           f"其余时间做 1 篇真题阅读并记下生词。",
            },
            {
                "phase": "第 2 阶段：真题训练",
                "days": p2,
                "content": f"每 2 天完成 1 套真题（阅读 + 翻译 + 写作），"
                           f"每天花 {minutes // 3} 分钟复习错题和生词。",
            },
            {
                "phase": "第 3 阶段：冲刺复习",
                "days": p3,
                "content": "隔天 1 套模拟题保持手感，重点背诵之前记录的错词，"
                           "整理作文模板和翻译常用表达。",
            },
        ],
    }
    return json.dumps(plan, ensure_ascii=False)


# ========== 工具 2：查询单词 ==========
@function_tool
def query_vocab(
    level: Annotated[str, "词汇级别：cet4 或 cet6"],
    word: Annotated[str, "要查询的英文单词"],
) -> str:
    """查询指定级别词库中的一个单词，返回中文释义和英文例句。"""
    words = _load_words(level)
    target = str(word).strip().lower()
    for item in words:
        if item["word"].lower() == target:
            return json.dumps(item, ensure_ascii=False)
    return json.dumps(
        {"found": False, "message": f"词库中未收录单词 {word}，请尝试其他单词。"},
        ensure_ascii=False,
    )


# ========== 工具 3：随机取一批单词 ==========
@function_tool
def get_vocab_list(
    level: Annotated[str, "词汇级别：cet4 或 cet6"],
    count: Annotated[int, "单词数量，建议 5 到 10 个"],
) -> str:
    """从指定级别词库中随机取一批单词，返回单词、中文释义和英文例句。"""
    words = _load_words(level)
    if not words:
        return json.dumps({"error": "词库为空或读取失败"}, ensure_ascii=False)
    count = min(max(int(count), 1), len(words))
    picked = random.sample(words, count)
    return json.dumps({"level": str(level).lower(), "words": picked}, ensure_ascii=False)


# ========== 工具 4：词汇选择题 ==========
@function_tool
def make_vocab_quiz(
    level: Annotated[str, "词汇级别：cet4 或 cet6"],
    count: Annotated[int, "题目数量，建议 5 道"],
) -> str:
    """从指定级别词库随机出词汇选择题：给出单词，从 4 个中文释义中选择正确的。"""
    words = _load_words(level)
    if len(words) < 4:
        return json.dumps({"error": "词库词汇不足，无法出题"}, ensure_ascii=False)

    count = min(max(int(count), 1), 10)
    picked = random.sample(words, count)
    questions = []
    for i, item in enumerate(picked, start=1):
        distractors = random.sample(
            [w for w in words if w["word"] != item["word"]], 3
        )
        options = [item["meaning"]] + [d["meaning"] for d in distractors]
        random.shuffle(options)
        questions.append({
            "id": i,
            "word": item["word"],
            "options": options,
            "answer": item["meaning"],
        })
    return json.dumps({"level": str(level).lower(), "questions": questions}, ensure_ascii=False)


# ========== 工具 5：text_statistics 复用自 agents/_tools.py ==========
__all__ = [
    "create_study_plan",
    "query_vocab",
    "get_vocab_list",
    "make_vocab_quiz",
    "text_statistics",
]
