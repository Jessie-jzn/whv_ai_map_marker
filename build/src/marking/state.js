// 批量标注流程的全局状态
// ----------------------------------------------------------------------------
// 拿出来做单独模块，是因为这些状态在 progress.js / runner.js / ui.js 都会读写。
// 用 setter 包一层，避免外部直接 `markingState.isMarking = true` 这种写法，
// 也方便以后做副作用（比如改成事件总线）。
// ----------------------------------------------------------------------------

const state = {
  // true 表示正在跑 runMarking()，UI 应禁用启动按钮、显示暂停按钮
  isMarking: false,
  // true 表示用户按了暂停，runner 会停在循环里等下一次 resume
  isPaused: false,
  // setTimeout 的句柄，进度条延迟隐藏用；同时也用作"还在等待复位"的信号
  progressResetTimer: null,
};

export const isMarking = () => state.isMarking;
export const isPaused = () => state.isPaused;
export const getProgressResetTimer = () => state.progressResetTimer;

export function setMarking(v) {
  state.isMarking = !!v;
}
export function setPaused(v) {
  state.isPaused = !!v;
}
export function setProgressResetTimer(handle) {
  state.progressResetTimer = handle;
}

/** 清掉延迟复位定时器（在新一轮 runMarking 开始时调用，避免叠加）。 */
export function clearProgressResetTimer() {
  if (state.progressResetTimer) {
    clearTimeout(state.progressResetTimer);
  }
  state.progressResetTimer = null;
}
