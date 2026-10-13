// 进度条与按钮状态控制
// ----------------------------------------------------------------------------
// 这些函数都是 UI 副作用（直接操作 DOM）。把它们集中放在这里，让 runner.js
// 关心"业务流程"、UI 关心"样式表现"。
// ----------------------------------------------------------------------------

import {
  isPaused,
  setProgressResetTimer,
  clearProgressResetTimer,
} from "./state.js";

/**
 * 根据"是否正在跑"切换主按钮和暂停/继续按钮的可见态。
 * running=true 时禁用 markButton/quickMarkButton、显示 pauseButton。
 */
export function setButtonsRunningState(running) {
  const markButton = document.getElementById("markButton");
  const quickMarkButton = document.getElementById("quickMarkButton");
  const pauseButton = document.getElementById("pauseButton");
  const resumeButton = document.getElementById("resumeButton");
  if (markButton) markButton.disabled = running;
  if (quickMarkButton) quickMarkButton.disabled = running;
  if (pauseButton) pauseButton.style.display = running ? "block" : "none";
  if (resumeButton) resumeButton.style.display = "none";
}

/**
 * 把进度条更新到指定百分比。
 * 自动 clamp 到 0–100，并强制把容器显出来。
 */
export function setProgress(percent) {
  const wrap = document.getElementById("progressWrap");
  const fill = document.getElementById("progressFill");
  const text = document.getElementById("progressText");
  if (!wrap || !fill || !text) return;
  const n = Number(percent);
  const safe = Math.max(
    0,
    Math.min(100, Math.round(Number.isFinite(n) ? n : 0))
  );
  wrap.style.display = "block";
  fill.style.width = `${safe}%`;
  text.textContent = `${safe}%`;
}

/**
 * 一轮标注开始时调用。
 * 立刻清掉延迟复位 timer，再画一个"几乎为 0"的进度，让用户立刻看到反馈。
 */
export function startProgress(total) {
  clearProgressResetTimer();
  if (total > 0) {
    setProgress((1 / total) * 5);
  } else {
    setProgress(0);
  }
}

/** 一轮成功完成时调用，把进度条拉满到 100%。 */
export function finishProgress() {
  setProgress(100);
}

/**
 * 完成或出错后，1.2 秒延迟把进度条隐藏 + 复位为 0%。
 * 故意慢一拍，让用户能看到"满"的瞬间反馈。
 */
export function resetProgressLater() {
  clearProgressResetTimer();
  const handle = setTimeout(() => {
    setProgressResetTimer(null);
    const wrap = document.getElementById("progressWrap");
    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (!wrap || !fill || !text) return;
    wrap.style.display = "none";
    fill.style.width = "0%";
    text.textContent = "0%";
  }, 1200);
  setProgressResetTimer(handle);
}

/**
 * runMarking 内部循环每次开头调用，按下"暂停"时会一直 hang 在这里，
 * 直到用户点继续把 isPaused 置回 false。轮询间隔 200ms 对 UI 来说够快也不费 CPU。
 */
export async function waitWhilePaused() {
  while (isPaused()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
