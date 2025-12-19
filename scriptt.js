/// Elements

/// Timer
const timer = document.querySelector(".timer");
const timerInnerEl = document.querySelector(".timer__inner");
const timeDisplayEl = document.getElementById("time");
const timeMinutesEl = document.getElementById("time__minutes");
const timeSecondsEl = document.getElementById("time__seconds");

const timerArcEl = document.getElementById("timer-arc");
const timerStatusEl = document.getElementById("timer__status");
const bellEl = new Audio("./assets/singing-bowl-strike-sound-84682.mp3");
/// Arc
let centerX = timerInnerEl.offsetWidth / 2;
let centerY = timerInnerEl.offsetHeight / 2;
let radius = centerX * 0.9;
const startAngle = 0;
const endAngle = 359.9;

/// Modus Switch
const modusEl = document.querySelector(".modus-switch");
const pomodoroBtnEl = document.getElementById("pomodoroBtn");
const shortBreakBtnEl = document.getElementById("shortBreakBtn");
const longBreakBtnEl = document.getElementById("longBreakBtn");

//////////////
// Code snippet from [@opsb](https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle)

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
  return d;
}

// Snippet End

// Helpers

const minsToSec = (minutes) => minutes * 60;
const stringifySeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const sec =
    String(seconds % 60).length === 1 ? `0${seconds % 60}` : `${seconds % 60}`;
  // return `${minutes}:${sec}`;
  appliedState.displayMins = String(minutes);
  appliedState.displaySec = String(sec);
};

/// App functions

const INITIAL_STATE = {
  bodyTheme: "theme-1",
  bodyFont: "font-1",
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 10,
  modus: "pomodoro",
  fullTime: 15000,
  secToGo: 1500,
  tenthSecToGo: 15000,
  active: false,
  displayMins: "25",
  displaySec: "00",
};

let intervallID;

const appliedState = {
  ...INITIAL_STATE,
};

const updateArc = function () {
  const newEndAngle =
    appliedState.tenthSecToGo === 0
      ? 359.9
      : (appliedState.tenthSecToGo * 359.9) / appliedState.fullTime;
  timerArcEl.setAttribute(
    "d",
    describeArc(centerX, centerY, radius, startAngle, newEndAngle)
  );
};

const countDown = function () {
  appliedState.tenthSecToGo--;
  if (appliedState.tenthSecToGo % 10 === 0) {
    appliedState.secToGo--;
    // timeDisplayEl.textContent = stringifySeconds(appliedState.secToGo);
    stringifySeconds(appliedState.secToGo);
    timeMinutesEl.textContent = appliedState.displayMins;
    timeSecondsEl.textContent = appliedState.displaySec;
  }
};

const pauseTimer = function () {
  appliedState.active = false;
  clearInterval(intervallID);

  timerStatusEl.textContent = "restart";
  if (!appliedState.secToGo) {
    if (appliedState.modus === "pomodoro") timerStatusEl.textContent = "break";
    else timerStatusEl.textContent = "pomodoro";
  }
};

const startTimer = function () {
  appliedState.active = true;
  countDown();
  updateArc();
  timerStatusEl.textContent = "pause";

  intervallID = setInterval(() => {
    if (appliedState.tenthSecToGo === 1) {
      countDown();
      bellEl.play();
      updateArc();

      pauseTimer();
    } else {
      countDown();
      updateArc();
    }
  }, 100);
};

const toggleTimer = function () {
  if (appliedState.active) pauseTimer();
  else startTimer();
};

const switchModus = function (button) {
  pauseTimer();
  [pomodoroBtnEl, shortBreakBtnEl, longBreakBtnEl].forEach((element) =>
    element.classList.remove("btn--active")
  );
  button.classList.add("btn--active");
  appliedState.modus = button.value;
  appliedState.secToGo = minsToSec(appliedState[appliedState.modus]);
  appliedState.fullTime = appliedState.secToGo * 10;
  appliedState.tenthSecToGo = appliedState.fullTime;
  // timeDisplayEl.textContent = stringifySeconds(appliedState.secToGo);
  stringifySeconds(appliedState.secToGo);
  timeMinutesEl.textContent = appliedState.displayMins;
  timeSecondsEl.textContent = appliedState.displaySec;
  timerStatusEl.textContent = "start";
};

/// Event Listeners
const setupListeners = function () {
  modusEl.addEventListener("click", (e) => {
    const button = e.target.closest(".btn");
    if (!button) return;
    switchModus(button);
  });

  window.addEventListener("DOMContentLoaded", function () {
    timerArcEl.setAttribute(
      "d",
      describeArc(centerX, centerY, radius, startAngle, endAngle)
    );
  });

  const resizeObserver = new ResizeObserver((e) => {
    for (const entry of e) {
      if (!entry.target === ".inner__timer") return;
      centerX = entry.contentRect.width / 2;
      centerY = entry.contentRect.height / 2;
      radius = centerX * 0.9;
      updateArc();
    }
  });

  resizeObserver.observe(timerInnerEl);

  timer.addEventListener("click", () => {
    if (timerStatusEl.textContent === "break") switchModus(shortBreakBtnEl);
    else if (timerStatusEl.textContent === "pomodoro")
      switchModus(pomodoroBtnEl);
    else toggleTimer();
  });
};

const init = function () {
  document.body.style.height = window.innerHeight;
  // Only timer and mode switch listeners needed
  modusEl.addEventListener("click", (e) => {
    const button = e.target.closest(".btn");
    if (!button) return;
    switchModus(button);
  });
  window.addEventListener("DOMContentLoaded", function () {
    timerArcEl.setAttribute(
      "d",
      describeArc(centerX, centerY, radius, startAngle, endAngle)
    );
  });
  const resizeObserver = new ResizeObserver((e) => {
    for (const entry of e) {
      if (!entry.target === ".inner__timer") return;
      centerX = entry.contentRect.width / 2;
      centerY = entry.contentRect.height / 2;
      radius = centerX * 0.9;
      updateArc();
    }
  });
  resizeObserver.observe(timerInnerEl);
  timer.addEventListener("click", () => {
    if (timerStatusEl.textContent === "break") switchModus(shortBreakBtnEl);
    else if (timerStatusEl.textContent === "pomodoro")
      switchModus(pomodoroBtnEl);
    else toggleTimer();
  });
};

init();
